import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Armchair, Stethoscope, Grid3x3, FileText, ClipboardList, Pill, Send, PartyPopper, PlayCircle, Check } from "lucide-react";

// Practice-only walkthrough: everything here is a phantom patient held in local state.
// Nothing is saved to the clinic's records.
const PATIENT = { name: "Ada Practice (demo)", age: 34, chair: "Chair 2", treatment: "Check-up & filling", allergy: "Penicillin" };
const TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PROCS = [
  { name: "Examination", price: 10000 },
  { name: "Composite filling (tooth 16)", price: 35000 },
  { name: "Scaling & polishing", price: 20000 },
];

const STEPS = [
  { icon: Armchair, title: "Patient is in your chair", hint: "The front desk has checked the patient in and called them to your chair. You'll see them in your waiting room panel." },
  { icon: PlayCircle, title: "Start the visit", hint: "Open the patient and tap Start visit. Review allergies and history before you begin." },
  { icon: Grid3x3, title: "Chart the teeth", hint: "Tap a tooth to record what you find. Try tapping tooth 16." },
  { icon: FileText, title: "Write clinical notes", hint: "Record what the patient said, what you saw, your assessment and the plan." },
  { icon: ClipboardList, title: "Record procedures done", hint: "Tick the treatments you carried out today. These become the bill." },
  { icon: Pill, title: "Prescribe (if needed)", hint: "Add medication for the patient. Allergies are flagged for you." },
  { icon: Send, title: "Finish & send to front desk", hint: "Finishing the visit sends the bill to reception as Ready for payment." },
  { icon: PartyPopper, title: "That's the full visit", hint: "Reception takes payment and the patient's record is updated. You're ready for the next patient." },
];

const naira = (n: number) => `₦${n.toLocaleString()}`;

export function DentistVisitWalkthrough({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [tooth, setTooth] = useState<number | null>(null);
  const [notes, setNotes] = useState(false);
  const [done, setDone] = useState<number[]>(PROCS.map((_, i) => i));
  const [rx, setRx] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => { setStep(0); setStarted(false); setTooth(null); setNotes(false); setDone(PROCS.map((_, i) => i)); setRx(false); setSent(false); };
  const close = (o: boolean) => { if (!o) reset(); onOpenChange(o); };

  const ready = [true, started, tooth !== null, notes, done.length > 0, true, sent, true][step];
  const total = PROCS.filter((_, i) => done.includes(i)).reduce((s, p) => s + p.price, 0);
  const S = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Practice mode</Badge>
            <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          </div>
          <DialogTitle className="flex items-center gap-2 pt-1"><S.icon className="h-5 w-5 text-primary" />{S.title}</DialogTitle>
          <DialogDescription>{S.hint}</DialogDescription>
        </DialogHeader>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <div><p className="font-semibold">{PATIENT.name}</p><p className="text-xs text-muted-foreground">Age {PATIENT.age} · {PATIENT.chair} · {PATIENT.treatment}</p></div>
            <Badge variant={started ? "default" : "outline"}>{sent ? "Sent to front desk" : started ? "In visit" : "In chair"}</Badge>
          </div>

          {step === 0 && <p className="text-muted-foreground">Status: <strong className="text-foreground">Called → {PATIENT.chair}</strong>. Press Next to open the patient.</p>}

          {step === 1 && (
            <div className="space-y-3">
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">Allergy: {PATIENT.allergy}</p>
              <Button onClick={() => setStarted(true)} disabled={started}><Stethoscope className="mr-2 h-4 w-4" />{started ? "Visit started" : "Start visit"}</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <div className="grid grid-cols-8 gap-1">
                {TEETH.map((t) => (
                  <button key={t} onClick={() => setTooth(t)} className={cn("rounded border py-1.5 text-xs tabular-nums", tooth === t ? "border-primary bg-primary text-primary-foreground" : t === 16 ? "border-primary/50 bg-card" : "border-border bg-card")}>{t}</button>
                ))}
              </div>
              {tooth !== null && <p className="text-xs">Tooth {tooth}: <strong>Caries noted — filling needed</strong></p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              {[["Complaint", "Pain on the upper right when chewing"], ["Findings", `Caries on tooth ${tooth ?? 16}`], ["Assessment", "Moderate decay"], ["Plan", "Composite filling today, review in 6 months"]].map(([k, v]) => (
                <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className={cn(!notes && "text-muted-foreground/60")}>{notes ? v : "…"}</p></div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setNotes(true)} disabled={notes}>{notes ? "Notes saved" : "Fill in sample notes"}</Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              {PROCS.map((p, i) => (
                <label key={p.name} className="flex cursor-pointer items-center justify-between gap-2 rounded border border-border bg-card px-3 py-2">
                  <span className="flex items-center gap-2"><Checkbox checked={done.includes(i)} onCheckedChange={(c) => setDone((d) => c ? [...d, i] : d.filter((x) => x !== i))} />{p.name}</span>
                  <span className="tabular-nums">{naira(p.price)}</span>
                </label>
              ))}
              <p className="text-right font-semibold">Total {naira(total)}</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Penicillin-type drugs are blocked for this patient.</p>
              <Button size="sm" variant="outline" onClick={() => setRx(true)} disabled={rx}>{rx ? "Added" : "Add Ibuprofen 400mg, 3× daily, 3 days"}</Button>
              {rx && <p className="flex items-center gap-1 text-xs"><Check className="h-3 w-3 text-primary" />Prescription ready to print</p>}
              <p className="text-xs text-muted-foreground">Optional — you can skip this step.</p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-2">
              <p>{done.length} procedure(s) · <strong>{naira(total)}</strong>{rx ? " · 1 prescription" : ""}</p>
              <Button onClick={() => setSent(true)} disabled={sent}><Send className="mr-2 h-4 w-4" />{sent ? "Sent — Ready for payment" : "Finish & send to front desk"}</Button>
            </div>
          )}

          {step === 7 && <p>Visit complete. Reception sees <strong>{naira(total)}</strong> under Ready for payment, and your chair is free for the next patient.</p>}
        </div>

        <p className="text-[11px] text-muted-foreground">This is a practice patient. Nothing is saved to your clinic.</p>
        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={() => (step === 0 ? close(false) : setStep(step - 1))}>{step === 0 ? "Cancel" : "Back"}</Button>
          {step < STEPS.length - 1
            ? <Button onClick={() => setStep(step + 1)} disabled={!ready}>Next</Button>
            : <Button onClick={() => close(false)}>Finish walkthrough</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
