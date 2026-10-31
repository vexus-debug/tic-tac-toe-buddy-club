import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { usePatients } from "@/hooks/usePatients";
import { useTreatments } from "@/hooks/useTreatments";
import { useStaff } from "@/hooks/useStaff";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { format } from "date-fns";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { useAddToWaitingList } from "@/hooks/useWaitingList";
import { AddPatientDialog } from "@/components/dashboard/AddPatientDialog";

interface WalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalkInDialog({ open, onOpenChange }: WalkInDialogProps) {
  const terms = useClinicTerms();
  const [patientId, setPatientId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [chair, setChair] = useState("Chair 1");
  const [newOpen, setNewOpen] = useState(false);

  const { data: patients = [] } = usePatients();
  const { data: treatments = [] } = useTreatments();
  const { data: staff = [] } = useStaff();
  const createAppointment = useCreateAppointment();
  const addToQueue = useAddToWaitingList();

  const dentists = staff.filter((s) => s.role === "dentist" && s.status === "active");

  const handleSubmit = () => {
    if (!patientId || !staffId) return;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes() < 30 ? "00" : "30";
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    const timeStr = `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;

    createAppointment.mutate(
      {
        patient_id: patientId,
        staff_id: staffId,
        treatment_id: treatmentId || undefined,
        appointment_date: format(now, "yyyy-MM-dd"),
        appointment_time: timeStr,
        chair,
        is_walk_in: true,
        notes: "Walk-in patient",
      },
      {
        onSuccess: (appt: any) => {
          addToQueue.mutate({ patient_id: patientId, appointment_id: appt?.id, chair, notes: "Walk-in" });
          onOpenChange(false);
          setPatientId("");
          setTreatmentId("");
          setStaffId("");
        },
      }
    );
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Walk-In Patient</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Patient *</Label>
              <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setNewOpen(true)}>+ New patient</Button>
            </div>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{terms.clinician} *</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue placeholder={`Select ${terms.clinician.toLowerCase()}`} /></SelectTrigger>
              <SelectContent>
                {dentists.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Treatment</Label>
            <Select value={treatmentId} onValueChange={setTreatmentId}>
              <SelectTrigger><SelectValue placeholder="Select treatment (optional)" /></SelectTrigger>
              <SelectContent>
                {treatments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Chair</Label>
            <Select value={chair} onValueChange={setChair}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Chair 1">Chair 1</SelectItem>
                <SelectItem value="Chair 2">Chair 2</SelectItem>
                <SelectItem value="Chair 3">Chair 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full bg-secondary hover:bg-secondary/90" onClick={handleSubmit} disabled={!patientId || !staffId || createAppointment.isPending}>
            {createAppointment.isPending ? "Adding..." : "Add Walk-In"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <AddPatientDialog open={newOpen} onOpenChange={setNewOpen} onCreated={(id) => setPatientId(id)} />
    </>
  );
}
