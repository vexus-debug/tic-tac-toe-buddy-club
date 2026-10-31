import { useEffect, useMemo, useState } from "react";
import { readVisitNotesDraft, writeVisitNotesDraft, clearVisitNotesDraft } from "@/lib/visitNotesDraft";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, Pill, CalendarPlus, Printer, Plus, CheckCircle2 } from "lucide-react";
import { useTreatments } from "@/hooks/useTreatments";
import { usePatientPlanItems, useTodaysPrescriptions, useCompletePlanItems, useMarkPlanItemsInvoiced, useCompleteAppointment, useActiveVisitAppointment } from "@/hooks/useVisitFlow";
import { CreateInvoiceDialog } from "@/components/dashboard/CreateInvoiceDialog";
import { CreatePrescriptionDialog } from "@/components/dashboard/CreatePrescriptionDialog";
import { BookAppointmentDialog } from "@/components/dashboard/BookAppointmentDialog";
import { printPrescription } from "@/lib/printPrescription";
import { useOrg } from "@/hooks/useOrg";
import { completeQueueForPatient } from "@/hooks/useVisitFlow";
import { setActiveVisit, getActiveVisit } from "@/hooks/useActiveVisit";
import { useInventory } from "@/hooks/useInventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Package, Trash2, NotebookPen, FlaskConical, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { PostOpInstructions } from "@/components/dashboard/PostOpInstructions";
import { askClinicAi, soapNotePrompt, parseSoap, unbilledAuditPrompt, parseAiLines } from "@/lib/aiDental";
import { useDentalChartEntries } from "@/hooks/useDentalCharts";
import { Loader2, SearchCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | null | undefined;
  patientName?: string;
  /** Treatment booked on the appointment, auto-included in the bill. */
  appointmentTreatmentId?: string | null;
  /** Appointment this visit belongs to — marked completed when the visit is finished. */
  appointmentId?: string | null;
}

const naira = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

/** End-of-visit hand-off: review billables, attach prescriptions, send to billing, book recall. */
export function VisitCompletionDialog({ open, onOpenChange, patientId, patientName, appointmentTreatmentId, appointmentId }: Props) {
  const { currentOrg } = useOrg();
  const { data: treatments = [] } = useTreatments();
  const { data: allPlanItems = [] } = usePatientPlanItems(open ? patientId : null);
  // Billable = not yet invoiced. Paid-ahead = invoiced but still in progress (needs "mark done").
  const planItems = useMemo(() => allPlanItems.filter((i) => !i.invoiced), [allPlanItems]);
  const paidAhead = useMemo(() => allPlanItems.filter((i) => i.invoiced), [allPlanItems]);
  const { data: prescriptions = [] } = useTodaysPrescriptions(open ? patientId : null);
  const completeItems = useCompletePlanItems();
  const markInvoiced = useMarkPlanItemsInvoiced();
  const completeAppointment = useCompleteAppointment();
  // When opened from the visit bar, find today's in-progress appointment for this patient.
  const { data: activeAppointmentId } = useActiveVisitAppointment(open && !appointmentId ? patientId : null);

  const qc = useQueryClient();
  const orgId = currentOrg?.org_id;
  // Fix 3: in-visit SOAP notes, saved on finish.
  const emptyNotes = { subjective: "", objective: "", assessment: "", plan: "" };
  const [notes, setNotes] = useState(emptyNotes);
  useEffect(() => { if (open) setNotes({ ...emptyNotes, ...readVisitNotesDraft(patientId) }); }, [open, patientId]);
  useEffect(() => { if (open && patientId) writeVisitNotesDraft(patientId, notes); }, [notes]);
  const PHRASES: Record<keyof typeof emptyNotes, string[]> = {
    subjective: ["Pain on chewing", "Sensitivity to cold", "No complaints", "Bleeding gums"],
    objective: ["Caries noted", "Gingival inflammation", "Tooth mobile", "Oral hygiene fair"],
    assessment: ["Reversible pulpitis", "Irreversible pulpitis", "Gingivitis", "Periapical abscess"],
    plan: ["Restoration done", "Review in 2 weeks", "OHI given", "Analgesics prescribed"],
  };
  const applyTemplate = () => setNotes((n) => ({
    subjective: n.subjective || "Chief complaint: ",
    objective: n.objective || "Exam findings: ",
    assessment: n.assessment || "Diagnosis: ",
    plan: n.plan || "Treatment done today: \nNext visit: ",
  }));
  const addPhrase = (k: keyof typeof emptyNotes, ph: string) =>
    setNotes((n) => ({ ...n, [k]: n[k] ? `${n[k].replace(/\s+$/, "")}${/[:\n]$/.test(n[k].trim()) ? " " : ". "}${ph}` : ph }));
  const { data: chartEntries = [] } = useDentalChartEntries(open && patientId ? patientId : undefined);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysFindings = (chartEntries as any[]).filter((e) => e.entry_date === todayStr)
    .map((e) => `Tooth ${e.tooth_number}: ${String(e.condition || "").replace(/_/g, " ")}${e.surface ? ` (${e.surface})` : ""}${e.notes ? ` – ${e.notes}` : ""}`);
  const [soapLoading, setSoapLoading] = useState(false);
  const draftSoap = async () => {
    if (!orgId || !patientId) return;
    setSoapLoading(true);
    try {
      const reply = await askClinicAi(orgId, soapNotePrompt(patientId, apptTreatment?.name || "", todaysFindings,
        selected.map((i) => `${i.description}${i.tooth_number ? ` (tooth ${i.tooth_number})` : ""}`)), "soap-note");
      const d = parseSoap(reply);
      if (!Object.values(d).some(Boolean)) throw new Error("AI reply could not be read as a SOAP note.");
      setNotes((n) => ({ subjective: d.subjective || n.subjective, objective: d.objective || n.objective, assessment: d.assessment || n.assessment, plan: d.plan || n.plan }));
      toast({ title: "SOAP draft ready", description: "Review and edit before finishing the visit." });
    } catch (e: any) {
      toast({ title: "Couldn't draft notes", description: e?.message, variant: "destructive" });
    } finally { setSoapLoading(false); }
  };

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditDone, setAuditDone] = useState(false);
  const [suggestions, setSuggestions] = useState<{ treatmentId: string; name: string; price: number; reason: string }[]>([]);
  const [aiLines, setAiLines] = useState<{ key: string; treatmentId: string; description: string; unitPrice: number }[]>([]);
  useEffect(() => { if (open) { setSuggestions([]); setAiLines([]); setAuditDone(false); } }, [open, patientId]);
  const runAudit = async () => {
    if (!orgId || !patientId) return;
    setAuditLoading(true);
    try {
      const billedNames = buildLines().map((l) => l.description);
      const reply = await askClinicAi(orgId, unbilledAuditPrompt(patientId, billedNames, treatments.map((t) => t.name)), "unbilled-audit");
      const found = /NOTHING MISSING/i.test(reply) ? [] : parseAiLines(reply).map(([name, reason]) => {
        const t = treatments.find((x) => x.name.toLowerCase() === (name || "").toLowerCase());
        return t ? { treatmentId: t.id, name: t.name, price: Number(t.price) || 0, reason: reason || "" } : null;
      }).filter((x): x is NonNullable<typeof x> => !!x && !billedNames.some((b) => b.toLowerCase().includes(x.name.toLowerCase())));
      setSuggestions(found);
      setAuditDone(true);
    } catch (e: any) {
      toast({ title: "Audit unavailable", description: e?.message, variant: "destructive" });
    } finally { setAuditLoading(false); }
  };
  const acceptSuggestion = (s: { treatmentId: string; name: string; price: number }) => {
    setAiLines((l) => [...l, { key: `ai-${s.treatmentId}`, treatmentId: s.treatmentId, description: s.name, unitPrice: s.price }]);
    setSuggestions((x) => x.filter((y) => y.treatmentId !== s.treatmentId));
  };

  const saveNotes = async (apptId?: string | null) => {
    if (!patientId || !Object.values(notes).some((v) => v.trim())) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("clinical_notes").insert({
      org_id: orgId, patient_id: patientId, appointment_id: apptId || null, created_by: u.user?.id,
      ...Object.fromEntries(Object.entries(notes).map(([k, v]) => [k, v.trim() || null])),
    });
    if (error) toast({ title: "Notes not saved", description: error.message, variant: "destructive" });
    else { clearVisitNotesDraft(patientId); qc.invalidateQueries({ queryKey: ["clinical_notes"] }); }
  };

  // Fix 5: today's lab cases with a fee, added to the bill.
  const { data: labCases = [] } = useQuery({
    queryKey: ["visit-lab-fees", orgId, patientId],
    enabled: open && !!orgId && !!patientId,
    queryFn: async () => {
      const since = new Date(); since.setHours(0, 0, 0, 0);
      const { data, error } = await (supabase as any).from("lab_cases")
        .select("id, case_number, work_type, lab_fee, clinic_fee")
        .eq("org_id", orgId).eq("patient_id", patientId).gte("created_at", since.toISOString());
      if (error) throw error;
      return (data || []).filter((c: any) => Number(c.clinic_fee || c.lab_fee) > 0);
    },
  });
  const [labSel, setLabSel] = useState<Set<string>>(new Set());
  useEffect(() => { setLabSel(new Set(labCases.map((c: any) => c.id))); }, [labCases.length]);
  const labLines = labCases.filter((c: any) => labSel.has(c.id)).map((c: any) => ({
    key: `lab-${c.id}`, treatmentId: null as string | null,
    description: `Lab fee · ${c.work_type || "Lab work"}${c.case_number ? ` (${c.case_number})` : ""}`,
    unitPrice: Number(c.clinic_fee || c.lab_fee) || 0,
  }));
  const { data: inventory = [] } = useInventory();
  const [extras, setExtras] = useState<{ inventory_id: string; qty: number }[]>([]);
  const [newExtra, setNewExtra] = useState({ inventory_id: "", qty: 1 });
  const [loggingExtras, setLoggingExtras] = useState(false);

  /** Logs extra consumables used beyond the treatment's standard material list. */
  const logExtras = async () => {
    // Include an item picked in the selector but not yet added with "+".
    const all = newExtra.inventory_id ? [...extras, newExtra] : extras;
    if (!all.length) return;
    setLoggingExtras(true);
    try {
      for (const e of all) {
        const { error } = await (supabase as any).rpc("record_inventory_movement", {
          p_org_id: currentOrg?.org_id,
          p_inventory_id: e.inventory_id,
          p_type: "usage",
          p_quantity: e.qty,
          p_reference: "Visit extra",
          p_notes: `Extra material used for ${patientName || "patient"}`,
        });
        if (error) throw error;
      }
      toast({ title: "Extra materials logged", description: `${all.length} item(s) deducted from stock.` });
      setExtras([]);
      setNewExtra({ inventory_id: "", qty: 1 });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    } catch (err: any) {
      toast({ title: "Could not log materials", description: err.message, variant: "destructive" });
      throw err;
    } finally {
      setLoggingExtras(false);
    }
  };

  const finishVisit = async (opts?: { draft?: boolean }) => {
    try { await logExtras(); } catch { return; }
    const apptId = appointmentId || activeAppointmentId;
    await saveNotes(apptId);
    // Fix 4: unbilled work becomes a draft invoice for the front desk.
    if (opts?.draft && !billed && patientId) {
      const lines = buildLines();
      if (lines.length) {
        const pending = selected.filter((i) => i.status !== "completed" && i.status !== "in-progress").map((i) => i.id);
        if (pending.length) await completeItems.mutateAsync(pending);
        const { error } = await (supabase as any).rpc("create_visit_invoice", {
          p_org_id: orgId, p_patient_id: patientId,
          p_lines: lines.map((l) => ({ treatment_id: l.treatmentId || null, description: l.description, quantity: 1, unit_price: l.unitPrice })),
          p_plan_item_ids: selected.map((i) => i.id), p_note: null,
        });
        if (error) toast({ title: "Draft invoice failed", description: error.message, variant: "destructive" });
        else {
          toast({ title: "Sent to front desk", description: "A draft invoice is waiting for payment." });
          qc.invalidateQueries({ queryKey: ["invoices"] });
          qc.invalidateQueries({ queryKey: ["patient-plan-items"] });
        }
      }
    }
    if (apptId) { try { await completeAppointment.mutateAsync(apptId); } catch { /* toast handled by hook */ } }
    if (patientId) {
      await completeQueueForPatient(currentOrg?.org_id, patientId);
      qc.invalidateQueries({ queryKey: ["waiting-list"] });
      if (getActiveVisit()?.patientId === patientId) setActiveVisit(null);
    }
    onOpenChange(false);
  };

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [includeAppt, setIncludeAppt] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [rxOpen, setRxOpen] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [invoiceTreatmentIds, setInvoiceTreatmentIds] = useState<string[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<{ key: string; treatmentId?: string | null; description: string; unitPrice: number }[]>([]);
  const [billed, setBilled] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  useEffect(() => { if (open) setBilled(false); }, [open]);

  // Pre-tick completed and in-progress work (patients often pay ahead on long plans).
  useEffect(() => {
    if (!open) return;
    setSelectedItems(new Set(planItems.map((i) => i.id)));
    setIncludeAppt(true);
  }, [open, planItems.length]);

  const apptTreatment = treatments.find((t) => t.id === appointmentTreatmentId);
  const toggle = (id: string) =>
    setSelectedItems((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const selected = planItems.filter((i) => selectedItems.has(i.id));
  const labTotal = labLines.reduce((s: number, l: any) => s + l.unitPrice, 0);
  const total = useMemo(
    () => selected.reduce((s, i) => s + Number(i.estimated_cost || 0), 0) + (includeAppt && apptTreatment ? Number(apptTreatment.price || 0) : 0) + labTotal + aiLines.reduce((s, l) => s + l.unitPrice, 0),
    [selected, includeAppt, apptTreatment, labTotal, aiLines],
  );
  const buildLines = () => {
    const lines = selected.map((i) => ({
      key: i.id, treatmentId: i.treatment_id as string | null,
      description: `${i.description}${i.tooth_number ? ` · #${i.tooth_number}` : ""}`,
      unitPrice: Number(i.estimated_cost) || Number(treatments.find((t) => t.id === i.treatment_id)?.price) || 0,
    }));
    if (includeAppt && apptTreatment && !selected.some((i) => i.treatment_id === apptTreatment.id))
      lines.push({ key: `appt-${apptTreatment.id}`, treatmentId: apptTreatment.id, description: apptTreatment.name, unitPrice: Number(apptTreatment.price) || 0 });
    return [...lines, ...labLines, ...aiLines];
  };

  // Fix 5: material suggestions per procedure.
  const procIds = Array.from(new Set([...selected.map((i) => i.treatment_id), includeAppt ? appointmentTreatmentId : null].filter(Boolean))) as string[];
  const { data: stdMaterials = [] } = useQuery({
    queryKey: ["visit-std-materials", orgId, procIds.join(",")],
    enabled: open && !!orgId && procIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("treatment_materials")
        .select("treatment_id, inventory_id, quantity_used").eq("org_id", orgId).in("treatment_id", procIds);
      if (error) throw error;
      return data || [];
    },
  });
  const KEYWORDS: [RegExp, string[]][] = [
    [/fill|restor|composite/i, ["composite", "bond", "etch", "matrix"]],
    [/root|endo|rct/i, ["file", "gutta", "sealer", "paper point", "hypochlorite"]],
    [/extract|surg/i, ["suture", "gauze", "anaesthe", "anesthe", "blade"]],
    [/scal|polish|clean/i, ["prophy", "paste", "polish"]],
    [/crown|bridge|impress/i, ["impression", "alginate", "temporary"]],
  ];
  const materialSuggestions = procIds.map((tid) => {
    const t = treatments.find((x) => x.id === tid);
    const std = stdMaterials.filter((m: any) => m.treatment_id === tid)
      .map((m: any) => ({ item: inventory.find((i: any) => i.id === m.inventory_id), qty: Math.ceil(Number(m.quantity_used) || 1) }))
      .filter((m: any) => m.item);
    const words = KEYWORDS.find(([re]) => re.test(t?.name || ""))?.[1] || [];
    const guesses = std.length ? [] : inventory.filter((i: any) => words.some((w) => i.name?.toLowerCase().includes(w))).slice(0, 4);
    return { id: tid, name: t?.name || "Procedure", std, guesses };
  }).filter((s) => s.std.length || s.guesses.length);
  // Work done today that nobody has billed yet.
  const unbilledDone = planItems.filter((i) => i.status === "completed").length + (apptTreatment && !billed ? 1 : 0);
  const requestEnd = () => (unbilledDone > 0 && !billed ? setConfirmEnd(true) : finishVisit());
  const NOTE_FIELDS: [keyof typeof emptyNotes, string][] = [["subjective", "Complaint (S)"], ["objective", "Findings (O)"], ["assessment", "Diagnosis (A)"], ["plan", "Plan (P)"]];

  // Next planned visit, used to prefill the follow-up booking.
  const nextPlanned = planItems.find((i) => i.status !== "completed" && i.status !== "in-progress");

  const sendToBilling = async () => {
    const pending = selected.filter((i) => i.status !== "completed" && i.status !== "in-progress").map((i) => i.id);
    if (pending.length) await completeItems.mutateAsync(pending);
    // Carry each plan item with its own plan price and description (incl. uncatalogued work).
    setInvoiceLines(buildLines().filter((l) => !l.key.startsWith("appt-")));
    const planTreatmentIds = selected.map((i) => i.treatment_id);
    setInvoiceTreatmentIds(includeAppt && appointmentTreatmentId && !planTreatmentIds.includes(appointmentTreatmentId) ? [appointmentTreatmentId] : []);
    setInvoiceOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-secondary" /> Finish visit
            </SheetTitle>
            <SheetDescription>{patientName ? `Wrap up ${patientName}'s visit.` : "Wrap up this visit."} Review what to bill, then send to billing.</SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-5">
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billable items</h4>
              {apptTreatment && (
                <label className="flex items-start gap-3 rounded-lg border border-border/40 p-3 cursor-pointer">
                  <Checkbox checked={includeAppt} onCheckedChange={(v) => setIncludeAppt(!!v)} />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{apptTreatment.name}</p>
                    <p className="text-xs text-muted-foreground">Booked treatment</p>
                  </div>
                  <span className="text-sm font-semibold">{naira(apptTreatment.price)}</span>
                </label>
              )}
              {planItems.length === 0 && !apptTreatment && (
                <p className="text-sm text-muted-foreground rounded-lg bg-muted/30 p-3">No treatment plan items for this patient yet. You can still add items on the invoice.</p>
              )}
              {planItems.map((i) => (
                <label key={i.id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3 cursor-pointer">
                  <Checkbox checked={selectedItems.has(i.id)} onCheckedChange={() => toggle(i.id)} />
                  <div className="flex-1 text-sm min-w-0">
                    <p className="font-medium truncate">
                      {i.description}
                      {i.tooth_number ? <span className="text-muted-foreground font-normal"> · #{i.tooth_number}</span> : null}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={i.status === "completed" ? "secondary" : "outline"} className="text-[10px] capitalize">
                        {i.status === "completed" ? "Completed" : i.status === "in-progress" ? "In progress" : i.status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground truncate">{i.plan_name}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{naira(i.estimated_cost)}</span>
                </label>
              ))}
              {aiLines.map((l) => (
                <div key={l.key} className="flex items-center gap-3 rounded-lg border border-secondary/40 p-3 text-sm">
                  <div className="flex-1 min-w-0"><p className="font-medium truncate">{l.description}</p><p className="text-xs text-muted-foreground">Added from AI audit</p></div>
                  <span className="text-sm font-semibold">{naira(l.unitPrice)}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Remove" onClick={() => setAiLines((x) => x.filter((y) => y.key !== l.key))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="rounded-lg bg-muted/20 p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">Anything done today but not on the bill?</p>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={runAudit} disabled={auditLoading || billed}>
                    {auditLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <SearchCheck className="h-3 w-3 mr-1" />} Check missed items
                  </Button>
                </div>
                {suggestions.map((sg) => (
                  <div key={sg.treatmentId} className="flex items-start gap-2 text-xs">
                    <div className="flex-1 min-w-0"><p className="font-medium">{sg.name} · {naira(sg.price)}</p><p className="text-muted-foreground">{sg.reason}</p></div>
                    <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => acceptSuggestion(sg)}><Plus className="h-3 w-3 mr-0.5" /> Add</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => setSuggestions((x) => x.filter((y) => y.treatmentId !== sg.treatmentId))}>Dismiss</Button>
                  </div>
                ))}
                {auditDone && suggestions.length === 0 && <p className="text-[11px] text-muted-foreground">No missed items found.</p>}
              </div>
              {selected.some((i) => i.status !== "completed") && (
                <p className="text-[11px] text-muted-foreground">Ticked pending items will be marked completed. In-progress items stay in progress.</p>
              )}
            </section>

            {paidAhead.length > 0 && (
              <>
                <Separator />
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid ahead — still in progress</h4>
                  {paidAhead.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {i.description}
                          {i.tooth_number ? <span className="text-muted-foreground font-normal"> · #{i.tooth_number}</span> : null}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Already invoiced</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={completeItems.isPending} onClick={() => completeItems.mutate([i.id])}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Mark done
                      </Button>
                    </div>
                  ))}
                </section>
              </>
            )}

            <Separator />

            {labCases.length > 0 && (
              <>
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Lab fees</h4>
                  {labCases.map((c: any) => (
                    <label key={c.id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3 cursor-pointer">
                      <Checkbox checked={labSel.has(c.id)} onCheckedChange={() => setLabSel((s) => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })} />
                      <div className="flex-1 text-sm min-w-0">
                        <p className="font-medium truncate">{c.work_type || "Lab work"}</p>
                        <p className="text-xs text-muted-foreground">{c.case_number || "Lab case"}</p>
                      </div>
                      <span className="text-sm font-semibold">{naira(Number(c.clinic_fee || c.lab_fee))}</span>
                    </label>
                  ))}
                </section>
                <Separator />
              </>
            )}

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><NotebookPen className="h-3.5 w-3.5" /> Visit notes</h4>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={draftSoap} disabled={soapLoading}>
                    {soapLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />} Draft with AI
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={applyTemplate}>Use template</Button>
                </div>
              </div>
              {NOTE_FIELDS.map(([k, label]) => (
                <div key={k} className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                  <Textarea rows={2} className="text-sm" value={notes[k]} onChange={(e) => setNotes((n) => ({ ...n, [k]: e.target.value }))} />
                  <div className="flex flex-wrap gap-1">
                    {PHRASES[k].map((ph) => (
                      <button key={ph} type="button" onClick={() => addPhrase(k, ph)} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted">+ {ph}</button>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">Saved to the patient's notes when the visit ends.</p>
            </section>

            <Separator />

            <PostOpInstructions
              patientId={patientId}
              patientName={patientName}
              procedures={[
                ...(apptTreatment ? [apptTreatment.name] : []),
                ...selected.map((i) => `${i.description}${i.tooth_number ? ` (tooth ${i.tooth_number})` : ""}`),
              ]}
              meds={prescriptions.flatMap((rx: any) => (rx.prescription_medications || []).map((m: any) => [m.medication_name || m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(" ")))}
            />

            <Separator />

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prescriptions today</h4>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setRxOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Write Rx
                </Button>
              </div>
              {prescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">None written during this visit.</p>
              ) : (
                prescriptions.map((rx: any) => (
                  <div key={rx.id} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3 text-sm">
                    <Pill className="h-4 w-4 text-secondary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {(rx.prescription_medications || []).map((m: any) => m.medication_name || m.name).join(", ") || "Prescription"}
                      </p>
                      <p className="text-xs text-muted-foreground">{rx.staff?.full_name || ""}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      aria-label="Print prescription"
                      onClick={() =>
                        printPrescription(
                          {
                            patientName: patientName || "Patient",
                            clinicianName: rx.staff?.full_name || "",
                            date: rx.prescription_date,
                            diagnosis: rx.diagnosis,
                            notes: rx.notes,
                            medications: (rx.prescription_medications || []).map((m: any) => ({ name: m.medication_name || m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration })),
                          },
                          currentOrg?.org_name,
                        )
                      }
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </section>

            <Separator />

            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Extra materials used
              </h4>
              <p className="text-[11px] text-muted-foreground">Standard materials deduct automatically. Add anything extra (graft vial, suture pack…).</p>
              {materialSuggestions.map((s) => (
                <div key={s.id} className="rounded-lg bg-muted/20 p-2 text-xs space-y-1">
                  <p className="font-medium flex items-center gap-1"><Sparkles className="h-3 w-3 text-secondary" /> {s.name}</p>
                  {s.std.length > 0 ? (
                    <p className="text-muted-foreground">Auto: {s.std.map((m: any) => `${m.item.name} × ${m.qty}`).join(", ")}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {s.guesses.map((g: any) => (
                        <button key={g.id} type="button" onClick={() => setExtras((x) => [...x, { inventory_id: g.id, qty: 1 }])} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] hover:bg-muted">+ {g.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {extras.map((e, idx) => {
                const item = inventory.find((i: any) => i.id === e.inventory_id);
                return (
                  <div key={idx} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm">
                    <span className="flex-1 truncate">{item?.name || "Item"}</span>
                    <span className="text-muted-foreground">× {e.qty}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Remove" onClick={() => setExtras((x) => x.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
              <div className="flex items-center gap-2">
                <Select value={newExtra.inventory_id} onValueChange={(v) => setNewExtra((n) => ({ ...n, inventory_id: v }))}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Pick stock item" /></SelectTrigger>
                  <SelectContent>
                    {inventory.map((i: any) => (
                      <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit || ""})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min={1} className="h-8 w-16 text-xs" value={newExtra.qty} onChange={(e) => setNewExtra((n) => ({ ...n, qty: Math.max(1, Number(e.target.value) || 1) }))} />
                <Button size="sm" variant="outline" className="h-8" disabled={!newExtra.inventory_id} onClick={() => { setExtras((x) => [...x, newExtra]); setNewExtra({ inventory_id: "", qty: 1 }); }}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </section>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated total</span>
              <span className="text-lg font-bold">{naira(total)}</span>
            </div>

            <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-background border-t grid gap-2">
              <Button className="bg-secondary hover:bg-secondary/90" onClick={() => finishVisit({ draft: true })} disabled={loggingExtras || completeAppointment.isPending || completeItems.isPending}>
                <Receipt className="h-4 w-4 mr-2" /> Finish & send to front desk
              </Button>
              <Button variant="outline" onClick={() => setRecallOpen(true)}>
                <CalendarPlus className="h-4 w-4 mr-2" /> {nextPlanned ? `Book next: ${nextPlanned.description}` : "Book next appointment"}
              </Button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" className="text-muted-foreground underline-offset-2 hover:underline" onClick={sendToBilling} disabled={completeItems.isPending}>Invoice now instead</button>
                <button type="button" className="text-muted-foreground underline-offset-2 hover:underline" onClick={requestEnd} disabled={loggingExtras || completeAppointment.isPending}>End without billing</button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {patientId && (
        <>
          <CreateInvoiceDialog
            open={invoiceOpen}
            onOpenChange={setInvoiceOpen}
            preselectedPatientId={patientId}
            preselectedTreatmentIds={invoiceTreatmentIds.length ? invoiceTreatmentIds : undefined}
            preselectedLines={invoiceLines.length ? invoiceLines : undefined}
            onCreated={async (keptKeys) => {
              // Only tag the plan items that actually stayed on the invoice.
              const kept = allPlanItems.filter((i) => keptKeys.includes(i.id));
              if (kept.length) await markInvoiced.mutateAsync(kept.map((i) => ({ id: i.id, notes: i.notes })));
              setBilled(true);
              finishVisit();
            }}
          />
          <CreatePrescriptionDialog open={rxOpen} onOpenChange={setRxOpen} preselectedPatientId={patientId} />
          <BookAppointmentDialog
            open={recallOpen}
            onOpenChange={setRecallOpen}
            preselectedPatientId={patientId}
            preselectedTreatmentId={nextPlanned?.treatment_id || undefined}
            preselectedNotes={nextPlanned ? `${nextPlanned.visit_number ? `Visit ${nextPlanned.visit_number}: ` : ""}${nextPlanned.description}${nextPlanned.tooth_number ? ` · #${nextPlanned.tooth_number}` : ""}` : undefined}
          />
          <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End visit without billing?</AlertDialogTitle>
                <AlertDialogDescription>
                  {unbilledDone} completed item(s) haven't been billed. Send a draft invoice to the front desk, or end without billing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go back</AlertDialogCancel>
                
                <AlertDialogCancel onClick={() => finishVisit()}>End without billing</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setConfirmEnd(false); finishVisit({ draft: true }); }}>Send draft to front desk</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
