import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { setActiveVisit } from "@/hooks/useActiveVisit";
import { Button } from "@/components/ui/button";
import { User, Grid3x3, ClipboardList, Pill, FileSignature, NotebookPen, CheckCircle2, X, FlaskConical, Calculator, ArrowRight, Check, Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useConsentToday } from "@/hooks/useVisitFlow";
import { usePatients } from "@/hooks/usePatients";
import { useClinicLinks, usePatientContext } from "@/hooks/usePatientContext";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { VisitCompletionDialog } from "@/components/dashboard/VisitCompletionDialog";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { readVisitNotesDraft, writeVisitNotesDraft, type VisitNotes } from "@/lib/visitNotesDraft";

const NOTE_FIELDS: [keyof VisitNotes, string][] = [["subjective", "Complaint (S)"], ["objective", "Findings (O)"], ["assessment", "Diagnosis (A)"], ["plan", "Plan (P)"]];

/**
 * Active-visit strip: keeps the patient locked across clinical pages and offers
 * one-tap jumps plus "Finish visit".
 */
export function PatientVisitBar({ patientId, onClear }: { patientId: string; onClear?: () => void }) {
  const { data: patients = [] } = usePatients();
  const link = useClinicLinks();
  const terms = useClinicTerms();
  const { pathname } = useLocation();
  const [finishOpen, setFinishOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<VisitNotes>({ subjective: "", objective: "", assessment: "", plan: "" });
  const openNotes = () => { setNotes({ subjective: "", objective: "", assessment: "", plan: "", ...readVisitNotesDraft(patientId) }); setNotesOpen(true); };
  const setNote = (k: keyof VisitNotes, v: string) => setNotes((n) => { const next = { ...n, [k]: v }; writeVisitNotesDraft(patientId, next); return next; });
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const clear = onClear
    ? () => { setActiveVisit(null); onClear(); }
    : () => {
        setActiveVisit(null);
        setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete("patientId"); return n; }, { replace: true });
      };
  const { data: consentDone = false } = useConsentToday(patientId);
  const patient = patients.find((p: any) => p.id === patientId);
  const name = patient ? `${patient.first_name} ${patient.last_name}` : "Patient";

  const items = [
    { page: "consent-forms", label: "Consent", icon: FileSignature, extra: consentDone ? undefined : { new: "1" }, done: consentDone },
    terms.showDentalChart ? { page: "dental-charts", label: "Chart", icon: Grid3x3 } : null,
    { page: "treatments", label: "Plan", icon: ClipboardList, extra: { tab: "plans" } },
    { page: "prescriptions", label: "Rx", icon: Pill, extra: { new: "1" } },
    { page: "lab-work", label: "Lab", icon: FlaskConical, extra: { new: "1" } },
    { page: "estimates", label: "Estimate", icon: Calculator, extra: { fromPlan: "1" } },
    { page: "patient", label: "Notes", icon: NotebookPen },
  ].filter(Boolean) as { page: string; label: string; icon: any; extra?: Record<string, string>; done?: boolean }[];

  // Guided flow: Consent → Chart → Plan → Rx, then Finish. Lab/Estimate/Notes rejoin the flow at Finish.
  const core = ["consent-forms", "dental-charts", "treatments", "prescriptions"];
  const flow = items.filter((i) => core.includes(i.page));
  const onItem = items.find((i) => (i.page === "patient" ? pathname.includes("/patient") : pathname.endsWith(`/${i.page}`)));
  const idx = flow.findIndex((i) => pathname.endsWith(`/${i.page}`));
  // Skip steps already done today (signed consent).
  const next = idx >= 0 ? flow.slice(idx + 1).find((i) => !i.done) ?? null : null;
  const showNext = !!onItem;
  const goNext = () => (next ? navigate(link(next.page, patientId, next.extra)) : setFinishOpen(true));
  const hrefOf = (it: (typeof items)[number]) => (it.page === "patient" ? `${link("patient", patientId)}?tab=notes` : link(it.page, patientId, it.extra));

  return (
    <>
      <div className="sticky top-0 z-20 -mx-1 rounded-xl border border-secondary/30 bg-card/95 backdrop-blur px-3 py-2 shadow-sm flex items-center gap-2" data-tour="visit-bar">
        <div className="flex items-center gap-2 min-w-0 mr-auto">
          <div className="h-7 w-7 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Active visit</p>
            <p className="text-sm font-semibold truncate">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden lg:flex items-center gap-1" data-tour="visit-bar-jump">
            {items.map((it) => {
              const active = it.page !== "patient" && pathname.endsWith(`/${it.page}`);
              const Icon = it.done ? Check : it.icon;
              if (it.page === "patient") return (
                <Button key={it.page} size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={openNotes}>
                  <Icon className="h-3.5 w-3.5 mr-1" /><span>{it.label}</span>
                </Button>
              );
              return (
                <Button key={it.page} asChild size="sm" variant={active ? "secondary" : "ghost"} className={cn("h-8 px-2 text-xs", active && "pointer-events-none")}>
                  <Link to={hrefOf(it)}>
                    <Icon className={cn("h-3.5 w-3.5 mr-1", it.done && "text-secondary")} />
                    <span>{it.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 lg:hidden" aria-label="Jump to" data-tour="visit-bar-jump-menu">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {items.map((it) => {
                const Icon = it.done ? Check : it.icon;
                if (it.page === "patient") return (
                  <DropdownMenuItem key={it.page} onClick={openNotes}><Icon className="h-4 w-4 mr-2" />{it.label}</DropdownMenuItem>
                );
                return (
                  <DropdownMenuItem key={it.page} asChild>
                    <Link to={hrefOf(it)}><Icon className="h-4 w-4 mr-2" />{it.label}{it.done ? " (done today)" : ""}</Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {showNext && next && (
            <Button size="sm" variant="outline" className="h-8 px-2 text-xs border-secondary/40" onClick={goNext} data-tour="visit-bar-next">
              Next: {next.label} <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
          <Button size="sm" className="h-8 px-2 text-xs bg-secondary hover:bg-secondary/90" onClick={() => setFinishOpen(true)} data-tour="visit-bar-finish">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Finish
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="End visit context" onClick={clear}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Visit notes · {name}</SheetTitle>
            <SheetDescription>Saved as you type. They appear in Finish visit and are filed when the visit ends.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 mt-4">
            {NOTE_FIELDS.map(([k, label]) => (
              <div key={k} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Textarea rows={3} className="text-sm" value={notes[k]} onChange={(e) => setNote(k, e.target.value)} />
              </div>
            ))}
            <Button className="w-full" onClick={() => setNotesOpen(false)}>Done</Button>
          </div>
        </SheetContent>
      </Sheet>
      <VisitCompletionDialog open={finishOpen} onOpenChange={setFinishOpen} patientId={patientId} patientName={name} />
    </>
  );
}

/** Visit bar for pages that don't select a patient themselves (lists, settings). */
export function ActiveVisitBar() {
  const { patientId } = usePatientContext();
  return patientId ? <PatientVisitBar patientId={patientId} /> : null;
}
