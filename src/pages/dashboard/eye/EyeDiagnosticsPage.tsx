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
  useEyeDiagnostics, useSaveEyeDiagnostic, useDeleteEyeDiagnostic,
  DIAGNOSTIC_STUDIES, EYE_SIDES, patientName, type EyeDiagnostic,
} from "@/hooks/eye/useEye";
import { Plus, Trash2, Activity, ExternalLink } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

const blank = {
  id: undefined as string | undefined,
  patient_id: "",
  study_type: DIAGNOSTIC_STUDIES[0],
  eye: "both",
  study_date: today(),
  findings: "",
  file_url: "",
  file_name: "",
};

type Form = typeof blank;
const str = (v: string) => (v.trim() === "" ? null : v.trim());

export default function EyeDiagnosticsPage() {
  const { data: studies = [], isLoading } = useEyeDiagnostics();
  const save = useSaveEyeDiagnostic();
  const remove = useDeleteEyeDiagnostic();

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState<Form>(blank);
  const set = (k: keyof Form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const startNew = () => { setForm({ ...blank }); setOpen(true); };

  const startEdit = (s: EyeDiagnostic) => {
    setForm({
      id: s.id,
      patient_id: s.patient_id,
      study_type: s.study_type,
      eye: s.eye || "both",
      study_date: s.study_date?.slice(0, 10) || today(),
      findings: s.findings || "",
      file_url: s.file_url || "",
      file_name: s.file_name || "",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.patient_id) return;
    await save.mutateAsync({
      id: form.id,
      patient_id: form.patient_id,
      study_type: form.study_type,
      eye: form.eye,
      study_date: form.study_date,
      findings: str(form.findings),
      file_url: str(form.file_url),
      file_name: str(form.file_name),
    });
    setOpen(false);
  };

  const shown = filter === "all" ? studies : studies.filter((s) => s.study_type === filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Eye Diagnostics" description="OCT, visual fields, imaging and other studies">
        <Button size="sm" onClick={startNew}><Plus className="mr-2 h-4 w-4" /> Record Study</Button>
      </PageHeader>

      <Card className="glass-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Studies</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All study types</SelectItem>
              {DIAGNOSTIC_STUDIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && shown.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No studies recorded.</p>
          )}
          {shown.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2">
              <button className="flex-1 text-left" onClick={() => startEdit(s)}>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" /> {patientName(s)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.study_type} · {s.eye} · {new Date(s.study_date).toLocaleDateString()}
                  {s.findings ? ` · ${s.findings.slice(0, 60)}` : ""}
                </p>
              </button>
              <div className="flex items-center gap-2">
                {s.file_url && (
                  <a href={s.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline inline-flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> file
                  </a>
                )}
                <Badge variant="outline">{s.eye}</Badge>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit study" : "Record diagnostic study"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!form.id && <PatientPicker value={form.patient_id} onChange={(id) => set("patient_id", id)} />}
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Study type</Label>
                <Select value={form.study_type} onValueChange={(v) => set("study_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIAGNOSTIC_STUDIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Eye</Label>
                <Select value={form.eye} onValueChange={(v) => set("eye", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EYE_SIDES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Study date</Label><Input type="date" value={form.study_date} onChange={(e) => set("study_date", e.target.value)} /></div>
              <div><Label>File name</Label><Input value={form.file_name} onChange={(e) => set("file_name", e.target.value)} /></div>
            </div>
            <div><Label>File link</Label><Input value={form.file_url} onChange={(e) => set("file_url", e.target.value)} placeholder="https://…" /></div>
            <div><Label>Findings</Label><Textarea value={form.findings} onChange={(e) => set("findings", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending || !form.patient_id}>Save study</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
