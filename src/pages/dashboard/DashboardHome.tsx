import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ListChecks,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageTourButton } from "@/components/dashboard/tour/PageTourButton";
import { startDentistVisitTour } from "@/components/dashboard/tour/DentistVisitTourHost";
import DlabOverviewPage from "@/pages/dashboard/dlab/DlabOverviewPage";
import { EyeTodayScreen } from "@/components/dashboard/eye/EyeTodayScreen";
import { useAddToWaitingList } from "@/hooks/useWaitingList";
import { DentistWaitingRoomCard } from "@/components/dashboard/DentistWaitingRoomCard";
import { MorningHuddleCard } from "@/components/dashboard/MorningHuddleCard";
import {
  useCurrentUserName,
  useDashboardStats,
  useDentalDashboardPulse,
  useRevenueData,
  useTodaySchedule,
  useWeeklyAppointments,
} from "@/hooks/useDashboardData";
import { useOrg } from "@/hooks/useOrg";
import { hasPageAccess } from "@/config/roleAccess";
import { cn } from "@/lib/utils";

type DashboardMode = "owner" | "dentist" | "receptionist" | "finance" | "support" | "stock";
type ScheduleItem = {
  id: string;
  patientId?: string;
  staffId: string;
  time: string;
  patientName: string;
  dentist: string;
  chair: string;
  treatment: string;
  status: string;
};

const iconStroke = 1.8;
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function roleMode(role: string): DashboardMode {
  if (["owner", "admin", "manager"].includes(role)) return "owner";
  if (["dentist", "hygienist"].includes(role)) return "dentist";
  if (role === "receptionist") return "receptionist";
  if (role === "accountant") return "finance";
  if (["nurse", "assistant"].includes(role)) return "support";
  if (["lab_technician", "lab_assistant", "procurement_officer"].includes(role)) return "stock";
  return "support";
}

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="relative h-28 w-28 shrink-0" aria-label={`${percentage}% of today's appointments completed`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="74%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={[{ value: percentage }]}
        >
          <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" fill="hsl(var(--primary))" cornerRadius={12} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-foreground">{percentage}%</span>
        <span className="text-[10px] font-semibold uppercase text-muted-foreground">complete</span>
      </div>
    </div>
  );
}

type Tone = "success" | "warning" | "destructive" | "info";

const toneSurface: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};
const toneStroke: Record<Tone, string> = {
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  info: "hsl(var(--info))",
};
const kpiTones: Record<DashboardMode, Tone[]> = {
  owner: ["success", "info", "warning", "destructive"],
  dentist: ["info", "success", "info", "warning"],
  receptionist: ["warning", "info", "success", "destructive"],
  finance: ["success", "success", "destructive", "warning"],
  support: ["warning", "info", "success", "info"],
  stock: ["info", "warning", "info", "success"],
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const points = data.map((value, index) => ({ index, value }));
  return (
    <div className="h-8 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiTile({ label, value, detail, icon: Icon, series, tone }: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
  series: number[];
  tone: Tone;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", toneSurface[tone])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={iconStroke} />
        </span>
      </div>
      <p className="mt-2 truncate text-xl font-bold tabular-nums text-foreground sm:text-2xl">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{detail}</p>
      <div className="mt-2"><Sparkline data={series} color={toneStroke[tone]} /></div>
    </div>
  );
}

function ToothMotif() {
  return (
    <div className="grid grid-cols-4 gap-1" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
        <span key={item} className="h-4 w-3 rounded-t-full border border-primary/25 bg-primary/5" />
      ))}
    </div>
  );
}

function OnboardingChecklist({ basePath, activeDentists, treatmentCount, patientCount }: {
  basePath: string;
  activeDentists: number;
  treatmentCount: number;
  patientCount: number;
}) {
  const steps = [
    { label: "Add a dentist", done: activeDentists > 0, to: `${basePath}/staff` },
    { label: "Add your services", done: treatmentCount > 0, to: `${basePath}/treatments` },
    { label: "Register your first patient", done: patientCount > 0, to: `${basePath}/patients` },
  ];
  const done = steps.filter((step) => step.done).length;

  return (
    <div className="overflow-hidden rounded-lg border border-border/80">
      <div className="grid gap-6 rounded-[7px] bg-card p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <ToothMotif />
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Clinic setup</p>
              <h2 className="text-lg font-bold text-foreground">Open your digital front door</h2>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {steps.map((step) => (
              <Link key={step.label} to={step.to} className="flex items-center gap-2 rounded-md border border-border/70 p-3 text-sm transition-colors hover:bg-muted/60">
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", step.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
                  {step.done && <Check className="h-3 w-3" strokeWidth={2} />}
                </span>
                <span className={step.done ? "text-muted-foreground line-through" : "font-medium text-foreground"}>{step.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-3xl font-bold tabular-nums text-foreground">{done}/3</p>
          <p className="text-xs text-muted-foreground">setup steps complete</p>
        </div>
      </div>
    </div>
  );
}

function StandardDashboardHome() {
  const { data: stats } = useDashboardStats();
  const { data: weeklyData = [] } = useWeeklyAppointments();
  const { data: revenueData = [] } = useRevenueData();
  const { data: allSchedule = [] } = useTodaySchedule();
  const { data: pulse } = useDentalDashboardPulse();
  const { data: userName } = useCurrentUserName();
  const { currentOrg, basePath } = useOrg();
  const checkIn = useAddToWaitingList();
  // The walkthrough tours real patient screens, which only render with a
  // patient selected — so it runs against a phantom demo patient.
  const mode = roleMode(currentOrg?.role || "receptionist");

  const schedule = useMemo(() => {
    const items = allSchedule as ScheduleItem[];
    if (mode !== "dentist") return items;
    if (!pulse?.assignedStaffId) return [];
    return items.filter((item) => item.staffId === pulse.assignedStaffId);
  }, [allSchedule, mode, pulse?.assignedStaffId]);

  const completed = schedule.filter((item) => item.status === "completed").length;
  const activeQueue = (pulse?.queue || []).filter((item) => !["completed", "cancelled"].includes(item.status));
  const now = format(new Date(), "HH:mm");
  const nextAppointment = schedule.find((item) => item.status === "scheduled" && item.time >= now) || schedule.find((item) => item.status === "scheduled");
  const weeklySeries = weeklyData.map((day) => day.count);
  const revenueSeries = revenueData.map((month) => month.revenue);
  const paymentSeries = (pulse?.paymentSeries || []).map((day) => day.value);
  const totalWeekly = weeklySeries.reduce((sum, value) => sum + value, 0);
  const emptyDay = weeklyData.filter((day) => day.count === Math.min(...weeklySeries)).at(0)?.day;
  const s = stats || { totalPatients: 0, todayAppointments: 0, pendingPayments: 0, monthlyRevenue: 0 };

  type Hero = { eyebrow: string; title: string; action: string; to: string; icon: typeof Activity };
  type Kpi = { label: string; value: string; detail: string; icon: typeof Activity; series: number[] };
  type ActionItem = { count: number | null; text: string; action: string; to: string; icon: typeof Activity };
  let hero: Hero = mode === "owner"
    ? { eyebrow: "Clinic pulse", title: `${schedule.length} appointments shape today`, action: "Review clinic", to: `${basePath}/appointments`, icon: Activity }
    : mode === "dentist"
      ? { eyebrow: "Your clinical day", title: nextAppointment ? `${nextAppointment.patientName} is next` : "Your chair is clear", action: "Open schedule", to: `${basePath}/appointments`, icon: Stethoscope }
      : { eyebrow: "Front desk now", title: activeQueue.length ? `${activeQueue.length} patients need attention` : "The queue is clear", action: activeQueue.length ? "Manage queue" : "Book appointment", to: activeQueue.length ? `${basePath}/waiting-list` : `${basePath}/appointments`, icon: ListChecks };

  let kpis: Kpi[] = mode === "owner"
    ? [
        { label: "Monthly revenue", value: formatCurrency(s.monthlyRevenue), detail: "Collected this month", icon: TrendingUp, series: revenueSeries },
        { label: "Patients", value: s.totalPatients.toLocaleString(), detail: "Clinic-wide total", icon: Users, series: weeklySeries },
        { label: "Today", value: s.todayAppointments.toString(), detail: `${completed} completed`, icon: CalendarDays, series: weeklySeries },
        { label: "Outstanding", value: formatCurrency(pulse?.pendingInvoiceValue || 0), detail: `${pulse?.pendingInvoiceCount || 0} invoices`, icon: CreditCard, series: paymentSeries },
      ]
    : mode === "dentist"
      ? [
          { label: "Your patients", value: schedule.length.toString(), detail: "Booked today", icon: Users, series: weeklySeries },
          { label: "Completed", value: completed.toString(), detail: `${Math.max(schedule.length - completed, 0)} remaining`, icon: CalendarCheck, series: weeklySeries },
          { label: "Current chair", value: nextAppointment?.chair || "—", detail: nextAppointment ? `Next at ${nextAppointment.time}` : "No patient waiting", icon: Stethoscope, series: weeklySeries },
          { label: "Recalls", value: (pulse?.recallsDue || 0).toString(), detail: "Due within 14 days", icon: Clock3, series: weeklySeries },
        ]
      : [
          { label: "Live queue", value: activeQueue.length.toString(), detail: "Patients checked in", icon: ListChecks, series: weeklySeries },
          { label: "Appointments", value: schedule.length.toString(), detail: `${schedule.filter((item) => item.status === "scheduled").length} upcoming`, icon: CalendarDays, series: weeklySeries },
          { label: "Collected today", value: formatCurrency(pulse?.todayCollections || 0), detail: "Recorded payments", icon: CircleDollarSign, series: paymentSeries },
          { label: "Pending invoices", value: (pulse?.pendingInvoiceCount || 0).toString(), detail: formatCurrency(pulse?.pendingInvoiceValue || 0), icon: CreditCard, series: paymentSeries },
        ];

  const dailyInsight = totalWeekly === 0
    ? "As appointments build, I’ll spot quieter days and opportunities to improve chair use."
    : emptyDay
      ? `${emptyDay} has the lightest appointment load this week; consider moving recalls into those open slots.`
      : "Today’s schedule is balanced across the clinic.";

  let actions: ActionItem[] = mode === "owner"
    ? [
        { count: pulse?.recallsDue || 0, text: "recalls due", action: "Send reminders", to: `${basePath}/patients`, icon: Clock3 },
        { count: pulse?.pendingInvoiceCount || 0, text: "invoices outstanding", action: "Review billing", to: `${basePath}/billing`, icon: CreditCard },
        { count: Math.max(8 - schedule.length, 0), text: "open slots today", action: "Open calendar", to: `${basePath}/appointments`, icon: CalendarDays },
      ]
    : mode === "dentist"
      ? [
          { count: Math.max(schedule.length - completed, 0), text: "patients remaining", action: "View schedule", to: `${basePath}/appointments`, icon: CalendarCheck },
          { count: pulse?.recallsDue || 0, text: "recalls due soon", action: "Review patients", to: `${basePath}/patients`, icon: Users },
        ]
      : [
          { count: activeQueue.length, text: "patients in queue", action: "Manage arrivals", to: `${basePath}/waiting-list`, icon: ListChecks },
          { count: pulse?.pendingInvoiceCount || 0, text: "payments to follow up", action: "Open billing", to: `${basePath}/billing`, icon: CreditCard },
          { count: schedule.filter((item) => item.status === "scheduled").length, text: "appointments ahead", action: "Confirm bookings", to: `${basePath}/appointments`, icon: CalendarDays },
        ];

  if (mode === "finance") {
    hero = { eyebrow: "Finance today", title: pulse?.pendingInvoiceCount ? `${pulse.pendingInvoiceCount} invoices awaiting payment` : "All invoices settled", action: "Open billing", to: `${basePath}/billing`, icon: CircleDollarSign };
    kpis = [
      { label: "Monthly revenue", value: formatCurrency(s.monthlyRevenue), detail: "Collected this month", icon: TrendingUp, series: revenueSeries },
      { label: "Collected today", value: formatCurrency(pulse?.todayCollections || 0), detail: "Recorded payments", icon: CircleDollarSign, series: paymentSeries },
      { label: "Outstanding", value: formatCurrency(pulse?.pendingInvoiceValue || 0), detail: `${pulse?.pendingInvoiceCount || 0} invoices`, icon: CreditCard, series: paymentSeries },
      { label: "Pending invoices", value: (pulse?.pendingInvoiceCount || 0).toString(), detail: "To follow up", icon: CreditCard, series: paymentSeries },
    ];
    actions = [
      { count: pulse?.pendingInvoiceCount || 0, text: "invoices outstanding", action: "Review billing", to: `${basePath}/billing`, icon: CreditCard },
      { count: null, text: "Expenses", action: "Record or review expenses", to: `${basePath}/expenses`, icon: CircleDollarSign },
      { count: null, text: "Reports", action: "Open financial reports", to: `${basePath}/reports`, icon: TrendingUp },
    ];
  } else if (mode === "support") {
    hero = { eyebrow: "Clinical support", title: activeQueue.length ? `${activeQueue.length} patients waiting` : "No patients waiting", action: "Open queue", to: `${basePath}/waiting-list`, icon: ListChecks };
    kpis = [
      { label: "Live queue", value: activeQueue.length.toString(), detail: "Patients checked in", icon: ListChecks, series: weeklySeries },
      { label: "Appointments", value: schedule.length.toString(), detail: `${completed} completed`, icon: CalendarDays, series: weeklySeries },
      { label: "Chairs in use", value: schedule.filter((i) => i.status.startsWith("in")).length.toString(), detail: "Right now", icon: Stethoscope, series: weeklySeries },
      { label: "Next patient", value: nextAppointment?.time || "—", detail: nextAppointment?.patientName || "None scheduled", icon: Clock3, series: weeklySeries },
    ];
    actions = [
      { count: activeQueue.length, text: "patients in queue", action: "Prepare chairs", to: `${basePath}/waiting-list`, icon: ListChecks },
      { count: null, text: "Inventory", action: "Check clinical supplies", to: `${basePath}/inventory`, icon: Activity },
    ];
  } else if (mode === "stock") {
    const isLab = currentOrg?.role !== "procurement_officer";
    hero = isLab
      ? { eyebrow: "Lab desk", title: "Your lab cases", action: "Open lab cases", to: `${basePath}/lab/cases`, icon: Activity }
      : { eyebrow: "Procurement", title: "Stock and supplies", action: "Open inventory", to: `${basePath}/inventory`, icon: Activity };
    kpis = [];
    actions = isLab
      ? [
          { count: null, text: "Lab cases", action: "Review active cases", to: `${basePath}/lab/cases`, icon: Activity },
          { count: null, text: "Lab billing", action: "Review lab invoices", to: `${basePath}/lab/billing`, icon: CreditCard },
        ]
      : [
          { count: null, text: "Inventory", action: "Check stock levels", to: `${basePath}/inventory`, icon: Activity },
          { count: null, text: "Inventory costs", action: "Review spending", to: `${basePath}/inventory-costs`, icon: CircleDollarSign },
          { count: null, text: "Expenses", action: "Record purchases", to: `${basePath}/expenses`, icon: CreditCard },
        ];
  }
  const role = currentOrg?.role || "receptionist";
  actions = actions.filter((a) => hasPageAccess(role, a.to.slice(basePath.length + 1), currentOrg?.clinic_type));
  if (!hasPageAccess(role, hero.to.slice(basePath.length + 1), currentOrg?.clinic_type)) hero = { ...hero, to: `${basePath}/messages`, action: "Open messages" };
  const showClinicFloor = ["owner", "dentist", "receptionist", "support"].includes(mode);
  const showSchedule = showClinicFloor;

  const showOnboarding = mode === "owner" && s.totalPatients === 0;

  const operatories = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    schedule.forEach((item) => {
      const key = item.chair && item.chair !== "-" ? item.chair : "Unassigned";
      map.set(key, [...(map.get(key) || []), item]);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [schedule]);

  const inChairCount = schedule.filter((i) => i.status.startsWith("in")).length;
  const missedCount = schedule.filter((i) => ["cancelled", "no-show", "no_show"].includes(i.status)).length;
  const flowStages = [
    { label: "Booked", value: schedule.length, className: "text-foreground" },
    { label: "Confirmed", value: schedule.filter((i) => i.status === "confirmed").length, className: "text-info" },
    { label: "Waiting", value: activeQueue.length, className: "text-warning" },
    { label: "In chair", value: inChairCount, className: "text-info" },
    { label: "Completed", value: completed, className: "text-success" },
    { label: "No-show / cancelled", value: missedCount, className: "text-destructive" },
  ];

  const statusTone = (status: string): Tone => {
    if (status === "completed") return "success";
    if (status.startsWith("in")) return "info";
    if (["cancelled", "no-show", "no_show"].includes(status)) return "destructive";
    if (status === "confirmed") return "info";
    return "warning";
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-3" data-tour="page-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{getGreeting()}, {userName || "there"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{schedule.length}</span> appointments · <span className="font-semibold text-success">{completed}</span> done · <span className="font-semibold text-warning">{activeQueue.length}</span> waiting
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "dentist" && <Button size="sm" variant="outline" onClick={startDentistVisitTour}>Walk through a visit</Button>}
          <Button asChild size="sm"><Link to={hero.to}>{hero.action}<ArrowRight className="h-4 w-4" /></Link></Button>
          <PageTourButton />
        </div>
      </div>

      {showOnboarding && (
        <OnboardingChecklist
          basePath={basePath}
          activeDentists={pulse?.activeDentists || 0}
          treatmentCount={pulse?.treatmentCount || 0}
          patientCount={s.totalPatients}
        />
      )}

      {mode === "dentist" && <DentistWaitingRoomCard staffId={pulse?.assignedStaffId || null} />}

      {kpis.length > 0 && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="dashboard-kpi-cards">
        {kpis.map((kpi, i) => <KpiTile key={kpi.label} {...kpi} tone={kpiTones[mode][i]} />)}
      </div>}

      {(mode === "owner" || mode === "finance") && <MorningHuddleCard basePath={basePath} />}

      {showClinicFloor && (
        <Card className="border-border/60" data-tour="patient-flow">
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient flow today</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {flowStages.map((stage) => (
                <div key={stage.label} className="rounded-md border border-border/60 p-3">
                  <p className={cn("text-2xl font-bold tabular-nums", stage.className)}>{stage.value}</p>
                  <p className="truncate text-[11px] font-medium text-muted-foreground">{stage.label}</p>
                </div>
              ))}
            </div>
            {schedule.length > 0 && (
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span className="bg-success" style={{ width: `${(completed / schedule.length) * 100}%` }} />
                <span className="bg-info" style={{ width: `${(inChairCount / schedule.length) * 100}%` }} />
                <span className="bg-warning" style={{ width: `${(activeQueue.length / schedule.length) * 100}%` }} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showClinicFloor && <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <div>
            <CardTitle className="text-base">Operatory board</CardTitle>
            <CardDescription>Every chair's day at a glance</CardDescription>
          </div>
          <div className="hidden gap-3 text-[11px] text-muted-foreground sm:flex">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-info" />In chair</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />Done</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />Booked</span>
          </div>
        </CardHeader>
        <CardContent>
          {operatories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No chairs booked today.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {operatories.map(([chair, items]) => {
                const occupant = items.find((i) => i.status.startsWith("in"));
                return (
                  <div key={chair} className="w-56 shrink-0 rounded-md border border-border/60 bg-muted/30">
                    <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", occupant ? "bg-info animate-pulse" : "bg-success")} />
                        <p className="truncate text-xs font-semibold text-foreground">{chair}</p>
                      </div>
                      <span className="text-[11px] tabular-nums text-muted-foreground">{items.length} booked</span>
                    </div>
                    <div className="max-h-64 space-y-1.5 overflow-y-auto p-2">
                      {items.map((item) => (
                        <Link key={item.id} to={item.patientId ? `${basePath}/patients/${item.patientId}` : `${basePath}/appointments`} className={cn("block rounded px-2 py-1.5 text-xs transition-colors hover:opacity-80", toneSurface[statusTone(item.status)])}>
                          <span className="font-bold tabular-nums">{item.time}</span> <span className="font-semibold text-foreground">{item.patientName}</span>
                          <span className="block truncate text-muted-foreground">{item.treatment} · {item.dentist}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>}

      <div className={cn("grid gap-4", showSchedule && "lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.8fr)]")}>
        {showSchedule && <Card className="border-border/60">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-base">{mode === "dentist" ? "Your patients today" : "Today's schedule"}</CardTitle>
              <CardDescription>{nextAppointment ? `Next: ${nextAppointment.patientName} at ${nextAppointment.time}` : "No more scheduled patients"}</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link to={`${basePath}/appointments`}>View all<ArrowRight className="h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                <CalendarDays className="h-6 w-6 text-muted-foreground" strokeWidth={iconStroke} />
                <p className="font-semibold text-foreground">Nothing scheduled yet</p>
                <p className="text-sm text-muted-foreground">New appointments will appear here.</p>
              </div>
            ) : (
              <div>
                {schedule.slice(0, 8).map((appointment) => {
                  const tone = statusTone(appointment.status);
                  return (
                    <div key={appointment.id} className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0">
                      <span className="w-12 shrink-0 text-sm font-bold tabular-nums text-foreground">{appointment.time}</span>
                      <Avatar className="hidden h-8 w-8 sm:flex"><AvatarFallback className="bg-muted text-[11px] font-bold text-foreground">{appointment.patientName.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{appointment.patientName}</p>
                        <p className="truncate text-xs text-muted-foreground">{appointment.treatment} · {appointment.dentist} · {appointment.chair}</p>
                      </div>
                      {mode === "receptionist" && appointment.patientId && ["scheduled", "confirmed"].includes(appointment.status) ? (
                        <Button size="sm" variant="outline" disabled={checkIn.isPending} onClick={() => checkIn.mutate({ patient_id: appointment.patientId!, appointment_id: appointment.id, chair: appointment.chair })}>Check in</Button>
                      ) : (
                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", toneSurface[tone])}>{appointment.status.replace(/[-_]/g, " ")}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>}

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needs attention</p>
          {actions.map((item, i) => {
            const tone: Tone = item.count === null ? "info" : item.count === 0 ? "success" : (["warning", "destructive", "info"] as Tone[])[i % 3];
            return (
              <Link key={item.text} to={item.to} className="group flex items-center gap-3 rounded-lg border border-border/70 bg-card p-4 transition-colors hover:bg-muted/50">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", toneSurface[tone])}><item.icon className="h-4 w-4" strokeWidth={iconStroke} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{item.count !== null && <span className="text-lg font-bold tabular-nums">{item.count} </span>}{item.text}</p>
                  <p className="text-xs font-medium text-primary">{item.action}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={iconStroke} />
              </Link>
            );
          })}
          {showSchedule && <div className="rounded-lg border border-info/25 bg-info/5 p-4">
            <div className="flex items-center gap-2 text-info"><Sparkles className="h-4 w-4" strokeWidth={iconStroke} /><p className="text-xs font-semibold uppercase">Insight</p></div>
            <p className="mt-2 text-sm leading-6 text-foreground">{dailyInsight}</p>
          </div>}
        </div>
      </div>

      {(mode === "owner" || mode === "finance") && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Revenue trend</CardTitle><CardDescription>Collections, last six months</CardDescription></CardHeader>
            <CardContent className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.25} /><stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} width={44} tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2.5} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Appointments this week</CardTitle><CardDescription>{totalWeekly} booked</CardDescription></CardHeader>
            <CardContent className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs><linearGradient id="weekFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.25} /><stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--info))" strokeWidth={2} fill="url(#weekFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function DashboardHome() {
  const { currentOrg } = useOrg();
  if (currentOrg?.clinic_type === "eye") return <EyeTodayScreen />;
  if ((currentOrg?.clinic_type as string) === "dental_lab") return <DlabOverviewPage />;
  return <StandardDashboardHome />;
}