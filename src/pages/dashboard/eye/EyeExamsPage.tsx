import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PatientPicker } from "@/components/dashboard/eye/PatientPicker";
import {
  useEyeExams, useSaveEyeExam, useDeleteEyeExam, IOP_METHODS, patientName, iopFlag, type EyeExam,
} from "@/hooks/eye/useEye";
import { Plus, Trash2, Eye } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

const blank = {
  id: undefined as string | undefined,
  patient_id: "",
  exam_date: today(),
  chief_complaint: "",
  va_unaided_od: "", va_unaided_os: "",
  va_aided_od: "", va_aided_os: "",
  va_pinhole_od: "", va_pinhole_os: "",
  iop_od: "", iop_os: "", iop_method: "",
  pupils_od: "", pupils_os: "",
  anterior_segment_od: "", anterior_segment_os: "",
  fundus_od: "", fundus_os: "",
  cd_ratio_od: "", cd_ratio_os: "",
  dilated: false,
  diagnosis: "", plan: "", notes: "",
};

type Form = typeof blank;

const num = (v: string) => (v === "" ? null : Number(v));
const str = (v: string) => (v.trim() === "" ? null : v.trim());

export default function EyeExamsPage() {
  const { data: exams = [], isLoading } = useEyeExams();
  const save = useSaveEyeExam();
  const remove = useDeleteEyeExam();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);
  const set = (k: keyof Form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const startNew = () => { setForm({ ...blank }); setOpen(true); };

  const startEdit = (e: EyeExam) => {
    setForm({
      id: e.id,
      patient_id: e.patient_id,
      exam_date: e.exam_date?.slice(0, 10) || today(),
      chief_complaint: e.chief_complaint || "",
      va_unaided_od: e.va_unaided_od || "", va_unaided_os: e.va_unaided_os || "",
      va_aided_od: e.va_aided_od || "", va_aided_os: e.va_aided_os || "",
      va_pinhole_od: e.va_pinhole_od || "", va_pinhole_os: e.va_pinhole_os || "",
      iop_od: e.iop_od?.toString() || "", iop_os: e.iop_os?.toString() || "", iop_method: e.iop_method || "",
      pupils_od: e.pupils_od || "", pupils_os: e.pupils_os || "",
      anterior_segment_od: e.anterior_segment_od || "", anterior_segment_os: e.anterior_segment_os || "",
      fundus_od: e.fundus_od || "", fundus_os: e.fundus_os || "",
      cd_ratio_od: e.cd_ratio_od?.toString() || "", cd_ratio_os: e.cd_ratio_os?.toString() || "",
      dilated: !!e.dilated,
      diagnosis: e.diagnosis || "", plan: e.plan || "", notes: e.notes || "",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.patient_id) return;
    await save.mutateAsync({
      id: form.id,
      patient_id: form.patient_id,
      exam_date: form.exam_date,
      chief_complaint: str(form.chief_complaint),
      va_unaided_od: str(form.va_unaided_od), va_unaided_os: str(form.va_unaided_os),
      va_aided_od: str(form.va_aided_od), va_aided_os: str(form.va_aided_os),
      va_pinhole_od: str(form.va_pinhole_od), va_pinhole_os: str(form.va_pinhole_os),
      iop_od: num(form.iop_od), iop_os: num(form.iop_os), iop_method: str(form.iop_method),
      pupils_od: str(form.pupils_od), pupils_os: str(form.pupils_os),
      anterior_segment_od: str(form.anterior_segment_od), anterior_segment_os: str(form.anterior_segment_os),
      fundus_od: str(form.fundus_od), fundus_os: str(form.fundus_os),
      cd_ratio_od: num(form.cd_ratio_od), cd_ratio_os: num(form.cd_ratio_os),
      dilated: form.dilated,
      diagnosis: str(form.diagnosis), plan: str(form.plan), notes: str(form.notes),
    });
    setOpen(false);
  };

  const pair = (label: string, keyOd: keyof Form, keyOs: keyof Form, type: "text" | "number" = "text") => (
    <div className="grid gap-2 sm:grid-cols-2">
      <div>
        <Label>{label} — right (OD)</Label>
        <Input type={type} step="0.01" value={form[keyOd] as string} onChange={(e) => set(keyOd, e.target.value)} />
      </div>
      <div>
        <Label>{label} — left (OS)</Label>
        <Input type={type} step="0.01" value={form[keyOs] as string} onChange={(e) => set(keyOs, e.target.value)} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Eye Exams" description="Record vision, pressures and slit-lamp findings">
        <Button size="sm" onClick={startNew}><Plus className="mr-2 h-4 w-4" /> New Exam</Button>
      </PageHeader>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Recent exams</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && exams.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No eye exams recorded yet.</p>
          )}
          {exams.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2">
              <button className="flex-1 text-left" onClick={() => startEdit(e)}>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" /> {patientName(e)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.exam_date).toLocaleDateString()} · VA {e.va_aided_od || e.va_unaided_od || "—"} / {e.va_aided_os || e.va_unaided_os || "—"}
                  {e.diagnosis ? ` · ${e.diagnosis}` : ""}
                </p>
              </button>
              <div className="flex items-center gap-2">
                <Badge variant={iopFlag(e.iop_od) === "high" || iopFlag(e.iop_os) === "high" ? "destructive" : "outline"}>
                  IOP {e.iop_od ?? "—"} / {e.iop_os ?? "—"}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit eye exam" : "New eye exam"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!form.id && <PatientPicker value={form.patient_id} onChange={(id) => set("patient_id", id)} />}
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Exam date</Label>
                <Input type="date" value={form.exam_date} onChange={(e) => set("exam_date", e.target.value)} />
              </div>
              <div>
                <Label>IOP method</Label>
                <Select value={form.iop_method} onValueChange={(v) => set("iop_method", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>
                    {IOP_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Chief complaint</Label>
              <Input value={form.chief_complaint} onChange={(e) => set("chief_complaint", e.target.value)} />
            </div>
            {pair("Unaided vision", "va_unaided_od", "va_unaided_os")}
            {pair("Aided vision", "va_aided_od", "va_aided_os")}
            {pair("Pinhole vision", "va_pinhole_od", "va_pinhole_os")}
            {pair("Pressure (mmHg)", "iop_od", "iop_os", "number")}
            {pair("Pupils", "pupils_od", "pupils_os")}
            {pair("Anterior segment", "anterior_segment_od", "anterior_segment_os")}
            {pair("Fundus", "fundus_od", "fundus_os")}
            {pair("Cup / disc ratio", "cd_ratio_od", "cd_ratio_os", "number")}
            <div className="flex items-center gap-2">
              <Switch checked={form.dilated} onCheckedChange={(v) => set("dilated", v)} />
              <span className="text-sm">Pupils dilated for this exam</span>
            </div>
            <div>
              <Label>Diagnosis</Label>
              <Input value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} placeholder="Separate several with commas" />
            </div>
            <div>
              <Label>Plan</Label>
              <Textarea value={form.plan} onChange={(e) => set("plan", e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending || !form.patient_id}>Save exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
