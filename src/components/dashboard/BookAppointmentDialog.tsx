import { ProviderBadge } from "@/components/dashboard/associate/ProviderBadge";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { usePatients } from "@/hooks/usePatients";
import { useDentists } from "@/hooks/useStaff";
import { useTreatments } from "@/hooks/useTreatments";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { useDentistSchedules, DAY_NAMES } from "@/hooks/useDentistSchedules";
import { useAppointmentsByDate } from "@/hooks/useAppointments";
import { AlertTriangle } from "lucide-react";
import { AddPatientDialog } from "@/components/dashboard/AddPatientDialog";

function slotToHHMM(slot: string) {
  const m = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return slot.slice(0, 5);
  let h = parseInt(m[1], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM",
];

const chairs = ["Chair 1", "Chair 2", "Chair 3"];

const bookingSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  dentistId: z.string().min(1, "Select a dentist"),
  chair: z.string().min(1, "Select a chair"),
  date: z.date({ required_error: "Select a date" }),
  time: z.string().min(1, "Select a time slot"),
  treatmentId: z.string().min(1, "Select treatment type"),
  isWalkIn: z.boolean(),
  notes: z.string().trim().max(500).optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPatientId?: string;
  /** Prefill for follow-ups (e.g. next planned visit). */
  preselectedTreatmentId?: string;
  preselectedNotes?: string;
}

export function BookAppointmentDialog({ open, onOpenChange, preselectedPatientId, preselectedTreatmentId, preselectedNotes }: BookAppointmentDialogProps) {
  const terms = useClinicTerms();
  const { data: patients = [] } = usePatients();
  const { data: dentists = [] } = useDentists();
  const { data: treatments = [] } = useTreatments();
  const createAppointment = useCreateAppointment();
  const [newOpen, setNewOpen] = useState(false);

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patientId: preselectedPatientId || "",
      dentistId: "",
      chair: "",
      time: "",
      treatmentId: "",
      isWalkIn: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (preselectedPatientId) form.setValue("patientId", preselectedPatientId);
    if (preselectedTreatmentId) form.setValue("treatmentId", preselectedTreatmentId);
    if (preselectedNotes) form.setValue("notes", preselectedNotes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedPatientId, preselectedTreatmentId, preselectedNotes]);

  const wDentist = form.watch("dentistId");
  const wDate = form.watch("date");
  const wTime = form.watch("time");
  const wChair = form.watch("chair");
  const { data: schedules = [] } = useDentistSchedules(wDentist || undefined);
  const { data: dayAppts = [] } = useAppointmentsByDate(wDate || new Date());
  const warnings: string[] = [];
  if (wDentist && wDate) {
    const dow = wDate.getDay();
    const sched = schedules.find((s) => s.day_of_week === dow);
    const name = dentists.find((d: any) => d.id === wDentist)?.full_name || "This dentist";
    if (schedules.length > 0 && (!sched || !sched.is_available)) {
      warnings.push(`${name} is off on ${DAY_NAMES[dow]}s.`);
    } else if (sched && wTime) {
      const t = slotToHHMM(wTime);
      const st = sched.start_time.slice(0, 5), en = sched.end_time.slice(0, 5);
      if (t < st || t >= en) warnings.push(`${wTime} is outside ${name}'s hours (${st}–${en}).`);
      if (sched.break_start && sched.break_end) {
        const bs = sched.break_start.slice(0, 5), be = sched.break_end.slice(0, 5);
        if (t >= bs && t < be) warnings.push(`${wTime} falls in ${name}'s break (${bs}–${be}).`);
      }
    }
    if (wTime) {
      const clash = (dayAppts as any[]).filter((a) => a.appointment_time === wTime && a.status !== "cancelled");
      if (clash.some((a) => a.staff_id === wDentist)) warnings.push(`${name} already has an appointment at ${wTime}.`);
      if (wChair && clash.some((a) => a.chair === wChair)) warnings.push(`${wChair} is already booked at ${wTime}.`);
    }
  }
  const allowedChairs: string[] = (dentists.find((d: any) => d.id === wDentist) as any)?.allowed_chairs || [];
  const chairBlocked = !!wChair && allowedChairs.length > 0 && !allowedChairs.includes(wChair);
  if (chairBlocked) warnings.push(`This dentist may only work in: ${allowedChairs.join(", ")}.`);

  function onSubmit(data: BookingForm) {
    if (chairBlocked) return;
    createAppointment.mutate(
      {
        patient_id: data.patientId,
        staff_id: data.dentistId,
        treatment_id: data.treatmentId,
        appointment_date: format(data.date, "yyyy-MM-dd"),
        appointment_time: data.time,
        chair: data.chair,
        is_walk_in: data.isWalkIn,
        notes: data.notes || "",
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
    <>
    <AddPatientDialog open={newOpen} onOpenChange={setNewOpen} onCreated={(id) => form.setValue("patientId", id, { shouldValidate: true })} />
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>Schedule a new patient appointment.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Patient */}
            <FormField control={form.control} name="patientId" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Patient *</FormLabel>
                  <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setNewOpen(true)}>+ New patient</Button>
                </div>
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
                <FormLabel>{terms.clinician} *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder={`Select ${terms.clinician.toLowerCase()}`} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dentists.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <span className="flex items-center gap-2">{d.full_name} — {d.specialty}<ProviderBadge type={(d as any).provider_type} /></span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Date & Time */}
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Time *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Chair & Treatment */}
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="chair" render={({ field }) => (
                <FormItem>
                  <FormLabel>Chair *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select chair" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chairs.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="treatmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select treatment" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {treatments.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Walk-in toggle */}
            <FormField control={form.control} name="isWalkIn" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>Walk-in Patient</FormLabel>
                  <FormDescription className="text-xs">Mark if patient walked in without prior appointment</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            {/* Notes */}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea placeholder="Any additional notes..." rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {warnings.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm space-y-1">
                {warnings.map((w) => (
                  <p key={w} className="flex items-start gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{w}
                  </p>
                ))}
                <p className="text-xs text-muted-foreground">You can still book if this is intentional.</p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-secondary hover:bg-secondary/90" disabled={createAppointment.isPending}>
                {createAppointment.isPending ? "Booking..." : warnings.length ? "Book anyway" : "Book Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
