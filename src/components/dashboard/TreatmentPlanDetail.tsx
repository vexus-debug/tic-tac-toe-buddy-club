import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, CheckCircle2, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { isInvoiced } from "@/hooks/useVisitFlow";
import {
  useDeletePlan, useDeletePlanItem, useMovePlanItem, useSavePlanItem, useTreatmentPlanItems,
  useUpdatePlan, useUpdatePlanItemStatus, useUpdatePlanStatus, type TreatmentPlan, type TreatmentPlanItem,
} from "@/hooks/useTreatmentPlans";
import type { Treatment } from "@/hooks/useTreatments";

export const PHASES: Record<number, string> = {
  1: "Phase 1 · Urgent / Disease control",
  2: "Phase 2 · Perio / Foundation",
  3: "Phase 3 · Restorative / Prosthetic",
  4: "Phase 4 · Maintenance",
};
export const SURFACES = ["M", "O", "D", "B", "L"] as const;
const fmt = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/10 text-primary",
  "in-progress": "bg-accent text-accent-foreground",
  completed: "bg-secondary/15 text-foreground",
  skipped: "bg-destructive/10 text-destructive",
};

export function SurfacePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const set = new Set((value || "").split("").filter(Boolean));
  return (
    <div className="flex gap-1" role="group" aria-label="Tooth surfaces">
      {SURFACES.map((s) => {
        const on = set.has(s);
        return (
          <button key={s} type="button" aria-pressed={on}
            onClick={() => { const n = new Set(set); on ? n.delete(s) : n.add(s); onChange(SURFACES.filter((x) => n.has(x)).join("")); }}
            className={`h-9 w-9 rounded-md border text-xs font-mono font-semibold transition-colors ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"}`}>
            {s}
          </button>
        );
      })}
    </div>
  );
}

type ItemForm = { id?: string; treatment_id: string; cdt_code: string; description: string; tooth_number: string; surfaces: string; phase: number; visit_number: number; estimated_cost: number; insurance_amount: number; scheduled_date: string; notes: string };

export function TreatmentPlanDetail({ plan, treatments, open, onOpenChange, canEdit, canDelete, siteLabel }: {
  plan: TreatmentPlan | undefined; treatments: Treatment[]; open: boolean; onOpenChange: (o: boolean) => void;
  canEdit: boolean; canDelete: boolean; siteLabel: string;
}) {
  const { data: items = [] } = useTreatmentPlanItems(plan?.id || null);
  const updatePlan = useUpdatePlan();
  const updateStatus = useUpdatePlanStatus();
  const updateItemStatus = useUpdatePlanItemStatus();
  const saveItem = useSavePlanItem();
  const deleteItem = useDeletePlanItem();
  const moveItem = useMovePlanItem();
  const deletePlan = useDeletePlan();
  const [editingPlan, setEditingPlan] = useState(false);
  const [planForm, setPlanForm] = useState<any>({});
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);

  if (!plan) return null;
  const coverage = Number(plan.coverage_percent || 0);
  const active = items.filter((i) => i.status !== "skipped");
  const insOf = (i: TreatmentPlanItem) => Number(i.insurance_amount || 0) || Math.round(Number(i.estimated_cost || 0) * coverage / 100);
  const fee = active.reduce((s, i) => s + Number(i.estimated_cost || 0), 0);
  const ins = active.reduce((s, i) => s + insOf(i), 0);
  const done = items.filter((i) => i.status === "completed").length;
  const sorted = [...items].sort((a, b) => (a.phase || 9) - (b.phase || 9) || a.visit_number - b.visit_number);
  const groups = [1, 2, 3, 4, 0].map((p) => ({ p, rows: sorted.filter((i) => (i.phase || 0) === p) })).filter((g) => g.rows.length);

  const startEditPlan = () => {
    setPlanForm({ plan_name: plan.plan_name, description: plan.description || "", priority: plan.priority, start_date: plan.start_date || "", target_end_date: plan.target_end_date || "", insurer_name: plan.insurer_name || "", coverage_percent: coverage });
    setEditingPlan(true);
  };
  const savePlan = () => updatePlan.mutate({ id: plan.id, patch: { ...planForm, start_date: planForm.start_date || null, target_end_date: planForm.target_end_date || null, insurer_name: planForm.insurer_name || null, coverage_percent: Math.min(100, Math.max(0, Number(planForm.coverage_percent) || 0)) } }, { onSuccess: () => setEditingPlan(false) });

  const newItem = () => setItemForm({ treatment_id: "", cdt_code: "", description: "", tooth_number: "", surfaces: "", phase: 3, visit_number: (Math.max(0, ...items.map((i) => i.visit_number)) + 1), estimated_cost: 0, insurance_amount: 0, scheduled_date: "", notes: "" });
  const editItem = (i: TreatmentPlanItem) => setItemForm({ id: i.id, treatment_id: i.treatment_id || "", cdt_code: i.cdt_code || "", description: i.description, tooth_number: i.tooth_number || "", surfaces: i.surfaces || "", phase: i.phase || 3, visit_number: i.visit_number, estimated_cost: Number(i.estimated_cost), insurance_amount: Number(i.insurance_amount || 0), scheduled_date: i.scheduled_date || "", notes: i.notes || "" });
  const submitItem = () => {
    if (!itemForm || !itemForm.description) return;
    const { id, ...v } = itemForm;
    saveItem.mutate({ id, plan_id: plan.id, values: { ...v, treatment_id: v.treatment_id || null, cdt_code: v.cdt_code || null, tooth_number: v.tooth_number || null, surfaces: v.surfaces || null, scheduled_date: v.scheduled_date || null, notes: v.notes || null } }, { onSuccess: () => setItemForm(null) });
  };

  const move = (i: TreatmentPlanItem, dir: -1 | 1) => {
    const peers = sorted.filter((x) => (x.phase || 0) === (i.phase || 0));
    const idx = peers.findIndex((x) => x.id === i.id);
    const other = peers[idx + dir];
    if (other) moveItem.mutate({ a: { id: i.id, visit_number: i.visit_number }, b: { id: other.id, visit_number: other.visit_number === i.visit_number ? i.visit_number + dir : other.visit_number } });
  };

  const printEstimate = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = sorted.filter((i) => i.status !== "skipped").map((i) => `<tr><td>${i.phase ? "P" + i.phase : ""}</td><td>${i.visit_number}</td><td>${i.cdt_code || ""}</td><td>${i.description}</td><td>${i.tooth_number || ""}${i.surfaces ? " " + i.surfaces : ""}</td><td class=r>${fmt(i.estimated_cost)}</td><td class=r>${fmt(insOf(i))}</td><td class=r>${fmt(Number(i.estimated_cost) - insOf(i))}</td></tr>`).join("");
    w.document.write(`<html><head><title>${plan.plan_name} – Estimate</title><style>body{font-family:system-ui;padding:24px;color:#111}table{width:100%;border-collapse:collapse;font-size:12px}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}.r{text-align:right}.sig{margin-top:48px;display:flex;gap:48px}.sig div{flex:1;border-top:1px solid #111;padding-top:4px;font-size:12px}</style></head><body><h2>Treatment Estimate</h2><p><b>Patient:</b> ${plan.patient_name}<br/><b>Plan:</b> ${plan.plan_name}<br/><b>Date:</b> ${new Date().toLocaleDateString()}${plan.insurer_name ? `<br/><b>Insurer:</b> ${plan.insurer_name} (${coverage}%)` : ""}</p><table><thead><tr><th>Phase</th><th>Visit</th><th>Code</th><th>Procedure</th><th>Site</th><th class=r>Fee</th><th class=r>Insurance</th><th class=r>Patient</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th colspan=5>Total</th><th class=r>${fmt(fee)}</th><th class=r>${fmt(ins)}</th><th class=r>${fmt(fee - ins)}</th></tr></tfoot></table><p style="font-size:11px;color:#555">Estimates only. Insurance amounts are not guaranteed; final cost may change if treatment changes.</p><div class=sig><div>Patient signature / date</div><div>Dentist signature / date</div></div><script>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[calc(100vw-1rem)] sm:w-full bg-card max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2 pr-6">
            <div className="min-w-0">
              <DialogTitle className="truncate">{plan.plan_name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{plan.patient_name} · {done}/{items.length} done</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="capitalize">{plan.status}</Badge>
              <Badge variant="secondary" className="capitalize">{plan.acceptance_status || "proposed"}</Badge>
            </div>
          </div>
        </DialogHeader>

        {editingPlan ? (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Plan name</Label><Input value={planForm.plan_name} onChange={(e) => setPlanForm({ ...planForm, plan_name: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Priority</Label>
                <Select value={planForm.priority} onValueChange={(v) => setPlanForm({ ...planForm, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["low", "normal", "high", "urgent"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-xs">Start</Label><Input type="date" value={planForm.start_date} onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Target end</Label><Input type="date" value={planForm.target_end_date} onChange={(e) => setPlanForm({ ...planForm, target_end_date: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Insurer / HMO</Label><Input value={planForm.insurer_name} onChange={(e) => setPlanForm({ ...planForm, insurer_name: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Coverage %</Label><Input type="number" min={0} max={100} value={planForm.coverage_percent} onChange={(e) => setPlanForm({ ...planForm, coverage_percent: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea rows={2} value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setEditingPlan(false)}>Cancel</Button><Button size="sm" onClick={savePlan} disabled={updatePlan.isPending}>Save</Button></div>
          </div>
        ) : (
          <>
            {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/40 p-2"><p className="text-[10px] uppercase text-muted-foreground">Fee</p><p className="font-bold tabular-nums text-sm">{fmt(fee)}</p></div>
              <div className="rounded-lg bg-muted/40 p-2"><p className="text-[10px] uppercase text-muted-foreground">Insurance{coverage ? ` ${coverage}%` : ""}</p><p className="font-bold tabular-nums text-sm">{fmt(ins)}</p></div>
              <div className="rounded-lg bg-primary/10 p-2"><p className="text-[10px] uppercase text-muted-foreground">Patient pays</p><p className="font-bold tabular-nums text-sm text-foreground">{fmt(fee - ins)}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit && <Button size="sm" variant="outline" onClick={startEditPlan}><Pencil className="h-3.5 w-3.5 mr-1" />Edit plan</Button>}
              {canEdit && (
                <Select value={plan.acceptance_status || "proposed"} onValueChange={(v) => updatePlan.mutate({ id: plan.id, patch: { acceptance_status: v, ...(v === "accepted" ? { status: "active" } : {}) } })}>
                  <SelectTrigger className="h-9 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{["proposed", "accepted", "declined", "referred"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              )}
              <Button size="sm" variant="outline" onClick={printEstimate}><Printer className="h-3.5 w-3.5 mr-1" />Print estimate</Button>
            </div>
          </>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Procedures</h3>
            {canEdit && <Button size="sm" variant="ghost" onClick={newItem}><Plus className="h-3.5 w-3.5 mr-1" />Add procedure</Button>}
          </div>

          {itemForm && (
            <Card className="border-primary/40"><CardContent className="p-3 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2"><Label className="text-xs">From catalog</Label>
                  <Select value={itemForm.treatment_id} onValueChange={(v) => { const t = treatments.find((x) => x.id === v); setItemForm({ ...itemForm, treatment_id: v, ...(t ? { description: t.name, estimated_cost: Number(t.price || 0), cdt_code: t.cdt_code || "" } : {}) }); }}>
                    <SelectTrigger><SelectValue placeholder="Pick treatment" /></SelectTrigger>
                    <SelectContent>{treatments.map((t) => <SelectItem key={t.id} value={t.id}>{t.cdt_code ? `${t.cdt_code} · ` : ""}{t.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-1"><Label className="text-xs">Procedure *</Label><Input value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Code</Label><Input value={itemForm.cdt_code} placeholder="D2740" onChange={(e) => setItemForm({ ...itemForm, cdt_code: e.target.value.toUpperCase() })} /></div>
                <div className="space-y-1"><Label className="text-xs">{siteLabel}</Label><Input value={itemForm.tooth_number} placeholder="e.g. 36" onChange={(e) => setItemForm({ ...itemForm, tooth_number: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Surfaces</Label><SurfacePicker value={itemForm.surfaces} onChange={(v) => setItemForm({ ...itemForm, surfaces: v })} /></div>
                <div className="space-y-1"><Label className="text-xs">Phase</Label>
                  <Select value={String(itemForm.phase)} onValueChange={(v) => setItemForm({ ...itemForm, phase: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PHASES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><Label className="text-xs">Visit #</Label><Input type="number" min={1} value={itemForm.visit_number} onChange={(e) => setItemForm({ ...itemForm, visit_number: parseInt(e.target.value) || 1 })} /></div>
                <div className="space-y-1"><Label className="text-xs">Fee</Label><Input type="number" value={itemForm.estimated_cost} onChange={(e) => setItemForm({ ...itemForm, estimated_cost: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-1"><Label className="text-xs">Insurance pays (0 = use plan %)</Label><Input type="number" value={itemForm.insurance_amount} onChange={(e) => setItemForm({ ...itemForm, insurance_amount: Math.max(0, parseFloat(e.target.value) || 0) })} /></div>
                <div className="space-y-1"><Label className="text-xs">Scheduled</Label><Input type="date" value={itemForm.scheduled_date} onChange={(e) => setItemForm({ ...itemForm, scheduled_date: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Notes</Label><Input value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setItemForm(null)}>Cancel</Button><Button size="sm" onClick={submitItem} disabled={!itemForm.description || saveItem.isPending}>Save procedure</Button></div>
            </CardContent></Card>
          )}

          {groups.map((g) => (
            <div key={g.p} className="space-y-2">
              <p className="text-xs font-semibold text-foreground">{g.p ? PHASES[g.p] : "Unphased"}</p>
              {g.rows.map((item, idx) => {
                const locked = isInvoiced(item);
                return (
                  <Card key={item.id} className="bg-muted/20 border-border/40"><CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{item.visit_number}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.cdt_code && <span className="font-mono text-[10px] mr-1 px-1 rounded bg-muted">{item.cdt_code}</span>}{item.description}</p>
                          <div className="flex flex-wrap gap-x-2 text-[11px] text-muted-foreground mt-0.5">
                            {item.tooth_number && <span>#{item.tooth_number}{item.surfaces ? ` · ${item.surfaces}` : ""}</span>}
                            {item.scheduled_date && <span>{item.scheduled_date}</span>}
                            <span className="tabular-nums">{fmt(item.estimated_cost)} · pt {fmt(Number(item.estimated_cost) - insOf(item))}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge className={`text-[10px] ${statusStyles[item.status] || ""}`}>{locked ? "invoiced" : item.status}</Badge>
                        {canEdit && !locked && (
                          <>
                            <Select value={item.status} onValueChange={(v) => updateItemStatus.mutate({ id: item.id, status: v })}>
                              <SelectTrigger className="h-8 w-28 text-[11px]"><SelectValue /></SelectTrigger>
                              <SelectContent>{["pending", "scheduled", "in-progress", "completed", "skipped"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Move up" disabled={idx === 0} onClick={() => move(item, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Move down" disabled={idx === g.rows.length - 1} onClick={() => move(item, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit procedure" onClick={() => editItem(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Remove procedure" onClick={() => confirm("Remove this procedure?") && deleteItem.mutate({ id: item.id, plan_id: plan.id })}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent></Card>
                );
              })}
            </div>
          ))}
        </div>

        {canEdit && (
          <DialogFooter className="gap-2 flex-wrap">
            {canDelete && <Button variant="ghost" size="sm" className="text-destructive mr-auto" onClick={() => confirm("Delete this plan and all its procedures?") && deletePlan.mutate(plan.id, { onSuccess: () => onOpenChange(false) })}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete plan</Button>}
            {plan.status === "active" && <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: plan.id, status: "paused" })}>Pause</Button>}
            {plan.status === "paused" && <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: plan.id, status: "active" })}>Resume</Button>}
            {plan.status !== "cancelled" && plan.status !== "completed" && <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: plan.id, status: "cancelled" })}>Archive</Button>}
            {plan.status === "active" && <Button size="sm" onClick={() => updateStatus.mutate({ id: plan.id, status: "completed" })}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Complete</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
