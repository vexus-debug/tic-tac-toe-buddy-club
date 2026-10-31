import { useEffect, useState } from "react";
import { useOrg } from "@/hooks/useOrg";
import { askClinicAi, rxSafetyPrompt } from "@/lib/aiDental";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Zap } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { usePatients } from "@/hooks/usePatients";
import { useDentists } from "@/hooks/useStaff";
import { useCreatePrescription } from "@/hooks/usePrescriptions";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { useDentalChartEntries } from "@/hooks/useDentalCharts";
import { Textarea } from "@/components/ui/textarea";
import { checkPrescriptionConflicts } from "@/lib/medicalSafety";
import { DOSING_DRUGS, calcDose } from "@/lib/dentalDosing";

const prescriptionTemplates = [
  {
    label: "Post-op: antibiotic + painkiller",
    medications: [
      { name: "Amoxicillin 500mg", dosage: "1 cap", frequency: "3x daily", duration: "5 days" },
      { name: "Metronidazole 400mg", dosage: "1 tab", frequency: "3x daily", duration: "5 days" },
      { name: "Ibuprofen 400mg", dosage: "1 tab", frequency: "3x daily after meals", duration: "3 days" },
    ],
  },
  {
    label: "Penicillin allergy post-op",
    medications: [
      { name: "Azithromycin 500mg", dosage: "1 tab", frequency: "Once daily", duration: "3 days" },
      { name: "Paracetamol 1g", dosage: "2 tabs", frequency: "Every 8 hours", duration: "3 days" },
    ],
  },
  {
    label: "Pain only",
    medications: [
      { name: "Ibuprofen 400mg", dosage: "1 tab", frequency: "3x daily after meals", duration: "3 days" },
      { name: "Paracetamol 500mg", dosage: "2 tabs", frequency: "As needed, max 4x daily", duration: "3 days" },
    ],
  },
  {
    label: "Dental infection / abscess",
    medications: [
      { name: "Amoxicillin-Clavulanate 625mg", dosage: "1 tab", frequency: "2x daily", duration: "7 days" },
      { name: "Metronidazole 400mg", dosage: "1 tab", frequency: "3x daily", duration: "5 days" },
      { name: "Ibuprofen 400mg", dosage: "1 tab", frequency: "3x daily after meals", duration: "5 days" },
    ],
  },
  {
    label: "Post-Extraction",
    medications: [
      { name: "Amoxicillin 500mg", dosage: "1 cap 3x daily", frequency: "After meals", duration: "7 days" },
      { name: "Ibuprofen 400mg", dosage: "1 tab 2x daily", frequency: "After meals", duration: "5 days" },
    ],
  },
  {
    label: "Post Root Canal",
    medications: [
      { name: "Metronidazole 400mg", dosage: "1 tab 3x daily", frequency: "After meals", duration: "5 days" },
      { name: "Paracetamol 500mg", dosage: "1-2 tabs as needed", frequency: "Every 6 hours", duration: "3 days" },
    ],
  },
  {
    label: "Periodontal Treatment",
    medications: [
      { name: "Chlorhexidine Mouthwash 0.2%", dosage: "Rinse 15ml", frequency: "2x daily", duration: "14 days" },
    ],
  },
];

const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  dentistId: z.string().min(1, "Select a dentist"),
  diagnosis: z.string().trim().max(1000).optional(),
  medications: z.array(z.object({
    name: z.string().trim().min(1, "Required"),
    dosage: z.string().trim().min(1, "Required"),
    frequency: z.string().trim().min(1, "Required"),
    duration: z.string().trim().min(1, "Required"),
    strength: z.string().trim().max(50).optional(),
    form: z.string().trim().max(30).optional(),
    quantity: z.string().trim().max(30).optional(),
    instructions: z.string().trim().max(300).optional(),
  })).min(1, "Add at least one medication"),
});

type PrescriptionForm = z.infer<typeof prescriptionSchema>;

interface CreatePrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatientId?: string;
}

export function CreatePrescriptionDialog({ open, onOpenChange, preselectedPatientId }: CreatePrescriptionDialogProps) {
  const terms = useClinicTerms();
  const { data: patients = [] } = usePatients();
  const { data: dentists = [] } = useDentists();
  const createPrescription = useCreatePrescription();

  const form = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: preselectedPatientId || "",
      dentistId: dentists[0]?.id || "",
      diagnosis: "",
      medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
    },
  });

  // Carry the patient chosen elsewhere (e.g. their own page) into this form
  useEffect(() => {
    if (!open) return;
    form.reset({
      patientId: preselectedPatientId || "",
      dentistId: dentists[0]?.id || "",
      diagnosis: "",
      medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedPatientId, dentists.length]);

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const watchedPatient = form.watch("patientId");
  const { data: chartEntries = [] } = useDentalChartEntries(watchedPatient || undefined);
  const chartDiagnosis = (() => {
    const latest: Record<string, any> = {};
    (chartEntries as any[]).forEach((e) => { if (!latest[e.tooth_number]) latest[e.tooth_number] = e; });
    const recentCut = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    return Object.values(latest)
      .filter((e: any) => e.condition && !["healthy", "treated"].includes(e.condition) && e.entry_date >= recentCut)
      .sort((a: any, b: any) => Number(a.tooth_number) - Number(b.tooth_number))
      .map((e: any) => `Tooth ${e.tooth_number}: ${String(e.condition).replace(/_/g, " ")}${e.surface ? ` (${e.surface})` : ""}`)
      .join("; ");
  })();
  // Fill the diagnosis from the chart once a patient is chosen, without overwriting typed text
  useEffect(() => {
    if (open && chartDiagnosis && !form.getValues("diagnosis")) form.setValue("diagnosis", chartDiagnosis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chartDiagnosis]);

  function applyTemplate(index: number) {
    const template = prescriptionTemplates[index];
    replace(template.medications);
  }

  const { currentOrg } = useOrg();
  const [checking, setChecking] = useState(false);
  const [safety, setSafety] = useState<{ key: string; warnings: string[] } | null>(null);
  const [rationale, setRationale] = useState("");
  useEffect(() => { if (open) { setSafety(null); setRationale(""); } }, [open]);
  const medKey = (d: PrescriptionForm) => d.patientId + "::" + d.medications.map((m) => `${m.name} ${m.dosage} ${m.frequency} ${m.duration}`).join(";");

  // Instant, offline allergy / medical-alert cross-check (rule-based, no AI).
  const watchedMeds = form.watch("medications");
  const selectedPatient = patients.find((p) => p.id === watchedPatient);
  const conflicts = selectedPatient
    ? checkPrescriptionConflicts((watchedMeds || []).map((m) => m?.name || ""), selectedPatient.allergies, selectedPatient.medical_history)
    : [];
  const [overrideReason, setOverrideReason] = useState("");
  const [weight, setWeight] = useState("");
  const [dosingDrug, setDosingDrug] = useState(DOSING_DRUGS[0].name);
  const dd = DOSING_DRUGS.find((d) => d.name === dosingDrug)!;
  const dose = Number(weight) > 0 ? calcDose(dd, Number(weight)) : null;
  function addCalculatedDose() {
    if (!dose) return;
    const empty = (form.getValues("medications") || []).findIndex((m) => !m.name);
    const med = { name: dd.name, strength: `${dd.suspensionMgPer5ml}mg/5ml`, form: "Suspension", dosage: `${dose.doseMg}mg (${dose.doseMl}ml)`, frequency: dd.frequency, duration: dd.duration, quantity: `${dose.totalMl}ml`, instructions: `Weight ${weight}kg` };
    if (empty >= 0) form.setValue(`medications.${empty}`, med); else append(med);
  }
  useEffect(() => { if (open) setOverrideReason(""); }, [open]);

  async function runSafetyCheck(data: PrescriptionForm) {
    if (!currentOrg?.org_id) return null;
    setChecking(true);
    try {
      const reply = await askClinicAi(currentOrg.org_id, rxSafetyPrompt(data.patientId, data.medications.map((m) => `${m.name} ${m.dosage} ${m.frequency} ${m.duration}`)), "rx-safety-check");
      const warnings = /^\s*NO ISSUES/i.test(reply) ? [] : reply.split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);
      const res = { key: medKey(data), warnings };
      setSafety(res);
      return res;
    } catch (e: any) {
      toast({ title: "Safety check unavailable", description: `${e?.message || ""} You can still review manually and save.` });
      const res = { key: medKey(data), warnings: [] };
      setSafety(res);
      return res;
    } finally { setChecking(false); }
  }

  async function onSubmit(data: PrescriptionForm) {
    if (conflicts.length && !overrideReason.trim()) {
      toast({ title: "Contraindication override required", description: "Record your clinical justification or change the medication.", variant: "destructive" });
      return;
    }
    let res = safety;
    if (!res || res.key !== medKey(data)) {
      res = await runSafetyCheck(data);
      if (res && res.warnings.length) return; // show warnings first
    }
    if (res && res.warnings.length && !rationale.trim()) {
      toast({ title: "Rationale required", description: "Explain why you are proceeding despite the safety warnings.", variant: "destructive" });
      return;
    }
    createPrescription.mutate(
      {
        patient_id: data.patientId,
        dentist_id: data.dentistId,
        diagnosis: data.diagnosis || undefined,
        notes: [
          conflicts.length ? `Contraindication overridden: ${conflicts.map((c) => `${c.medication} (${c.reason})`).join("; ")}. Justification: ${overrideReason.trim()}` : "",
          res && res.warnings.length ? `Safety warnings overridden by clinician. Rationale: ${rationale.trim()}\nWarnings: ${res.warnings.join(" / ")}` : "",
        ].filter(Boolean).join("\n") || undefined,
        medications: data.medications.map((m) => ({
          name: [m.name, m.strength, m.form].filter(Boolean).join(" "),
          dosage: m.dosage, frequency: m.frequency, duration: m.duration,
          instructions: [m.quantity ? `Dispense: ${m.quantity}` : "", m.instructions || ""].filter(Boolean).join(" · ") || undefined,
        })),
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Prescription</DialogTitle>
          <DialogDescription>Create a digital prescription for a patient.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Patient */}
            <FormField control={form.control} name="patientId" render={({ field }) => (
              <FormItem>
                <FormLabel>Patient *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Dentist */}
            <FormField control={form.control} name="dentistId" render={({ field }) => (
              <FormItem>
                <FormLabel>Prescribing {terms.clinician} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder={`Select ${terms.clinician.toLowerCase()}`} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dentists.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="diagnosis" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Diagnosis</FormLabel>
                  {chartDiagnosis && (
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => form.setValue("diagnosis", chartDiagnosis)}>
                      Fill from chart
                    </Button>
                  )}
                </div>
                <FormControl><Textarea rows={2} placeholder="e.g. Tooth 36: irreversible pulpitis" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Quick Templates */}
            <div>
              <FormLabel className="mb-1.5 block">Presets</FormLabel>
              <div className="flex flex-wrap gap-2">
                {prescriptionTemplates.map((tpl, i) => (
                  <Button key={i} type="button" variant="outline" size="sm" className="text-xs" onClick={() => applyTemplate(i)}>
                    <Zap className="mr-1 h-3 w-3" /> {tpl.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Weight-based dosing */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <FormLabel className="block">Child dosing by weight</FormLabel>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Input type="number" inputMode="decimal" min={1} max={150} placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <Select value={dosingDrug} onValueChange={setDosingDrug}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOSING_DRUGS.map((d) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button type="button" variant="outline" disabled={!dose} onClick={addCalculatedDose}>Add to list</Button>
              </div>
              {dose && (
                <p className="text-xs text-muted-foreground">
                  {dose.doseMg}mg per dose ({dose.doseMl}ml of {dd.suspensionMgPer5ml}mg/5ml) · {dd.frequency} · {dd.duration} · dispense {dose.totalMl}ml{dose.capped ? " · capped at adult max" : ""}
                </p>
              )}
            </div>

            {/* Medications */}
            <div className="space-y-3">
              <FormLabel>Medications *</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-3 space-y-2 relative">
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                  <FormField control={form.control} name={`medications.${index}.name`} render={({ field }) => (
                    <FormItem>
                      <FormControl><Input placeholder="Medication name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name={`medications.${index}.strength`} render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Strength (e.g. 500mg)" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name={`medications.${index}.form`} render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Form" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {["Tablet", "Capsule", "Suspension", "Mouthwash", "Gel", "Drops", "Injection"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <FormField control={form.control} name={`medications.${index}.dosage`} render={({ field }) => (
                      <FormItem>
                        <FormControl><Input placeholder="Dosage" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`medications.${index}.frequency`} render={({ field }) => (
                      <FormItem>
                        <FormControl><Input placeholder="Frequency" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`medications.${index}.duration`} render={({ field }) => (
                      <FormItem>
                        <FormControl><Input placeholder="Duration" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <FormField control={form.control} name={`medications.${index}.quantity`} render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="Qty to dispense" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name={`medications.${index}.instructions`} render={({ field }) => (
                      <FormItem className="sm:col-span-2"><FormControl><Input placeholder="Instructions (e.g. take after meals)" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", dosage: "", frequency: "", duration: "" })}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Medication
              </Button>
            </div>

            {conflicts.length > 0 && (
              <div role="alert" className="rounded-lg border-2 border-destructive bg-destructive/10 p-3 space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive"><ShieldAlert className="h-4 w-4" /> Contraindication — review before prescribing</p>
                <ul className="space-y-1.5 text-xs">
                  {conflicts.map((c, i) => (
                    <li key={i} className={c.severity === "allergy" ? "font-medium text-destructive" : "text-foreground"}>
                      <span className="font-semibold">{c.medication}</span> — {c.reason}
                      {c.alternative && <span className="block text-muted-foreground">Consider instead: {c.alternative}</span>}
                    </li>
                  ))}
                </ul>
                <Textarea rows={2} className="text-sm" placeholder="Clinical justification to override (required, saved with the prescription)" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
              </div>
            )}

            {safety && safety.key === medKey(form.getValues()) && (
              safety.warnings.length === 0 ? (
                <p className="flex items-center gap-1.5 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-secondary" /> AI safety check found no concerns. Clinical judgement still applies.</p>
              ) : (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-destructive"><ShieldAlert className="h-4 w-4" /> Safety warnings (advisory)</p>
                  <ul className="space-y-1 text-xs">
                    {safety.warnings.map((w, i) => <li key={i} className={/^HIGH/i.test(w) ? "font-medium text-destructive" : ""}>• {w}</li>)}
                  </ul>
                  <Textarea rows={2} className="text-sm" placeholder="To proceed, record your clinical rationale (saved with the prescription)" value={rationale} onChange={(e) => setRationale(e.target.value)} />
                </div>
              )
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-secondary hover:bg-secondary/90" disabled={createPrescription.isPending || checking}>
                {checking ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Checking safety...</> : createPrescription.isPending ? "Creating..." : safety?.warnings.length && safety.key === medKey(form.getValues()) ? "Override & create" : "Check & create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
