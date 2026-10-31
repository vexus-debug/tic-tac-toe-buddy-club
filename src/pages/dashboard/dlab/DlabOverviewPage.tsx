import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, subDays, differenceInCalendarDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, AlertTriangle, Zap, Truck, Inbox, PauseCircle, ShieldCheck, ArrowRight, Clock3, PackageCheck, Building2, Gauge,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LAB_STAGES, normalizeStage, stageLabel } from "@/config/dentalLab";
import { useLabCases, type LabCaseRow } from "@/hooks/useLabCases";
import { useOrg } from "@/hooks/useOrg";
import { clientOf, patientOf, isRush, isOverdue } from "@/hooks/useDentalLab";
import { cn } from "@/lib/utils";
import { money } from "./dlabMoney";
import { NewCaseDialog } from "./DlabCasesPage";

type Queue = "urgent" | "today" | "hold" | "ready";
type Tone = "primary" | "warning" | "destructive" | "success" | "info";

const toneSurface: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
};
const MIX_COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--muted-foreground))"];
const tooltipStyle = { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" };
const fade = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const } });

const fee = (c: LabCaseRow) => Number(c.lab_fee || 0) - Number(c.discount || 0);
const dayKey = (d: string | null | undefined) => (d ? d.slice(0, 10) : "");

function dueLabel(c: LabCaseRow) {
  if (!c.due_date) return { text: "No due date", tone: "muted" as const };
  const d = differenceInCalendarDays(new Date(c.due_date), new Date());
  if (d < 0) return { text: `${-d}d late`, tone: "destructive" as const };
  if (d === 0) return { text: "Due today", tone: "warning" as const };
  if (d === 1) return { text: "Tomorrow", tone: "info" as const };
  return { text: format(new Date(c.due_date), "d MMM"), tone: "muted" as const };
}

export default function DlabOverviewPage() {
  const { basePath } = useOrg();
  const { data: cases = [], isLoading } = useLabCases();
  const [creating, setCreating] = useState(false);
  const [queue, setQueue] = useState<Queue>("urgent");
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  const s = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const live = cases.filter((c) => c.status !== "cancelled");
    const active = live.filter((c) => normalizeStage(c.status) !== "delivered");
    const late = active.filter(isOverdue);
    const rush = active.filter(isRush);
    const urgent = [...late, ...rush.filter((c) => !late.includes(c))];
    const finished = live.filter((c) => c.completed_date && dayKey(c.completed_date) >= format(subDays(new Date(), 30), "yyyy-MM-dd"));
    const onTime = finished.filter((c) => !c.due_date || dayKey(c.completed_date) <= c.due_date).length;
    const done = live.filter((c) => c.completed_date);
    const tat = done.length ? done.reduce((a, c) => a + (new Date(c.completed_date!).getTime() - new Date(c.created_at).getTime()) / 864e5, 0) / done.length : 0;

    const velocity = Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
      return {
        day: format(new Date(d), "d MMM"),
        received: live.filter((c) => dayKey(c.created_at) === d).length,
        completed: live.filter((c) => dayKey(c.completed_date) === d).length,
      };
    });
    const types = new Map<string, number>();
    active.forEach((c) => types.set(c.work_type || "Other", (types.get(c.work_type || "Other") || 0) + 1));
    const sorted = [...types.entries()].sort((a, b) => b[1] - a[1]);
    const mix = sorted.slice(0, 4).map(([name, value]) => ({ name, value }));
    const rest = sorted.slice(4).reduce((a, [, n]) => a + n, 0);
    if (rest) mix.push({ name: "Other", value: rest });

    const clients = new Map<string, { name: string; n: number; late: number }>();
    active.forEach((c) => {
      const k = clientOf(c);
      const e = clients.get(k) || { name: k, n: 0, late: 0 };
      e.n++; if (isOverdue(c)) e.late++;
      clients.set(k, e);
    });
    const techs = new Map<string, number>();
    active.forEach((c) => { const t = c.technician?.full_name || "Unassigned"; techs.set(t, (techs.get(t) || 0) + 1); });

    const stages = LAB_STAGES.filter((st) => st.key !== "delivered").map((st) => ({ ...st, n: active.filter((c) => normalizeStage(c.status) === st.key && c.status !== "on_hold").length }));
    const maxStage = Math.max(1, ...stages.map((x) => x.n));

    return {
      active, late, rush, urgent,
      dueToday: active.filter((c) => c.due_date === today),
      held: active.filter((c) => c.status === "on_hold"),
      ready: active.filter((c) => normalizeStage(c.status) === "ready"),
      receivedToday: live.filter((c) => dayKey(c.created_at) === today).length,
      wipValue: active.reduce((a, c) => a + fee(c), 0),
      onTimePct: finished.length ? Math.round((onTime / finished.length) * 100) : null,
      tat, velocity, mix,
      topClients: [...clients.values()].sort((a, b) => b.n - a.n).slice(0, 5),
      techs: [...techs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      stages, maxStage,
      bottleneck: stages.reduce((m, x) => (x.n > m.n ? x : m), stages[0]),
    };
  }, [cases]);

  const kpis: { label: string; value: string; sub: string; icon: typeof Inbox; tone: Tone; queue?: Queue }[] = [
    { label: "In production", value: String(s.active.length), sub: `${money(s.wipValue)} work in progress`, icon: Inbox, tone: "primary" },
    { label: "Due today", value: String(s.dueToday.length), sub: `${s.ready.length} ready to ship`, icon: Truck, tone: s.dueToday.length ? "warning" : "info", queue: "today" },
    { label: "Late & rush", value: String(s.urgent.length), sub: `${s.late.length} late · ${s.rush.length} rush`, icon: AlertTriangle, tone: s.late.length ? "destructive" : "success", queue: "urgent" },
    { label: "On time (30d)", value: s.onTimePct === null ? "—" : `${s.onTimePct}%`, sub: `Avg turnaround ${s.tat.toFixed(1)} days`, icon: ShieldCheck, tone: s.onTimePct !== null && s.onTimePct < 85 ? "warning" : "success" },
    { label: "On hold", value: String(s.held.length), sub: s.held.length ? "Waiting on clinic" : "Nothing blocked", icon: PauseCircle, tone: s.held.length ? "warning" : "success", queue: "hold" },
  ];

  const queues: { key: Queue; label: string; rows: LabCaseRow[]; empty: string }[] = [
    { key: "urgent", label: "Late & rush", rows: s.urgent, empty: "Nothing late or rushed." },
    { key: "today", label: "Due today", rows: s.dueToday, empty: "Nothing due today." },
    { key: "hold", label: "On hold", rows: s.held, empty: "No cases on hold." },
    { key: "ready", label: "Ready to ship", rows: s.ready, empty: "Nothing waiting for dispatch." },
  ];
  const current = queues.find((q) => q.key === queue)!;
  const rows = (stageFilter ? s.active.filter((c) => normalizeStage(c.status) === stageFilter && c.status !== "on_hold") : current.rows).slice(0, 10);
  const totalMix = s.mix.reduce((a, m) => a + m.value, 0);
  const show = (v: string) => (isLoading ? "–" : v);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Production Command Center"
        description={`${s.receivedToday} received today · ${s.ready.length} ready to ship${s.bottleneck?.n ? ` · busiest: ${s.bottleneck.label}` : ""}`}
      >
        <Button asChild variant="outline"><Link to={`${basePath}/dlab/cases`}>Case board</Link></Button>
        <Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" />New case</Button>
      </PageHeader>

      {/* KPI pulse */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k, i) => {
          const Comp = k.queue ? motion.button : motion.div;
          const active = k.queue && !stageFilter && queue === k.queue;
          return (
            <Comp
              key={k.label}
              {...fade(i)}
              whileHover={k.queue ? { y: -2 } : undefined}
              onClick={k.queue ? () => { setQueue(k.queue!); setStageFilter(null); document.getElementById("triage")?.scrollIntoView({ behavior: "smooth", block: "start" }); } : undefined}
              className={cn(
                "rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
                k.queue && "cursor-pointer hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "border-primary/50 ring-1 ring-primary/30",
                i === 0 && "col-span-2 md:col-span-1",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneSurface[k.tone])}><k.icon className="h-4 w-4" /></span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-foreground">{show(k.value)}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{k.sub}</p>
            </Comp>
          );
        })}
      </div>

      {/* Pipeline */}
      <motion.div {...fade(5)}>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">Production pipeline</CardTitle>
              <CardDescription>Tap a stage to see its cases below.</CardDescription>
            </div>
            {stageFilter && <Button variant="ghost" size="sm" onClick={() => setStageFilter(null)}>Clear</Button>}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {s.stages.map((st, i) => {
                const on = stageFilter === st.key;
                const hot = st.n > 0 && st.key === s.bottleneck?.key && st.n >= 3;
                return (
                  <button
                    key={st.key}
                    onClick={() => { setStageFilter(on ? null : st.key); document.getElementById("triage")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                    className={cn(
                      "group relative min-h-[44px] overflow-hidden rounded-lg border p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on ? "border-primary bg-primary/5" : "bg-muted/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{i + 1}. {st.label}</span>
                      {hot && <Gauge className="h-3.5 w-3.5 text-warning" aria-label="Busiest stage" />}
                    </div>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{show(String(st.n))}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div className={cn("h-full rounded-full", hot ? "bg-warning" : "bg-primary")} initial={{ width: 0 }} animate={{ width: `${(st.n / s.maxStage) * 100}%` }} transition={{ duration: 0.7, delay: 0.2 + i * 0.05 }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-5">
        <motion.div {...fade(6)} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Intake vs. completed</CardTitle>
              <CardDescription>Cases received and finished each day, last 14 days.</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={s.velocity} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gRecv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="received" name="Received" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gRecv)" />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#gDone)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fade(7)} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Work in production</CardTitle>
              <CardDescription>What's on the benches by restoration type.</CardDescription>
            </CardHeader>
            <CardContent>
              {totalMix === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No active cases.</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative h-40 w-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={s.mix} dataKey="value" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
                          {s.mix.map((_, i) => <Cell key={i} fill={MIX_COLORS[i % MIX_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold tabular-nums text-foreground">{totalMix}</span>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">cases</span>
                    </div>
                  </div>
                  <ul className="min-w-0 flex-1 space-y-2 text-sm">
                    {s.mix.map((m, i) => (
                      <li key={m.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: MIX_COLORS[i % MIX_COLORS.length] }} />
                        <span className="truncate">{m.name}</span>
                        <span className="ml-auto tabular-nums text-muted-foreground">{Math.round((m.value / totalMix) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Triage */}
      <motion.div {...fade(8)} id="triage" className="scroll-mt-4">
        <Card>
          <CardHeader className="space-y-3 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{stageFilter ? `In ${stageLabel(stageFilter)}` : "Needs attention"}</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link to={`${basePath}/dlab/cases`}>Open board <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
            </div>
            {!stageFilter && (
              <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
                {queues.map((q) => (
                  <button
                    key={q.key}
                    onClick={() => setQueue(q.key)}
                    className={cn("relative min-h-[36px] shrink-0 rounded-md px-3 text-sm font-medium transition-colors", queue === q.key ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    {queue === q.key && <motion.span layoutId="triageTab" className="absolute inset-0 rounded-md bg-background shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
                    <span className="relative">{q.label} <span className="tabular-nums text-muted-foreground">{q.rows.length}</span></span>
                  </button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="popLayout" initial={false}>
              {rows.length === 0 ? (
                <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center text-sm text-muted-foreground">
                  {cases.length ? (stageFilter ? "No cases in this stage." : current.empty) : "No cases yet. Add your first case to get started."}
                </motion.p>
              ) : (
                <motion.ul key={`${queue}-${stageFilter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="divide-y">
                  {rows.map((c, i) => {
                    const due = dueLabel(c);
                    return (
                      <motion.li key={c.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                        <Link to={`${basePath}/dlab/cases`} className="flex items-center gap-3 rounded-md px-1 py-2.5 transition-colors hover:bg-muted/50">
                          <span className={cn("h-9 w-1 shrink-0 rounded-full", isOverdue(c) ? "bg-destructive" : isRush(c) ? "bg-warning" : "bg-primary/40")} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{c.case_number} · {c.work_type}{c.shade ? ` · ${c.shade}` : ""}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {clientOf(c)}{c.clinic_doctor_name ? ` · Dr ${c.clinic_doctor_name}` : ""} · {patientOf(c)} · {stageLabel(c.status)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={cn("inline-flex items-center gap-1 text-xs font-medium tabular-nums",
                              due.tone === "destructive" && "text-destructive", due.tone === "warning" && "text-warning", due.tone === "info" && "text-info", due.tone === "muted" && "text-muted-foreground")}>
                              <Clock3 className="h-3 w-3" />{due.text}
                            </span>
                            {isRush(c) && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]"><Zap className="mr-0.5 h-3 w-3" />Rush</Badge>}
                          </div>
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clients & bench */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div {...fade(9)}>
          <Card className="h-full">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-muted-foreground" />Busiest clients</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!s.topClients.length && <p className="py-4 text-center text-sm text-muted-foreground">No active cases.</p>}
              {s.topClients.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{c.n}{c.late ? <span className="ml-1 text-destructive">· {c.late} late</span> : null}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(c.n / s.topClients[0].n) * 100}%` }} transition={{ duration: 0.6 }} /></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fade(10)}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><PackageCheck className="h-4 w-4 text-muted-foreground" />Bench workload</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link to={`${basePath}/dlab/bench`}>My bench</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {!s.techs.length && <p className="py-4 text-center text-sm text-muted-foreground">No active cases.</p>}
              {s.techs.map(([name, n]) => (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className={cn("truncate", name === "Unassigned" && "text-warning")}>{name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><motion.div className={cn("h-full rounded-full", name === "Unassigned" ? "bg-warning" : "bg-info")} initial={{ width: 0 }} animate={{ width: `${(n / s.techs[0][1]) * 100}%` }} transition={{ duration: 0.6 }} /></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <NewCaseDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
