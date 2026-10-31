import { useEffect, useMemo, useState } from "react";
import { ArrowRight, PauseCircle, Pause, Play, ScanLine } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useLabCases } from "@/hooks/useLabCases";
import { useStaff } from "@/hooks/useStaff";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { useMoveCase, useHoldCase, clientOf, patientOf, isRush, isOverdue } from "@/hooks/useDentalLab";
import { useBarcodeScanner, scanBeep } from "@/hooks/useBarcodeScanner";
import { stageLabel } from "@/config/dentalLab";
import { blockedReason, nextStage, HOLD_REASONS } from "@/lib/labWorkflow";
import { benchTasks } from "@/lib/labBench";
import { formatDuration, matchScannedCase, teethLabel, timerElapsedMs, timerPause, timerRunning, timerStart, type TimerState } from "@/lib/labScanner";
import { toast } from "@/hooks/use-toast";
import { PrintTravelerButton } from "@/components/dlab/PrintTravelerButton";
import { useShadeLibrary } from "@/hooks/useLabCatalog";
import { shadeRecipe } from "@/lib/labCatalog";

const TIMER_KEY = "dlab-bench-timers";
type Timers = Record<string, TimerState>;
const loadTimers = (): Timers => { try { return JSON.parse(localStorage.getItem(TIMER_KEY) || "{}"); } catch { return {}; } };

export default function DlabBenchPage() {
  const { data: cases = [] } = useLabCases();
  const shades = useShadeLibrary();
  const { data: staff = [] } = useStaff();
  const { user } = useAuth() as any;
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const isSupervisor = ["owner", "admin", "manager"].includes(currentOrg?.role || "");
  const move = useMoveCase();
  const hold = useHoldCase();
  const me = staff.find((s: any) => s.user_id === user?.id);
  const [pick, setPick] = useState<string>("");
  // Only supervisors may look at someone else's bench.
  const staffId = (isSupervisor && pick) || me?.id || null;
  const viewingOther = !!me && staffId !== me.id;
  const tasks = useMemo(() => benchTasks(cases as any[], staffId), [cases, staffId]);
  const techs = staff.filter((s: any) => (s.status || "active") === "active");

  const [timers, setTimers] = useState<Timers>({});
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => { setTimers(loadTimers()); }, []);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const saveTimers = (t: Timers) => { setTimers(t); localStorage.setItem(TIMER_KEY, JSON.stringify(t)); };
  const timerOf = (id: string): TimerState => timers[id] || { startedAt: null, accumulatedMs: 0 };
  const startTimer = (id: string) => saveTimers({ ...timers, [id]: timerStart(timerOf(id), Date.now()) });
  const pauseTimer = (id: string) => saveTimers({ ...timers, [id]: timerPause(timerOf(id), Date.now()) });

  /** Saves the work time for this step, then clears the timer. */
  const logLabor = async (c: any) => {
    const secs = Math.round(timerElapsedMs(timerOf(c.id), Date.now()) / 1000);
    if (secs < 1) return;
    const { error } = await (supabase as any).rpc("lab_log_labor", { p_case_id: c.id, p_seconds: secs, p_stage: c.status });
    if (error) { toast({ title: "Work time not saved", description: error.message, variant: "destructive" }); return; }
    const { [c.id]: _, ...rest } = timers;
    saveTimers(rest);
    qc.invalidateQueries({ queryKey: ["lab_cases"] });
  };

  const advance = async (c: any) => {
    const to = nextStage(c.status);
    if (!to) return;
    const why = blockedReason(c.status, to, c.qc_status);
    if (why) return toast({ title: "Can't move yet", description: why, variant: "destructive" });
    await logLabor(c);
    move.mutate({ id: c.id, status: to }, { onSuccess: () => toast({ title: `${c.case_number} → ${stageLabel(to)}` }) });
  };

  useBarcodeScanner((code) => {
    const c = matchScannedCase(tasks, code);
    if (!c) {
      scanBeep(false);
      const elsewhere = matchScannedCase(cases as any[], code);
      return toast({ title: `Scanned ${code}`, description: elsewhere ? "This case is not on this bench." : "No case with this number.", variant: "destructive" });
    }
    scanBeep(true);
    setFlash(c.id);
    setTimeout(() => setFlash(null), 2500);
    const t = timerOf(c.id);
    if (timerRunning(t)) { pauseTimer(c.id); toast({ title: `${c.case_number} timer paused` }); }
    else { startTimer(c.id); toast({ title: `${c.case_number} timer started` }); }
  });

  return (
    <div className="space-y-4">
      <PageHeader title="My Bench" description="Your assigned cases for today. Scan a traveler to start or pause its timer." />
      <div className="flex flex-wrap items-center gap-2">
        {isSupervisor ? (
          <Select value={staffId || ""} onValueChange={setPick}>
            <SelectTrigger className="h-9 w-full sm:w-64"><SelectValue placeholder="Choose technician" /></SelectTrigger>
            <SelectContent>
              {techs.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.full_name}{s.id === me?.id ? " (me)" : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : me && <Badge variant="outline" className="h-9 px-3 text-sm">{me.full_name}</Badge>}
        <Badge variant="secondary">{tasks.length} task{tasks.length === 1 ? "" : "s"}</Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><ScanLine className="h-3.5 w-3.5" />Scanner ready</span>
      </div>

      {!staffId && <p className="text-sm text-muted-foreground">
        {isSupervisor ? "Your account isn't linked to a staff profile. Pick a technician above." : "Your account isn't linked to a staff profile. Ask a manager to link it."}
      </p>}
      {viewingOther && <p className="text-xs text-muted-foreground">Supervisor view: you are looking at another technician's bench.</p>}
      {staffId && tasks.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nothing on your bench. Nice work.</CardContent></Card>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tasks.map((c: any) => {
          const to = nextStage(c.status);
          const teeth: string[] = c.teeth || [];
          const t = timerOf(c.id);
          const running = timerRunning(t);
          const elapsed = timerElapsedMs(t, now);
          const logged = Number(c.labor_seconds_total || 0);
          return (
            <Card key={c.id} className={[isRush(c) ? "border-destructive/50" : "", flash === c.id ? "ring-2 ring-primary" : ""].join(" ")}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.case_number}</p>
                    <p className="truncate text-xs text-muted-foreground">{clientOf(c)} · {patientOf(c)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {isRush(c) && <Badge variant="destructive" className="text-[10px]">Rush</Badge>}
                    {isOverdue(c) && <Badge variant="outline" className="border-destructive text-[10px] text-destructive">Overdue</Badge>}
                    {c.qc_status === "rework_needed" && <Badge variant="outline" className="text-[10px]">Rework</Badge>}
                  </div>
                </div>
                <p className="text-sm">
                  {teeth.length > 0 && <span className="font-medium">#{teethLabel(teeth, c.tooth_roles || {}).join(", #")} · </span>}
                  {c.work_type}{c.shade ? ` · ${c.shade}` : ""}
                </p>
                {(() => {
                  const sh = shades.find(c.shade);
                  const { line, firing } = shadeRecipe(c.shade_map, sh?.data);
                  if (!line && !firing) return null;
                  return <div className="space-y-0.5 rounded-md bg-muted/50 px-2 py-1 text-xs">
                    {line && <p><span className="font-medium">Shade recipe:</span> {line}</p>}
                    {firing && <p className="whitespace-pre-wrap"><span className="font-medium">Stain / firing:</span> {firing}</p>}
                  </div>;
                })()}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{stageLabel(c.status)}</span>
                  <span>{c.due_date ? `Due ${c.due_date}` : "No due date"}</span>
                </div>
                {c.instructions && <p className="line-clamp-2 text-xs text-muted-foreground">{c.instructions}</p>}
                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <div>
                    <p className={`font-mono text-lg tabular-nums ${running ? "text-primary" : ""}`}>{formatDuration(elapsed)}</p>
                    <p className="text-[10px] text-muted-foreground">{running ? "Working…" : elapsed ? "Paused" : "Not started"}{logged ? ` · ${formatDuration(logged * 1000)} logged` : ""}</p>
                  </div>
                  {running
                    ? <Button size="sm" variant="outline" className="h-9" onClick={() => pauseTimer(c.id)}><Pause className="mr-1 h-3.5 w-3.5" />Pause</Button>
                    : <Button size="sm" variant="outline" className="h-9" onClick={() => startTimer(c.id)}><Play className="mr-1 h-3.5 w-3.5" />{elapsed ? "Resume" : "Start"}</Button>}
                </div>
                <div className="flex gap-2">
                  <Button className="h-11 flex-1" disabled={!to || move.isPending} onClick={() => advance(c)}>
                    Done → {to ? stageLabel(to) : "—"} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Select onValueChange={(r) => { pauseTimer(c.id); hold.mutate({ id: c.id, reason: r }); }}>
                    <SelectTrigger className="h-11 w-11 justify-center px-0" aria-label="Put on hold"><PauseCircle className="h-4 w-4" /></SelectTrigger>
                    <SelectContent>
                      {HOLD_REASONS.map((r: any) => { const v = typeof r === "string" ? r : r.label; return <SelectItem key={v} value={v}>{v}</SelectItem>; })}
                    </SelectContent>
                  </Select>
                  <PrintTravelerButton c={c} technician={staff.find((s: any) => s.id === c.technician_id)?.full_name} compact />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
