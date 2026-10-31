import { useEffect, useMemo, useState } from "react";
import {
  addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday,
  parseISO, startOfMonth, startOfWeek,
} from "date-fns";
import { AlertTriangle, CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, Truck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLabCases, useUpdateLabCase, type LabCaseRow } from "@/hooks/useLabCases";
import { clientOf, isRush, patientOf } from "@/hooks/useDentalLab";
import { stageLabel } from "@/config/dentalLab";
import { useLabWorkCalendar } from "@/hooks/useLabWorkCalendar";
import { useSaveLabSettings } from "@/hooks/lab/useLab";
import {
  addWorkingDaysYmd, netDaysLate, isUnscheduled, loadLevel, turnaroundFor, unitsByDay, unitsOf, type LoadLevel,
} from "@/lib/labCalendar";

type View = "month" | "week" | "day";

const LOAD_STYLE: Record<LoadLevel, string> = {
  none: "",
  normal: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  busy: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  overloaded: "bg-destructive/15 text-destructive",
};
const LOAD_BAR: Record<LoadLevel, string> = {
  none: "bg-muted", normal: "bg-emerald-500", busy: "bg-amber-500", overloaded: "bg-destructive",
};

const teethOf = (c: LabCaseRow) => ((c as any).teeth as string[] | undefined) ?? [];

function CaseLine({ c }: { c: LabCaseRow }) {
  const t = teethOf(c);
  return (
    <div className="flex justify-between gap-2 py-2 text-sm">
      <div className="min-w-0">
        <div className="truncate font-medium">
          {c.case_number} · {c.work_type}
          {isRush(c) && <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px]">Rush</Badge>}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {clientOf(c)} · {patientOf(c)}{t.length ? ` · #${t.join(", #")}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{stageLabel(c.status)}</span>
    </div>
  );
}

export default function DlabCalendarPage() {
  const { data: cases = [] } = useLabCases();
  const update = useUpdateLabCase();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [picked, setPicked] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const work = useLabWorkCalendar();
  const saveSettings = useSaveLabSettings();
  const [capacity, setCapacity] = useState(20);
  const [overdueOpen, setOverdueOpen] = useState(true);
  const [drawer, setDrawer] = useState(false);

  // Capacity and working days live in the lab's shared settings, not on this device.
  useEffect(() => { if (work.loaded) setCapacity(work.capacity); }, [work.loaded, work.capacity]);
  const saveCap = () => { if (capacity > 0 && capacity !== work.capacity) saveSettings.mutate({ daily_capacity: capacity }); };
  const saturdayOpen = work.cal.workingDays.includes(6);
  const toggleSaturday = () => saveSettings.mutate({
    working_days: saturdayOpen ? work.cal.workingDays.filter((d) => d !== 6) : [...work.cal.workingDays, 6].sort(),
  });

  const active = useMemo(() => cases.filter((c) => c.status !== "cancelled"), [cases]);
  const byDay = useMemo(() => {
    const m: Record<string, LabCaseRow[]> = {};
    active.forEach((c) => { if (c.due_date) (m[c.due_date] ||= []).push(c); });
    return m;
  }, [active]);
  const units = useMemo(() => unitsByDay(cases as any), [cases]);
  const overdue = useMemo(
    () => active.map((c) => ({ c, late: netDaysLate(c as any) })).filter((x) => x.late > 0).sort((a, b) => b.late - a.late),
    [active],
  );
  const unscheduled = useMemo(() => active.filter((c) => isUnscheduled(c)), [active]);

  const step = (dir: number) => {
    const next = view === "month" ? addMonths(cursor, dir) : addDays(cursor, dir * (view === "week" ? 7 : 1));
    setCursor(next);
    if (view === "day") setPicked(format(next, "yyyy-MM-dd"));
  };
  const title =
    view === "month" ? format(cursor, "MMMM yyyy")
    : view === "week" ? `${format(startOfWeek(cursor, { weekStartsOn: 1 }), "d MMM")} – ${format(endOfWeek(cursor, { weekStartsOn: 1 }), "d MMM yyyy")}`
    : format(cursor, "EEEE d MMMM yyyy");

  const meter = (key: string) => {
    const u = units[key] || 0;
    const lvl = loadLevel(u, capacity);
    const pct = Math.min(100, Math.round((u / Math.max(1, capacity)) * 100));
    return { u, lvl, pct };
  };

  const openDay = (key: string) => { setPicked(key); setCursor(parseISO(key)); setView("day"); };

  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });
  const weekDays = eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) });
  const dayKey = format(cursor, "yyyy-MM-dd");
  const dayCases = byDay[dayKey] || [];
  const dayGroups = useMemo(() => {
    const g: Record<string, LabCaseRow[]> = {};
    dayCases.forEach((c) => (g[clientOf(c)] ||= []).push(c));
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [dayCases]);

  const schedule = (c: LabCaseRow, days = turnaroundFor(c.work_type)) =>
    update.mutate({ id: c.id, due_date: addWorkingDaysYmd(new Date(), days, work.cal) });

  return (
    <div className="space-y-4">
      <PageHeader title="Production Calendar" description="Due dates, daily workload and late cases at a glance." />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as View)} variant="outline" size="sm">
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
        </ToggleGroup>
        <Button size="sm" variant="outline" onClick={() => setDrawer(true)}>
          <CalendarPlus className="mr-1.5 h-4 w-4" /> No due date
          {unscheduled.length > 0 && <Badge className="ml-1.5 px-1.5 py-0 text-[10px]">{unscheduled.length}</Badge>}
        </Button>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          Units/day
          <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} onBlur={saveCap}
            onKeyDown={(e) => e.key === "Enter" && saveCap()} className="h-8 w-16" />
        </label>
        <Button size="sm" variant={saturdayOpen ? "default" : "outline"} disabled={saveSettings.isPending} onClick={toggleSaturday}
          title="Due dates skip closed days and lab holidays">
          {saturdayOpen ? "Open Saturdays" : "Closed weekends"}
        </Button>
      </div>

      {/* Overdue tray */}
      {overdue.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3">
            <button className="flex w-full items-center gap-2 text-left text-sm font-semibold text-destructive" onClick={() => setOverdueOpen((o) => !o)}>
              <AlertTriangle className="h-4 w-4" /> Overdue: {overdue.length} case{overdue.length > 1 ? "s" : ""}
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${overdueOpen ? "rotate-180" : ""}`} />
            </button>
            {overdueOpen && (
              <div className="mt-2 max-h-56 divide-y overflow-y-auto">
                {overdue.map(({ c, late }) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1"><CaseLine c={c} /></div>
                    <Badge variant="destructive" className="shrink-0 text-[10px]">{late} day{late > 1 ? "s" : ""} late</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card><CardContent className="p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button size="icon" variant="ghost" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
          <button className="font-semibold" onClick={() => { setCursor(new Date()); setPicked(format(new Date(), "yyyy-MM-dd")); }}>{title}</button>
          <Button size="icon" variant="ghost" onClick={() => step(1)} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
        </div>

        {view === "month" && (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {monthDays.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const { u, lvl } = meter(key);
                const rush = (byDay[key] || []).some(isRush);
                const sel = key === picked;
                return (
                  <button key={key} onClick={() => setPicked(key)} onDoubleClick={() => openDay(key)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${sel ? "ring-2 ring-primary" : ""} ${isToday(d) ? "font-bold" : ""} ${u ? LOAD_STYLE[lvl] : "hover:bg-muted"} ${isSameMonth(d, cursor) ? "" : "opacity-40"}`}>
                    {format(d, "d")}
                    {u > 0 && <span className="text-[10px] font-semibold">{u}u</span>}
                    {rush && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-destructive" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Under 70%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />70–90%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />Over 90%</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-destructive" />Rush</span>
            </div>
          </>
        )}

        {view === "week" && (
          <div className="space-y-2">
            {weekDays.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const { u, lvl, pct } = meter(key);
              const list = byDay[key] || [];
              const finishing = list.filter((c) => ["ceramics", "qc"].includes(c.status)).length;
              return (
                <button key={key} onClick={() => openDay(key)} className={`w-full rounded-lg border p-2 text-left hover:bg-muted/50 ${isToday(d) ? "border-primary" : ""}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-20 shrink-0 font-medium">{format(d, "EEE d")}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${LOAD_BAR[lvl]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`shrink-0 rounded px-1.5 text-[11px] font-semibold ${LOAD_STYLE[lvl]}`}>{u}/{capacity}</span>
                  </div>
                  {list.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {list.slice(0, 6).map((c) => (
                        <Badge key={c.id} variant={isRush(c) ? "destructive" : "secondary"} className="text-[10px] font-normal">
                          {c.case_number} · {stageLabel(c.status)}
                        </Badge>
                      ))}
                      {list.length > 6 && <span className="text-[11px] text-muted-foreground">+{list.length - 6} more</span>}
                      {finishing > 0 && <span className="ml-auto text-[11px] text-muted-foreground">{finishing} in finishing</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {view === "day" && (() => {
          const { u, lvl, pct } = meter(dayKey);
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Workload</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full ${LOAD_BAR[lvl]}`} style={{ width: `${pct}%` }} /></div>
                <span className={`rounded px-1.5 text-[11px] font-semibold ${LOAD_STYLE[lvl]}`}>{u}/{capacity} units</span>
              </div>
              {dayGroups.length === 0 && <p className="py-3 text-sm text-muted-foreground">No cases due.</p>}
              {dayGroups.map(([client, list]) => (
                <div key={client} className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-sm font-medium">
                    <Truck className="h-3.5 w-3.5" /> {client}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {list.filter((c) => ["ready", "delivered"].includes(c.status)).length}/{list.length} ready
                    </span>
                  </div>
                  <div className="divide-y px-3">{list.map((c) => <CaseLine key={c.id} c={c} />)}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </CardContent></Card>

      {view === "month" && (
        <Card><CardContent className="divide-y p-4">
          <div className="flex items-center justify-between pb-2">
            <p className="font-semibold">{format(parseISO(picked), "EEEE d MMMM")}</p>
            <Button size="sm" variant="ghost" onClick={() => openDay(picked)}>Day view</Button>
          </div>
          {(byDay[picked] || []).length === 0 && <p className="py-3 text-sm text-muted-foreground">No cases due.</p>}
          {(byDay[picked] || []).map((c) => <CaseLine key={c.id} c={c} />)}
        </CardContent></Card>
      )}

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>Cases without a due date</SheetTitle></SheetHeader>
          <p className="mt-1 text-xs text-muted-foreground">One tap sets the due date using the standard turnaround for that work type.</p>
          <div className="mt-3 divide-y">
            {unscheduled.length === 0 && <p className="py-4 text-sm text-muted-foreground">Every open case has a due date.</p>}
            {unscheduled.map((c) => {
              const days = isRush(c) ? Math.max(1, Math.ceil(turnaroundFor(c.work_type) / 2)) : turnaroundFor(c.work_type);
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1"><CaseLine c={c} /></div>
                  <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => schedule(c, days)}>
                    +{days} work days · {format(parseISO(addWorkingDaysYmd(new Date(), days, work.cal)), "d MMM")}
                  </Button>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
