import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PatientPicker } from "@/components/dashboard/eye/PatientPicker";
import {
  useContactLensFittings, useSaveContactLensFitting, useDeleteContactLensFitting,
  CL_MODALITIES, CL_TYPES, CL_STATUSES, patientName, type ContactLensFitting,
} from "@/hooks/eye/useEye";
import { Plus, Trash2, Contact } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

const blank = {
  id: undefined as string | undefined,
  patient_id: "",
  fitting_date: today(),
  lens_brand: "", lens_type: "", modality: "",
  base_curve: "", diameter: "", power_od: "", power_os: "",
  fit_assessment: "", aftercare_date: "", status: "trial", notes: "",
};

type Form = typeof blank;
const num = (v: string) => (v === "" ? null : Number(v));
const str = (v: string) => (v.trim() === "" ? null : v.trim());

export default function ContactLensPage() {
  const { data: fittings = [], isLoading } = useContactLensFittings();
  const save = useSaveContactLensFitting();
  const remove = useDeleteContactLensFitting();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);
  const set = (k: keyof Form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const startNew = () => { setForm({ ...blank }); setOpen(true); };

  const startEdit = (f: ContactLensFitting) => {
    setForm({
      id: f.id,
      patient_id: f.patient_id,
      fitting_date: f.fitting_date?.slice(0, 10) || today(),
      lens_brand: f.lens_brand || "", lens_type: f.lens_type || "", modality: f.modality || "",
      base_curve: f.base_curve?.toString() || "", diameter: f.diameter?.toString() || "",
      power_od: f.power_od?.toString() || "", power_os: f.power_os?.toString() || "",
      fit_assessment: f.fit_assessment || "", aftercare_date: f.aftercare_date?.slice(0, 10) || "",
      status: f.status || "trial", notes: f.notes || "",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.patient_id) return;
    await save.mutateAsync({
      id: form.id,
      patient_id: form.patient_id,
      fitting_date: form.fitting_date,
      lens_brand: str(form.lens_brand), lens_type: str(form.lens_type), modality: str(form.modality),
      base_curve: num(form.base_curve), diameter: num(form.diameter),
      power_od: num(form.power_od), power_os: num(form.power_os),
      fit_assessment: str(form.fit_assessment),
      aftercare_date: form.aftercare_date || null,
      status: form.status,
      notes: str(form.notes),
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Contact Lenses" description="Fittings, trials and aftercare">
        <Button size="sm" onClick={startNew}><Plus className="mr-2 h-4 w-4" /> New Fitting</Button>
      </PageHeader>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Fittings</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && fittings.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No contact lens fittings yet.</p>
          )}
          {fittings.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2">
              <button className="flex-1 text-left" onClick={() => startEdit(f)}>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Contact className="h-3.5 w-3.5 text-muted-foreground" /> {patientName(f)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {f.lens_brand || "—"} · {f.lens_type || "—"} · {f.modality || "—"} · OD {f.power_od ?? "—"} / OS {f.power_os ?? "—"}
                </p>
              </button>
              <div className="flex items-center gap-2">
                {f.aftercare_date && <span className="text-xs text-muted-foreground">aftercare {new Date(f.aftercare_date).toLocaleDateString()}</span>}
                <Badge variant="outline">{f.status}</Badge>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(f.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit fitting" : "New contact lens fitting"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!form.id && <PatientPicker value={form.patient_id} onChange={(id) => set("patient_id", id)} />}
            <div className="grid gap-2 sm:grid-cols-2">
              <div><Label>Fitting date</Label><Input type="date" value={form.fitting_date} onChange={(e) => set("fitting_date", e.target.value)} /></div>
              <div><Label>Lens brand</Label><Input value={form.lens_brand} onChange={(e) => set("lens_brand", e.target.value)} /></div>
              <div>
                <Label>Lens type</Label>
                <Select value={form.lens_type} onValueChange={(v) => set("lens_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>{CL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modality</Label>
                <Select value={form.modality} onValueChange={(v) => set("modality", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>{CL_MODALITIES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Base curve</Label><Input type="number" step="0.1" value={form.base_curve} onChange={(e) => set("base_curve", e.target.value)} /></div>
              <div><Label>Diameter</Label><Input type="number" step="0.1" value={form.diameter} onChange={(e) => set("diameter", e.target.value)} /></div>
              <div><Label>Power right (OD)</Label><Input type="number" step="0.25" value={form.power_od} onChange={(e) => set("power_od", e.target.value)} /></div>
              <div><Label>Power left (OS)</Label><Input type="number" step="0.25" value={form.power_os} onChange={(e) => set("power_os", e.target.value)} /></div>
              <div><Label>Aftercare date</Label><Input type="date" value={form.aftercare_date} onChange={(e) => set("aftercare_date", e.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CL_STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Fit assessment</Label><Textarea value={form.fit_assessment} onChange={(e) => set("fit_assessment", e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending || !form.patient_id}>Save fitting</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
