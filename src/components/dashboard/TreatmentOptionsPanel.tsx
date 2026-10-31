import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PHASES } from "@/lib/dentalPhases";
import { ACCEPTANCE, itemPhase, nextOptionLabel, splitCost, type Acceptance } from "@/lib/treatmentOptions";
import { isInvoiced } from "@/hooks/useVisitFlow";
import { Copy, Receipt, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { usePatientConsentForms } from "@/hooks/useConsentForms";
import { consentCategory, hasSignedConsent } from "@/lib/consentSmartTags";

const db = supabase as any;
const ACC_VARIANT: Record<Acceptance, "default" | "secondary" | "outline" | "destructive"> = {
  proposed: "outline", accepted: "default", declined: "destructive", referred: "secondary",
};

interface Props {
  plans: any[];
  orgId?: string;
  patientId: string;
  canEdit: boolean;
  fmt: (n: number) => string;
  onToggleItem: (item: any, done: boolean) => void;
  busy?: boolean;
  basePath?: string;
}

export function TreatmentOptionsPanel({ plans, orgId, patientId, canEdit, fmt, onToggleItem, busy, basePath = "/dashboard" }: Props) {
  const qc = useQueryClient();
  const [working, setWorking] = useState<string | null>(null);
  const { data: consents = [] } = usePatientConsentForms(patientId);
  const toggle = (it: any, isDone: boolean) => {
    if (!isDone && !hasSignedConsent(it, consents)) {
      const ok = window.confirm(`No signed ${consentCategory(it.description)} consent covers "${it.description}"${it.tooth_number ? ` on tooth ${it.tooth_number}` : ""}. Mark it done anyway?`);
      if (!ok) return;
    }
    onToggleItem(it, isDone);
  };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["patient-treatment-plans", patientId] });
    qc.invalidateQueries({ queryKey: ["treatment-plans"] });
    qc.invalidateQueries({ queryKey: ["patient-plan-items"] });
  };

  // Group competing options; plans without a group stand alone.
  const groups = new Map<string, any[]>();
  for (const p of plans) {
    const k = p.option_group || p.id;
    groups.set(k, [...(groups.get(k) || []), p]);
  }

  async function run(id: string, fn: () => Promise<any>, ok?: string) {
    setWorking(id);
    try {
      const r = await fn();
      if (r?.error) throw r.error;
      if (ok) toast({ title: ok });
      refresh();
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally { setWorking(null); }
  }

  const setPlan = (p: any, patch: Record<string, any>) => run(p.id, () => db.from("treatment_plans").update(patch).eq("id", p.id));
  const setItem = (id: string, patch: Record<string, any>) => run(id, () => db.from("treatment_plan_items").update(patch).eq("id", id));

  async function setAcceptance(p: any, group: any[], status: Acceptance) {
    await run(p.id, async () => {
      const r = await db.from("treatment_plans").update({ acceptance_status: status, ...(status === "accepted" ? { status: "active" } : {}) }).eq("id", p.id);
      if (r.error) return r;
      // Accepting one option declines its siblings.
      if (status === "accepted") {
        const others = group.filter((g) => g.id !== p.id && g.acceptance_status !== "declined").map((g) => g.id);
        if (others.length) return db.from("treatment_plans").update({ acceptance_status: "declined" }).in("id", others);
      }
      return r;
    }, `Option ${p.option_label || ""} ${status}`.replace("  ", " "));
  }

  async function addAlternative(p: any, group: any[]) {
    await run(p.id, async () => {
      const groupId = p.option_group || p.id;
      if (!p.option_group) {
        const r = await db.from("treatment_plans").update({ option_group: groupId, option_label: p.option_label || "A" }).eq("id", p.id);
        if (r.error) return r;
      }
      const label = nextOptionLabel([...group.map((g) => g.option_label), p.option_label || "A"]);
      const { data: created, error } = await db.from("treatment_plans").insert({
        org_id: p.org_id, patient_id: p.patient_id, plan_name: `${p.plan_name.replace(/ · Option [A-Z]$/, "")} · Option ${label}`,
        option_group: groupId, option_label: label, acceptance_status: "proposed", status: "draft",
        insurer_name: p.insurer_name, coverage_percent: p.coverage_percent ?? 0, priority: p.priority,
      }).select("id").single();
      if (error) return { error };
      const items = (p.treatment_plan_items || []).filter((i: any) => i.status !== "skipped").map((i: any) => ({
        plan_id: created.id, description: i.description, estimated_cost: i.estimated_cost, tooth_number: i.tooth_number,
        treatment_id: i.treatment_id, visit_number: i.visit_number, phase: i.phase ?? itemPhase(i), insurance_amount: i.insurance_amount ?? 0,
      }));
      if (items.length) return db.from("treatment_plan_items").insert(items);
      return {};
    }, "Alternative option created — edit its procedures in Treatments");
  }

  async function invoicePhase(p: any, phaseId: number, list: any[]) {
    const ready = list.filter((i) => i.status === "completed" && !isInvoiced(i));
    if (!ready.length || !orgId) return;
    await run(`${p.id}-${phaseId}`, () => db.rpc("create_visit_invoice", {
      p_org_id: orgId, p_patient_id: patientId,
      p_lines: ready.map((i) => ({ treatment_id: i.treatment_id || null, description: i.description + (i.tooth_number ? ` · tooth ${i.tooth_number}` : ""), quantity: 1, unit_price: Number(i.estimated_cost || 0) })),
      p_plan_item_ids: ready.map((i) => i.id),
      p_note: `${PHASES[phaseId - 1].title} — ${p.plan_name}`,
    }), "Stage invoice sent to front desk");
    qc.invalidateQueries({ queryKey: ["invoices"] });
  }

  if (!plans.length) {
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No treatment plans yet. Chart a finding on the odontogram and tap "Add to plan".</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([gid, group]) => (
        <div key={gid} className="space-y-3">
          {group.length > 1 && <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Case options · {group.length} alternatives</p>}
          <div className={group.length > 1 ? "grid gap-3 lg:grid-cols-2" : ""}>
            {group.map((plan) => {
              const items = (plan.treatment_plan_items || []).filter((i: any) => i.status !== "skipped");
              const done = items.filter((i: any) => i.status === "completed").length;
              const pct = Number(plan.coverage_percent || 0);
              const totals = items.reduce((a: any, i: any) => {
                const s = splitCost(i.estimated_cost, i.insurance_amount, pct);
                return { fee: a.fee + Number(i.estimated_cost || 0), ins: a.ins + s.insurance, pat: a.pat + s.patient };
              }, { fee: 0, ins: 0, pat: 0 });
              const acc = (plan.acceptance_status || "proposed") as Acceptance;
              return (
                <Card key={plan.id} className={acc === "declined" ? "opacity-70" : ""}>
                  <CardHeader className="pb-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-sm truncate">
                          {plan.option_label && <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded bg-primary text-[11px] text-primary-foreground">{plan.option_label}</span>}
                          {plan.plan_name}
                        </CardTitle>
                        <CardDescription>{plan.start_date || "—"} → {plan.target_end_date || "Ongoing"}</CardDescription>
                      </div>
                      {canEdit ? (
                        <Select value={acc} onValueChange={(v) => setAcceptance(plan, group, v as Acceptance)} disabled={working === plan.id}>
                          <SelectTrigger className="h-7 w-[118px] text-xs capitalize"><SelectValue /></SelectTrigger>
                          <SelectContent>{ACCEPTANCE.map((a) => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <Badge variant={ACC_VARIANT[acc]} className="capitalize">{acc}</Badge>}
                    </div>
                    {canEdit && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Input defaultValue={plan.insurer_name || ""} placeholder="Insurer / HMO" className="h-7 w-36 text-xs"
                          onBlur={(e) => e.target.value !== (plan.insurer_name || "") && setPlan(plan, { insurer_name: e.target.value || null })} />
                        <div className="flex items-center gap-1">
                          <Input type="number" min={0} max={100} defaultValue={pct} className="h-7 w-16 text-xs" aria-label="Coverage percent"
                            onBlur={(e) => { const v = Math.min(100, Math.max(0, Number(e.target.value) || 0)); if (v !== pct) setPlan(plan, { coverage_percent: v }); }} />
                          <span className="text-muted-foreground">% covered</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" disabled={working === plan.id} onClick={() => addAlternative(plan, group)}>
                          <Copy className="h-3 w-3 mr-1" /> Add alternative
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Progress value={items.length ? (done / items.length) * 100 : 0} className="flex-1 h-2" />
                      <span className="text-xs font-medium">{done}/{items.length}</span>
                    </div>
                    {PHASES.map((ph) => {
                      const list = items.filter((i: any) => itemPhase(i) === ph.id);
                      if (!list.length) return null;
                      const sub = list.reduce((s: number, i: any) => s + Number(i.estimated_cost || 0), 0);
                      const billable = list.filter((i: any) => i.status === "completed" && !isInvoiced(i)).length;
                      return (
                        <div key={ph.id} className="rounded-md border border-border/60">
                          <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-1.5">
                            <span className="text-xs font-semibold">{ph.title}</span>
                            <div className="flex items-center gap-2">
                              {canEdit && billable > 0 && (
                                <Button size="sm" variant="secondary" className="h-6 px-2 text-[11px]" disabled={working === `${plan.id}-${ph.id}`} onClick={() => invoicePhase(plan, ph.id, list)}>
                                  <Receipt className="h-3 w-3 mr-1" /> Invoice stage ({billable})
                                </Button>
                              )}
                              <span className="text-xs text-muted-foreground">{fmt(sub)}</span>
                            </div>
                          </div>
                          <ul className="divide-y divide-border/50">
                            {list.map((it: any) => {
                              const isDone = it.status === "completed";
                              const s = splitCost(it.estimated_cost, it.insurance_amount, pct);
                              return (
                                <li key={it.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                                  <input type="checkbox" checked={isDone} disabled={!canEdit || busy}
                                    onChange={() => toggle(it, isDone)}
                                    aria-label={`Mark ${it.description} ${isDone ? "not done" : "done"}`} className="h-4 w-4 accent-primary" />
                                  <span className={`flex-1 min-w-[8rem] ${isDone ? "line-through text-muted-foreground" : ""}`}>
                                    {it.description}
                                    {it.tooth_number && <span className="ml-1 text-xs text-muted-foreground">· tooth {it.tooth_number}</span>}
                                    {consentCategory(it.description) && (hasSignedConsent(it, consents)
                                      ? <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]"><ShieldCheck className="h-2.5 w-2.5 mr-0.5" />consent signed</Badge>
                                      : !isDone && (
                                        <Button asChild size="sm" variant="outline" className="ml-1 h-6 px-2 text-[11px] border-destructive/40 text-destructive hover:bg-destructive/10">
                                          <Link to={`${basePath}/consent-forms?patientId=${patientId}&new=1&planItem=${it.id}&template=${encodeURIComponent(consentCategory(it.description)!)}`} aria-label={`Prepare consent for ${it.description}`}>
                                            <ShieldAlert className="h-3 w-3 mr-1" />Prepare consent
                                          </Link>
                                        </Button>
                                      ))}
                                    {isInvoiced(it) && <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">invoiced</Badge>}
                                  </span>
                                  {canEdit && (
                                    <Select value={String(itemPhase(it))} onValueChange={(v) => setItem(it.id, { phase: Number(v) })}>
                                      <SelectTrigger className="h-6 w-14 text-[11px]" aria-label="Phase"><SelectValue /></SelectTrigger>
                                      <SelectContent>{PHASES.map((p) => <SelectItem key={p.id} value={String(p.id)}>P{p.id}</SelectItem>)}</SelectContent>
                                    </Select>
                                  )}
                                  {canEdit && (
                                    <Input type="number" min={0} defaultValue={Number(it.insurance_amount || 0) || ""} placeholder="Ins. limit" aria-label="Insurance limit"
                                      className="h-6 w-20 text-[11px]"
                                      onBlur={(e) => { const v = Math.max(0, Number(e.target.value) || 0); if (v !== Number(it.insurance_amount || 0)) setItem(it.id, { insurance_amount: v }); }} />
                                  )}
                                  <span className="text-right text-xs shrink-0 w-24">
                                    <span className="block font-medium">{fmt(Number(it.estimated_cost || 0))}</span>
                                    {s.insurance > 0 && <span className="block text-muted-foreground">Pt {fmt(s.patient)}</span>}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                    <div className="space-y-0.5 border-t pt-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Estimated total</span><span className="font-medium">{fmt(totals.fee)}</span></div>
                      {totals.ins > 0 && <>
                        <div className="flex justify-between"><span className="text-muted-foreground">Insurance{plan.insurer_name ? ` (${plan.insurer_name})` : ""}</span><span>−{fmt(totals.ins)}</span></div>
                        <div className="flex justify-between font-semibold"><span>Patient pays</span><span>{fmt(totals.pat)}</span></div>
                      </>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
