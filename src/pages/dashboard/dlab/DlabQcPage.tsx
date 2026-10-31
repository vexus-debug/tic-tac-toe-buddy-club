import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, RotateCcw, Search, XCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { useLabCases, type LabCaseRow } from "@/hooks/useLabCases";
import { useLabRecords } from "@/hooks/useLabRecords";
import { useStaff } from "@/hooks/useStaff";
import { clientOf, isRush, patientOf } from "@/hooks/useDentalLab";
import { stageLabel } from "@/config/dentalLab";
import { QC_POINTS, QC_QUEUE_STAGES, REWORK_TARGETS, failedPoints, isComplete, qcOutcome, suggestRework, type QcAnswers } from "@/lib/labQc";
import { CaseFiles } from "@/components/dlab/CaseFiles";

const teethOf = (c: LabCaseRow) => ((c as any).teeth as string[] | undefined) ?? [];

export default function DlabQcPage() {
  const { data: cases = [] } = useLabCases();
  const { data: records = [] } = useLabRecords("qc");
  const { data: staff = [] } = useStaff();
  const [q, setQ] = useState("");
  const [inspect, setInspect] = useState<LabCaseRow | null>(null);
  const staffName = (id?: string | null) => staff.find((s) => s.id === id)?.full_name;

  const queue = useMemo(() => cases.filter((c) => QC_QUEUE_STAGES.includes(c.status) &&
    (!q || [c.case_number, clientOf(c), patientOf(c), c.work_type].join(" ").toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => Number(isRush(b)) - Number(isRush(a)) || (a.due_date || "9").localeCompare(b.due_date || "9")), [cases, q]);

  const passRate = records.length ? Math.round((records.filter((r) => r.status === "passed").length / records.length) * 100) : null;

  return (
    <div className="space-y-5">
      <PageHeader title="Quality Control" description="Inspect each case before it ships. Failures go straight back to the right bench." />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Waiting for inspection</p><p className="text-2xl font-semibold">{queue.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">In rework</p><p className="text-2xl font-semibold">{cases.filter((c) => (c as any).qc_status === "rework_needed" && c.status !== "cancelled").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">First-time pass rate</p><p className="text-2xl font-semibold">{passRate === null ? "—" : `${passRate}%`}</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Find a case…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card><CardContent className="divide-y p-0">
        {queue.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No cases in finishing or QC right now.</p>}
        {queue.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                <span className="font-mono text-xs text-muted-foreground">{c.case_number}</span> · {teethOf(c).length ? `#${teethOf(c).join(", #")} · ` : ""}{c.work_type}
                {isRush(c) && <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px]">Rush</Badge>}
                {(c as any).qc_status === "rework_needed" && <Badge variant="outline" className="ml-1.5 border-warning px-1.5 py-0 text-[10px]">Re-inspection</Badge>}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {clientOf(c)} · {patientOf(c)} · Shade {c.shade || "—"} · {stageLabel(c.status)}{c.due_date ? ` · Due ${format(new Date(c.due_date), "d MMM")}` : ""}
              </p>
            </div>
            <Button size="sm" onClick={() => setInspect(c)}><ClipboardCheck className="mr-1 h-4 w-4" />Inspect</Button>
          </div>
        ))}
      </CardContent></Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Recent inspections</h2>
        <Card><CardContent className="divide-y p-0">
          {records.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No inspections yet.</p>}
          {records.slice(0, 30).map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 text-sm">
              {r.status === "passed" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : r.status === "failed" ? <XCircle className="h-4 w-4 shrink-0 text-destructive" /> : <RotateCcw className="h-4 w-4 shrink-0 text-warning" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.title} · {r.data?.work_type || ""}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.record_date ? format(new Date(r.record_date), "d MMM yyyy") : ""}
                  {r.data?.inspector ? ` · by ${r.data.inspector}` : ""}
                  {r.data?.failed?.length ? ` · ${r.data.failed.join(", ")}` : ""}
                  {r.data?.sent_to ? ` · sent to ${stageLabel(r.data.sent_to)}` : ""}
                  {r.data?.photos?.length ? ` · ${r.data.photos.length} photo${r.data.photos.length === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <Badge variant={r.status === "passed" ? "secondary" : "outline"} className="shrink-0 capitalize">{r.status}</Badge>
            </div>
          ))}
        </CardContent></Card>
      </div>

      {inspect && <InspectDialog c={inspect} technician={staffName(inspect.technician_id)} onClose={() => setInspect(null)} />}
    </div>
  );
}

function InspectDialog({ c, technician, onClose }: { c: LabCaseRow; technician?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth() as any;
  const [a, setA] = useState<QcAnswers>({});
  const [notes, setNotes] = useState("");
  const [rework, setRework] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const { currentOrg } = useOrg();
  const failed = failedPoints(a);
  const needsRework = failed.some((p) => p.key !== "disinfection");
  const target = rework || suggestRework(a);

  const submit = async () => {
    const out = qcOutcome(a, target);
    setBusy(true);
    try {
      const sb = supabase as any;
      // Defect photos go into the case files so the bench sees them during rework.
      const photoPaths: string[] = [];
      for (const f of photos) {
        const path = `${currentOrg?.org_id}/${c.id}/qc_${Date.now()}_${f.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("lab-case-files").upload(path, f);
        if (upErr) throw upErr;
        photoPaths.push(path);
      }
      // One transaction: the case move and the inspection record succeed or fail together.
      const { error } = await sb.rpc("lab_submit_qc", {
        p_case_id: c.id, p_qc_status: out.qc_status, p_status: out.status, p_record_status: out.record,
        p_data: {
          ...a, notes, work_type: c.work_type, shade: c.shade, client: clientOf(c), technician: technician || "",
          inspector: user?.user_metadata?.full_name || user?.email || "", failed: failed.map((p) => p.label),
          sent_to: out.qc_status === "rework_needed" ? out.status : null, photos: photoPaths,
        },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["lab_cases"] });
      qc.invalidateQueries({ queryKey: ["lab_records"] });
      qc.invalidateQueries({ queryKey: ["case-files"] });
      toast({ title: out.status === "ready" ? `${c.case_number} passed — Ready to Ship` : out.qc_status === "rework_needed" ? `${c.case_number} sent back to ${stageLabel(out.status)}` : `${c.case_number} kept in QC` });
      onClose();
    } catch (e: any) {
      toast({ title: "Could not save inspection", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Inspect {c.case_number}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/50 p-3 text-xs">
          <p><span className="text-muted-foreground">Work: </span>{c.work_type}</p>
          <p><span className="text-muted-foreground">Shade: </span>{c.shade || "—"}</p>
          <p><span className="text-muted-foreground">Clinic: </span>{clientOf(c)}</p>
          <p><span className="text-muted-foreground">Patient: </span>{patientOf(c)}</p>
          <p><span className="text-muted-foreground">Teeth: </span>{teethOf(c).join(", ") || "—"}</p>
          <p><span className="text-muted-foreground">Made by: </span>{technician || "Unassigned"}</p>
        </div>
        <div className="rounded-md border p-3"><CaseFiles caseId={c.id} /></div>
        <div className="space-y-3">
          {QC_POINTS.map((p, i) => (
            <div key={p.key}>
              <Label className="text-xs">{i + 1}. {p.label}</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {p.options.map((o) => {
                  const on = a[p.key] === o;
                  const good = o === p.pass;
                  return (
                    <Button key={o} type="button" size="sm" variant={on ? (good ? "default" : "destructive") : "outline"} className="h-8"
                      onClick={() => setA((x) => ({ ...x, [p.key]: o }))}>{o}</Button>
                  );
                })}
              </div>
            </div>
          ))}
          {needsRework && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <Label className="text-xs">Send back to</Label>
              <Select value={target} onValueChange={setRework}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{REWORK_TARGETS.map((t) => <SelectItem key={t.stage} value={t.stage}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {failed.length > 0 && (
            <div>
              <Label className="text-xs">Defect photos {photos.length ? `(${photos.length})` : ""}</Label>
              <Input type="file" accept="image/*" capture="environment" multiple className="mt-1"
                onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
            </div>
          )}
          <div><Label className="text-xs">Inspector notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!isComplete(a) || busy} variant={failed.length ? "destructive" : "default"} onClick={submit}>
            {busy ? "Saving…" : !isComplete(a) ? "Answer all 6 points" : !failed.length ? "Pass — Ready to Ship" : needsRework ? "Send for rework" : "Keep in QC"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
