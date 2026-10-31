import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useScanAppointments, useSaveScanAppointment, useDeleteScanAppointment, MODALITIES } from "@/hooks/scan/useScan";
import { Plus, Trash2, CalendarDays } from "lucide-react";

const empty = {
  patient_name: "", phone: "", modality: MODALITIES[0], body_part: "",
  scheduled_at: "", status: "scheduled", notes: "",
};

const STATUSES = ["scheduled", "arrived", "completed", "cancelled"];

export default function ScanAppointmentsPage() {
  const { data: appts = [] } = useScanAppointments();
  const save = useSaveScanAppointment();
  const del = useDeleteScanAppointment();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const submit = async () => {
    if (!form.patient_name?.trim() || !form.scheduled_at) return;
    await save.mutateAsync({ ...form, scheduled_at: new Date(form.scheduled_at).toISOString() });
    setOpen(false);
    setForm(empty);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Imaging Appointments" description="Upcoming and past imaging bookings">
        <Button size="sm" onClick={() => { setForm(empty); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Appointment
        </Button>
      </PageHeader>

      <div className="space-y-2">
        {appts.map((a: any) => (
          <Card key={a.id} className="glass-card">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <button
                className="text-left"
                onClick={() => {
                  setForm({ ...a, scheduled_at: new Date(a.scheduled_at).toISOString().slice(0, 16) });
                  setOpen(true);
                }}
              >
                <p className="font-medium">{a.patient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.scheduled_at).toLocaleString()} · {a.modality} {a.body_part || ""} · {a.phone || "no phone"}
                </p>
              </button>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{a.status}</Badge>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {appts.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <CalendarDays className="mx-auto mb-2 h-6 w-6 opacity-40" />
              No appointments booked.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit appointment" : "New appointment"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Patient name</Label>
              <Input value={form.patient_name || ""} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Date &amp; time</Label>
              <Input type="datetime-local" value={form.scheduled_at || ""} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <div>
              <Label>Study type</Label>
              <Select value={form.modality} onValueChange={(v) => setForm({ ...form, modality: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MODALITIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Body part</Label>
              <Input value={form.body_part || ""} onChange={(e) => setForm({ ...form, body_part: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
