import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUpdateAppointment, type AppointmentRow } from "@/hooks/useAppointments";
import { useDentists } from "@/hooks/useStaff";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { VisitCompletionDialog } from "@/components/dashboard/VisitCompletionDialog";
import { useCheckInAppointment, useStartVisit, hasIntakeConsent } from "@/hooks/useVisitFlow";
import { useClinicLinks } from "@/hooks/usePatientContext";
import { useNavigate } from "react-router-dom";
import { UserCheck, Stethoscope } from "lucide-react";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";
import { askClinicAi, fastFillPrompt, parseAiLines } from "@/lib/aiDental";
import { Sparkles, Loader2 } from "lucide-react";

const statusOptions = ["scheduled", "in-progress", "completed", "cancelled"];
const chairs = ["Chair 1", "Chair 2", "Chair 3"];

interface AppointmentDetailDialogProps {
  appointment: AppointmentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkedIn?: boolean;
}

export function AppointmentDetailDialog({ appointment, open, onOpenChange, checkedIn }: AppointmentDetailDialogProps) {
  const { currentOrg } = useOrg();
  const isDentistRole = currentOrg?.role === "dentist";
  const checkIn = useCheckInAppointment();
  const startVisit = useStartVisit();
  const link = useClinicLinks();
  const visitTerms = useClinicTerms();
  const navigate = useNavigate();
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const terms = useClinicTerms();
  const updateAppointment = useUpdateAppointment();
  const { data: dentists = [] } = useDentists();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  const [chair, setChair] = useState("");
  const [staffId, setStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const [time, setTime] = useState("");
  const [wrapAppt, setWrapAppt] = useState<AppointmentRow | null>(null);
  const setWrapUpOpen = (o: boolean) => setWrapAppt(o ? appointment : null);

  const startEdit = () => {
    if (!appointment) return;
    setStatus(appointment.status);
    setChair(appointment.chair || "");
    setStaffId(appointment.staff_id);
    setNotes(appointment.notes || "");
    setTime(appointment.appointment_time);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!appointment) return;
    await updateAppointment.mutateAsync({
      id: appointment.id,
      status,
      chair,
      staff_id: staffId,
      notes,
      appointment_time: time,
    });
    setEditing(false);
    onOpenChange(false);
  };

  const [fill, setFill] = useState<{ loading: boolean; slot: string; matches: string[][] | null } | null>(null);
  const findReplacements = async (a: AppointmentRow) => {
    if (!currentOrg?.org_id) return;
    const slot = { date: a.appointment_date, time: a.appointment_time, treatment: a.treatments?.name, dentist: dentists.find((d) => d.id === a.staff_id)?.full_name };
    setFill({ loading: true, slot: `${slot.date} ${slot.time?.slice(0, 5)}`, matches: null });
    try {
      const reply = await askClinicAi(currentOrg.org_id, fastFillPrompt(slot), "fast-fill");
      setFill({ loading: false, slot: `${slot.date} ${slot.time?.slice(0, 5)}`, matches: /NO MATCHES/i.test(reply) ? [] : parseAiLines(reply).slice(0, 5) });
    } catch (e: any) {
      setFill(null);
      toast({ title: "Couldn't find replacements", description: e?.message, variant: "destructive" });
    }
  };

  const handleQuickStatus = async (newStatus: string) => {
    if (!appointment) return;
    await updateAppointment.mutateAsync({ id: appointment.id, status: newStatus });
    if (newStatus === "cancelled") { const a = appointment; onOpenChange(false); findReplacements(a); return; }
    if (newStatus === "completed") {
      onOpenChange(false);
      setWrapUpOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const handleCheckIn = async () => {
    if (!appointment) return;
    await checkIn.mutateAsync({ id: appointment.id, patient_id: appointment.patient_id, chair: appointment.chair, notes: appointment.notes });
    setJustCheckedIn(true);
  };

  const handleStartVisit = async () => {
    if (!appointment) return;
    await startVisit.mutateAsync({ patient_id: appointment.patient_id, appointment_id: appointment.id });
    onOpenChange(false);
    // Visit start only needs the general intake consent; procedure consents come from the accepted plan.
    if (visitTerms.showDentalChart && await hasIntakeConsent(currentOrg?.org_id, appointment.patient_id)) {
      navigate(link("dental-charts", appointment.patient_id));
    } else {
      navigate(link("consent-forms", appointment.patient_id, { new: "1", template: "general" }));
    }
  };

  const wrapEl = (
    <VisitCompletionDialog
      open={!!wrapAppt}
      onOpenChange={(o) => !o && setWrapAppt(null)}
      patientId={wrapAppt?.patient_id}
      patientName={wrapAppt?.patients ? `${wrapAppt.patients.first_name} ${wrapAppt.patients.last_name}` : undefined}
      appointmentTreatmentId={wrapAppt?.treatment_id}
      appointmentId={wrapAppt?.id}
    />
  );

  const fillEl = (
    <Dialog open={!!fill} onOpenChange={(o) => !o && setFill(null)}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-secondary" /> Fill the open slot · {fill?.slot}</DialogTitle></DialogHeader>
        {fill?.loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ranking patients who could take this slot…</p>
        ) : fill?.matches?.length ? (
          <ol className="space-y-2">
            {fill.matches.map((m, i) => (
              <li key={i} className="rounded-lg border border-border/40 p-3 text-sm">
                <p className="font-medium">{i + 1}. {m[0]}{m[1] && m.length > 2 ? <span className="text-muted-foreground font-normal"> · {m[1]}</span> : null}</p>
                <p className="text-xs text-muted-foreground">{m[m.length - 1] !== m[0] ? m[m.length - 1] : ""}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No good matches found. The slot is free for walk-ins or new bookings.</p>
        )}
        <p className="text-[11px] text-muted-foreground">Suggestions only — call the patient and book them yourself.</p>
        <DialogFooter><Button variant="outline" onClick={() => setFill(null)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!appointment) return <>{wrapEl}{fillEl}</>;

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    "in-progress": "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setEditing(false); setJustCheckedIn(false); } onOpenChange(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Appointment Details
              <Badge className={statusColors[appointment.status] || ""}>{appointment.status.replace("-", " ")}</Badge>
            </DialogTitle>
          </DialogHeader>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chair</Label>
                <Select value={chair} onValueChange={setChair}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {chairs.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{terms.clinician}</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dentists.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("-", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium">{appointment.patients ? `${appointment.patients.first_name} ${appointment.patients.last_name}` : "Unknown"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{terms.clinician}</span><span>{appointment.staff?.full_name || "Unknown"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Treatment</span><span>{appointment.treatments?.name || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{appointment.appointment_date}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{appointment.appointment_time}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Chair</span><span>{appointment.chair || "N/A"}</span></div>
            {appointment.notes && <div><span className="text-muted-foreground">Notes: </span>{appointment.notes}</div>}
            {appointment.is_walk_in && <Badge variant="outline" className="text-[10px]">Walk-in</Badge>}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90" disabled={updateAppointment.isPending}>
                {updateAppointment.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              {appointment.status === "scheduled" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleQuickStatus("cancelled")} className="text-red-600 hover:text-red-700">
                    Cancel Appointment
                  </Button>
                  {isDentistRole ? null : checkedIn || justCheckedIn ? (
                    <span className="inline-flex items-center text-xs font-medium text-emerald-600 px-2"><UserCheck className="h-3.5 w-3.5 mr-1" />In waiting list</span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleCheckIn} disabled={checkIn.isPending}>
                      <UserCheck className="h-3.5 w-3.5 mr-1" /> {checkIn.isPending ? "Checking in..." : "Check In Patient"}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleStartVisit} disabled={updateAppointment.isPending}>
                    <Stethoscope className="h-3.5 w-3.5 mr-1" /> Start Visit
                  </Button>
                </>
              )}
              {appointment.status === "in-progress" && (
                <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); navigate(link("consent-forms", appointment.patient_id)); }}>
                  <Stethoscope className="h-3.5 w-3.5 mr-1" /> Open Visit
                </Button>
              )}
              {appointment.status === "completed" && (
                <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); setWrapUpOpen(true); }}>
                  Checkout
                </Button>
              )}
              {appointment.status === "in-progress" && (
                <Button variant="outline" size="sm" onClick={() => handleQuickStatus("completed")} className="text-emerald-600 hover:text-emerald-700">
                  Mark Complete
                </Button>
              )}
              {!isDentistRole && <Button onClick={startEdit} className="bg-secondary hover:bg-secondary/90" size="sm">Edit</Button>}
            </>
          )}
        </DialogFooter>
        </DialogContent>
      </Dialog>

      {wrapEl}
      {fillEl}
    </>
  );
}
