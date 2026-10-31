import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Play, CheckCircle2, XCircle, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeStage, stageLabel } from "@/config/dentalLab";
import { useLabCases, type LabCaseRow } from "@/hooks/useLabCases";
import { useHoldCase, clientOf, isCancelled, isRush } from "@/hooks/useDentalLab";
import { useLabRecords, useSaveLabRecord, type LabRecord } from "@/hooks/useLabRecords";
import { CaseFiles } from "@/components/dlab/CaseFiles";
import { toast } from "@/hooks/use-toast";
import { usableLots, materialSpecs, type CatalogRecord } from "@/lib/labCatalog";
import {
  SCAN_VERDICTS, verdictHoldReason, canRunMove, runFill, sinterWarnings, casesAlreadyQueued, QUEUE_STAGE,
  SINTER_PROFILES, profileMinutes, type ScanVerdict, type Equipment, type RunStatus, type RunUnit,
} from "@/lib/labCam";

const today = () => new Date().toISOString().slice(0, 10);
const teethCount = (c: any) => (Array.isArray(c.teeth) && c.teeth.length ? c.teeth.length : 1);
const verdictTone: Record<string, "secondary" | "destructive" | "outline" | "default"> = {
  verified: "secondary", pending: "outline", margin_question: "default", missing_bite: "destructive", rescan: "destructive",
};

/* ---------------- Scan intake ---------------- */
function ScanIntake() {
  const { data: cases = [] } = useLabCases();
  const triage = useLabRecords("scan-triage");
  const save = useSaveLabRecord("scan-triage");
  const hold = useHoldCase();
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const byCase = useMemo(() => {
    const m = new Map<string, LabRecord>();
    (triage.data || []).forEach((r) => { if (!m.has(r.data?.case_id)) m.set(r.data?.case_id, r); });
    return m;
  }, [triage.data]);
  const queue = cases.filter((c) => !isCancelled(c) && (c.status === "on_hold" || ["pending", "design"].includes(normalizeStage(c.status))));

  const setVerdict = (c: LabCaseRow, v: ScanVerdict) => {
    const prev = byCase.get(c.id);
    const note = notes[c.id] || "";
    save.mutate({ id: prev?.id, title: c.case_number, status: v, record_date: today(), data: { case_id: c.id, verdict: v, note } }, {
      onSuccess: () => {
        const reason = verdictHoldReason(v, note);
        if (reason && c.status !== "on_hold") hold.mutate({ id: c.id, reason });
        if (reason) toast({ title: `${c.case_number} put on hold`, description: reason });
      },
    });
  };

  if (!queue.length) return <p className="py-8 text-center text-sm text-muted-foreground">No new or in-design cases waiting for scan checks.</p>;
  return (
    <div className="space-y-2">
      {queue.map((c) => {
        const t = byCase.get(c.id); const v = (t?.status as ScanVerdict) || "pending";
        return (
          <Card key={c.id}>
            <CardContent className="space-y-3 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{c.case_number}</span>
                {isRush(c) && <Badge variant="destructive" className="px-1 text-[10px]">Rush</Badge>}
                <span className="min-w-0 flex-1 truncate text-sm">{c.work_type} · {clientOf(c)}</span>
                <Badge variant="outline">{c.status === "on_hold" ? "On hold" : stageLabel(c.status)}</Badge>
                <Badge variant={verdictTone[v]}>{SCAN_VERDICTS.find((x) => x.value === v)?.label}</Badge>
                <Button size="sm" variant="ghost" onClick={() => setOpen(open === c.id ? null : c.id)} aria-label="Show scans">
                  {open === c.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              {open === c.id && (
                <div className="space-y-3 border-t pt-3">
                  <CaseFiles caseId={c.id} />
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[200px] flex-1 space-y-1">
                      <Label className="text-xs">Note for the clinic (optional)</Label>
                      <Input value={notes[c.id] ?? t?.data?.note ?? ""} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} placeholder="e.g. distal margin on #36 unclear" />
                    </div>
                    {SCAN_VERDICTS.filter((x) => x.value !== "pending").map((x) => (
                      <Button key={x.value} size="sm" variant={x.value === "verified" ? "default" : "outline"} disabled={save.isPending} onClick={() => setVerdict(c, x.value)}>{x.label}</Button>
                    ))}
                  </div>
                  {t?.data?.note && <p className="text-xs text-muted-foreground">Last note: {t.data.note}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------- Equipment runs ---------------- */
const RUN_LABEL: Record<Equipment, { noun: string; capacity: string; lot: string }> = {
  mill: { noun: "Milling run", capacity: "Disc capacity (units)", lot: "Disc / puck lot" },
  furnace: { noun: "Sintering cycle", capacity: "Tray capacity (units)", lot: "" },
  printer: { noun: "Print platform", capacity: "Platform capacity (units)", lot: "Resin lot" },
};

function NewRunDialog({ type, onClose, runs }: { type: Equipment; onClose: () => void; runs: LabRecord[] }) {
  const { data: cases = [] } = useLabCases();
  const machines = (useLabRecords("equipment").data || []).filter((m) => m.status !== "retired");
  const materials = useLabRecords("materials").data || [];
  const save = useSaveLabRecord("cam-runs");
  const lots = usableLots(materials as unknown as CatalogRecord[], today());
  const queued = casesAlreadyQueued(runs, type);
  const eligible = cases.filter((c) => !isCancelled(c) && c.status !== "on_hold" && QUEUE_STAGE[type].includes(normalizeStage(c.status)) && !queued.has(c.id));
  const [machine, setMachine] = useState(""); const [lot, setLot] = useState("");
  const [profile, setProfile] = useState<string>(type === "furnace" ? "standard" : "");
  const [capacity, setCapacity] = useState(type === "mill" ? 20 : type === "furnace" ? 30 : 12);
  const [picked, setPicked] = useState<string[]>([]);
  const units: RunUnit[] = cases.filter((c) => picked.includes(c.id)).map((c) => ({
    case_id: c.id, case_number: c.case_number, units: teethCount(c), shade: c.shade, material: c.material, sinter: (c as any).sinter_curve || null,
  }));
  const fill = runFill(units, capacity);
  const warns = type === "furnace" ? sinterWarnings(profile, units) : [];
  const lotRec = lots.find((l: any) => l.id === lot) as any;

  const submit = () => {
    if (!units.length) return toast({ title: "Pick at least one case", variant: "destructive" });
    if (fill.over) return toast({ title: "Over capacity", description: `${fill.used} units on a ${fill.capacity}-unit ${type === "mill" ? "disc" : "tray"}.`, variant: "destructive" });
    save.mutate({
      title: `${RUN_LABEL[type].noun} · ${machine || "Unassigned machine"}`, status: "staged", amount: fill.used, record_date: today(),
      data: { equipment: type, machine, profile, capacity, units, lot_id: lot || null, lot: lotRec ? `${lotRec.title} · ${lotRec.data?.lot || ""}` : null, warnings: warns },
    }, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>New {RUN_LABEL[type].noun.toLowerCase()}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="space-y-1"><Label>Machine</Label>
            {machines.length ? (
              <Select value={machine} onValueChange={setMachine}><SelectTrigger><SelectValue placeholder="Pick a machine" /></SelectTrigger>
                <SelectContent>{machines.map((m) => <SelectItem key={m.id} value={m.title}>{m.title}</SelectItem>)}</SelectContent></Select>
            ) : <Input value={machine} onChange={(e) => setMachine(e.target.value)} placeholder="e.g. vhf K5 / Programat S1" />}
          </div>
          {type === "furnace" ? (
            <div className="space-y-1"><Label>Program</Label>
              <Select value={profile} onValueChange={setProfile}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SINTER_PROFILES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select>
            </div>
          ) : (
            <>
              <div className="space-y-1"><Label>{RUN_LABEL[type].lot}</Label>
                <Select value={lot} onValueChange={setLot}><SelectTrigger><SelectValue placeholder="Pick a usable lot" /></SelectTrigger>
                  <SelectContent>{lots.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.title} · {l.data?.lot || "no lot"} {materialSpecs(l) ? `· ${materialSpecs(l)}` : ""}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1"><Label>{type === "mill" ? "Nesting file / program" : "Layer height & settings"}</Label>
                <Input value={profile} onChange={(e) => setProfile(e.target.value)} placeholder={type === "mill" ? "e.g. nest_2026-10-31.nc" : "e.g. 50 µm, wash + UV cure"} /></div>
            </>
          )}
          <div className="space-y-1"><Label>{RUN_LABEL[type].capacity}</Label>
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span>{fill.used} / {fill.capacity} units</span><span className={fill.over ? "text-destructive" : "text-muted-foreground"}>{fill.over ? "Over capacity" : `${fill.left} left`}</span></div>
            <Progress value={fill.pct} />
          </div>
          <div className="space-y-1">
            <Label>Cases ({eligible.length} ready)</Label>
            <div className="max-h-56 divide-y overflow-y-auto rounded-md border">
              {eligible.length ? eligible.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
                  <Checkbox checked={picked.includes(c.id)} onCheckedChange={() => setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))} />
                  <span className="font-mono text-xs">{c.case_number}</span>
                  <span className="min-w-0 flex-1 truncate">{c.work_type}{c.material ? ` · ${c.material}` : ""}</span>
                  <span className="text-xs text-muted-foreground">{teethCount(c)}u{c.shade ? ` · ${c.shade}` : ""}</span>
                </label>
              )) : <p className="p-3 text-xs text-muted-foreground">No cases are at this step right now.</p>}
            </div>
          </div>
          {warns.map((w) => <p key={w} className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs">{w}</p>)}
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending} onClick={submit}>Stage run</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunQueue({ type }: { type: Equipment }) {
  const all = useLabRecords("cam-runs");
  const save = useSaveLabRecord("cam-runs");
  const [creating, setCreating] = useState(false);
  const runs = (all.data || []).filter((r) => r.data?.equipment === type);
  const move = (r: LabRecord, to: RunStatus) => {
    if (!canRunMove(r.status as RunStatus, to)) return;
    let reason: string | null = null;
    if (to === "failed") { reason = window.prompt("What went wrong? (e.g. tool breakage, power cut)"); if (!reason) return; }
    const now = new Date().toISOString();
    save.mutate({ ...r, status: to, data: { ...r.data, ...(to === "running" ? { started_at: now } : { finished_at: now }), ...(reason ? { failure: reason } : {}) } });
  };
  const tone: Record<string, "outline" | "default" | "secondary" | "destructive"> = { staged: "outline", running: "default", completed: "secondary", failed: "destructive" };
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" />New {RUN_LABEL[type].noun.toLowerCase()}</Button></div>
      {!runs.length && <p className="py-8 text-center text-sm text-muted-foreground">No runs yet.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {runs.map((r) => {
          const units: RunUnit[] = r.data?.units || [];
          const fill = runFill(units, r.data?.capacity);
          const mins = type === "furnace" ? profileMinutes(r.data?.profile) : 0;
          const eta = r.status === "running" && mins && r.data?.started_at ? new Date(new Date(r.data.started_at).getTime() + mins * 60000) : null;
          return (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><span className="truncate font-medium">{r.title}</span><Badge variant={tone[r.status]}>{r.status}</Badge></div>
                <p className="text-xs text-muted-foreground">
                  {[type === "furnace" ? SINTER_PROFILES.find((p) => p.value === r.data?.profile)?.label : r.data?.profile, r.data?.lot && `Lot ${r.data.lot}`].filter(Boolean).join(" · ") || "—"}
                </p>
                <div className="flex justify-between text-xs"><span>{fill.used} / {fill.capacity} units</span><span>{fill.pct}%</span></div>
                <Progress value={fill.pct} />
                <div className="flex flex-wrap gap-1">{units.map((u) => <Badge key={u.case_id} variant="outline" className="font-mono text-[10px]">{u.case_number} · {u.units}u</Badge>)}</div>
                {(r.data?.warnings || []).map((w: string) => <p key={w} className="text-[11px] text-warning-foreground">⚠ {w}</p>)}
                <p className="text-[11px] text-muted-foreground">
                  {r.data?.started_at && `Started ${format(new Date(r.data.started_at), "d MMM HH:mm")}`}
                  {eta && ` · ready ≈ ${format(eta, "HH:mm")}`}
                  {r.data?.finished_at && ` · ended ${format(new Date(r.data.finished_at), "d MMM HH:mm")}`}
                  {r.data?.failure && ` · ${r.data.failure}`}
                </p>
                <div className="flex gap-2">
                  {r.status === "staged" && <Button size="sm" onClick={() => move(r, "running")}><Play className="mr-1 h-3.5 w-3.5" />Start</Button>}
                  {r.status === "running" && <Button size="sm" onClick={() => move(r, "completed")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Complete</Button>}
                  {canRunMove(r.status as RunStatus, "failed") && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => move(r, "failed")}><XCircle className="mr-1 h-3.5 w-3.5" />Failed</Button>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {creating && <NewRunDialog type={type} runs={all.data || []} onClose={() => setCreating(false)} />}
    </div>
  );
}

export default function DlabCamPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "scans";
  return (
    <div className="space-y-5">
      <PageHeader title="CAD/CAM & Equipment" description="Check incoming scans, then batch cases onto milling discs, sintering cycles and print platforms." />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="scans">Scan Intake</TabsTrigger>
          <TabsTrigger value="mill">Milling</TabsTrigger>
          <TabsTrigger value="furnace">Sintering</TabsTrigger>
          <TabsTrigger value="printer">3D Printing</TabsTrigger>
        </TabsList>
        <TabsContent value="scans"><ScanIntake /></TabsContent>
        <TabsContent value="mill"><RunQueue type="mill" /></TabsContent>
        <TabsContent value="furnace"><RunQueue type="furnace" /></TabsContent>
        <TabsContent value="printer"><RunQueue type="printer" /></TabsContent>
      </Tabs>
    </div>
  );
}
