import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PatientPicker } from "@/components/dashboard/eye/PatientPicker";
import {
  useSurgeryBookings, useSaveSurgeryBooking, useDeleteSurgeryBooking,
  EYE_PROCEDURES, EYE_SIDES, SURGERY_STATUSES, PREOP_CHECKLIST,
  patientName, type SurgeryBooking,
} from "@/hooks/eye/useEye";
import { Plus, Trash2, Scissors } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

const blank = {
  id: undefined as string | undefined,
  patient_id: "",
  procedure_name: "", eye: "right",
  scheduled_date: today(), scheduled_time: "",
  theatre: "", iol_model: "", iol_power: "",
  biometry_notes: "",
  preop: [] as string[],
  consent_signed: false,
  status: "booked", outcome_notes: "",
};

type Form = typeof blank;
const num = (v: string) => (v === "" ? null : Number(v));
const str = (v: string) => (v.trim() === "" ? null : v.trim());

export default function SurgeryBookingsPage() {
  const { data: bookings = [], isLoading } = useSurgeryBookings();
  const save = useSaveSurgeryBooking();
  const remove = useDeleteSurgeryBooking();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);
  const set = (k: keyof Form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCheck = (item: string) =>
    setForm((f) => ({
      ...f,
      preop: f.preop.includes(item) ? f.preop.filter((i) => i !== item) : [...f.preop, item],
    }));

  const startNew = () => { setForm({ ...blank, preop: [] }); setOpen(true); };

  const startEdit = (s: SurgeryBooking) => {
    setForm({
      id: s.id,
      patient_id: s.patient_id,
      procedure_name: s.procedure_name || "", eye: s.eye || "right",
      scheduled_date: s.scheduled_date?.slice(0, 10) || today(),
      scheduled_time: s.scheduled_time?.slice(0, 5) || "",
      theatre: s.theatre || "", iol_model: s.iol_model || "",
      iol_power: s.iol_power?.toString() || "",
      biometry_notes: s.biometry_notes || "",
      preop: Array.isArray(s.preop_checklist) ? s.preop_checklist : [],
      consent_signed: !!s.consent_signed,
      status: s.status || "booked", outcome_notes: s.outcome_notes || "",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.patient_id || !form.procedure_name) return;
    await save.mutateAsync({
      id: form.id,
      patient_id: form.patient_id,
      procedure_name: form.procedure_name,
      eye: form.eye,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time || null,
      theatre: str(form.theatre),
      iol_model: str(form.iol_model),
      iol_power: num(form.iol_power),
      biometry_notes: str(form.biometry_notes),
      preop_checklist: form.preop,
      consent_signed: form.consent_signed,
      status: form.status,
      outcome_notes: str(form.outcome_notes),
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Surgery Bookings" description="Theatre list, IOL planning and pre-op checks">
        <Button size="sm" onClick={startNew}><Plus className="mr-2 h-4 w-4" /> New Booking</Button>
      </PageHeader>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Bookings</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && bookings.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No surgery booked yet.</p>
          )}
          {bookings.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2">
              <button className="flex-1 text-left" onClick={() => startEdit(s)}>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Scissors className="h-3.5 w-3.5 text-muted-foreground" /> {patientName(s)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.procedure_name} · {s.eye} eye · {s.theatre || "theatre TBC"}
                  {s.iol_model ? ` · IOL ${s.iol_model} ${s.iol_power ?? ""}` : ""}
                </p>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(s.scheduled_date).toLocaleDateString()} {s.scheduled_time?.slice(0, 5) || ""}
                </span>
                {!s.consent_signed && <Badge variant="destructive">no consent</Badge>}
                <Badge variant="outline">{s.status}</Badge>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit booking" : "New surgery booking"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!form.id && <PatientPicker value={form.patient_id} onChange={(id) => set("patient_id", id)} />}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Procedure</Label>
                <Select value={form.procedure_name} onValueChange={(v) => set("procedure_name", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>{EYE_PROCEDURES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Eye</Label>
                <Select value={form.eye} onValueChange={(v) => set("eye", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EYE_SIDES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SURGERY_STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.scheduled_date} onChange={(e) => set("scheduled_date", e.target.value)} /></div>
              <div><Label>Time</Label><Input type="time" value={form.scheduled_time} onChange={(e) => set("scheduled_time", e.target.value)} /></div>
              <div><Label>Theatre</Label><Input value={form.theatre} onChange={(e) => set("theatre", e.target.value)} /></div>
              <div><Label>IOL model</Label><Input value={form.iol_model} onChange={(e) => set("iol_model", e.target.value)} /></div>
              <div><Label>IOL power (D)</Label><Input type="number" step="0.25" value={form.iol_power} onChange={(e) => set("iol_power", e.target.value)} /></div>
            </div>

            <div>
              <Label>Pre-op checklist</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {PREOP_CHECKLIST.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.preop.includes(item)} onCheckedChange={() => toggleCheck(item)} />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.consent_signed} onCheckedChange={(v) => set("consent_signed", !!v)} />
              Consent form signed
            </label>

            <div><Label>Biometry notes</Label><Textarea value={form.biometry_notes} onChange={(e) => set("biometry_notes", e.target.value)} /></div>
            <div><Label>Outcome notes</Label><Textarea value={form.outcome_notes} onChange={(e) => set("outcome_notes", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending || !form.patient_id || !form.procedure_name}>Save booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
