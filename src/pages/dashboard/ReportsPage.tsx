import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { useRevenueTrend, useTreatmentDistribution, useWeeklyAppointmentTrends, useDentistPerformance } from "@/hooks/useReportsData";
import { CalendarIcon, Download, TrendingUp } from "lucide-react";
import { format, subMonths } from "date-fns";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { motion } from "framer-motion";
import { KPICards } from "@/components/dashboard/reports/KPICards";
import { PatientLTVCard } from "@/components/dashboard/reports/PatientLTVCard";
import { ProfitableTreatmentsCard } from "@/components/dashboard/reports/ProfitableTreatmentsCard";
import { ChairUtilizationCard } from "@/components/dashboard/reports/ChairUtilizationCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useClinicTerms } from "@/hooks/useClinicTerms";

const COLORS = [
  "hsl(185, 72%, 32%)",
  "hsl(185, 60%, 46%)",
  "hsl(38, 88%, 50%)",
  "hsl(220, 62%, 52%)",
  "hsl(152, 60%, 40%)",
  "hsl(280, 50%, 52%)",
];

function formatCurrency(amount: number) {
  return `₦${(amount / 1000000).toFixed(1)}M`;
}

function downloadCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } },
  item: { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38 } } },
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 8px 24px -4px hsl(var(--foreground) / 0.08)",
};

export default function ReportsPage() {
  const terms = useClinicTerms();
  const [dateFrom, setDateFrom] = useState<Date>(subMonths(new Date(), 5));
  const [dateTo, setDateTo]     = useState<Date>(new Date());

  const { data: revenueData  = [] } = useRevenueTrend();
  const { data: treatmentDist = [] } = useTreatmentDistribution();
  const { data: weeklyData   = [] } = useWeeklyAppointmentTrends();
  const { data: dentistData  = [] } = useDentistPerformance();

  const maxAppts = dentistData.length ? Math.max(...dentistData.map((d) => d.appointments)) : 1;
  const maxRev   = dentistData.length ? Math.max(...dentistData.map((d) => d.revenue)) : 1;

  const filteredRevenue = revenueData.filter((_, i) => {
    const monthDate = subMonths(new Date(), revenueData.length - 1 - i);
    return monthDate >= dateFrom && monthDate <= dateTo;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Clinic performance and insights"
        tutorial={{
          title: "Reports — How to Use",
          description: "Analyse your clinic's revenue, patient trends, and staff performance over any date range.",
          steps: [
            {
              title: "Set your date range",
              description: "Use the 'From' and 'To' date pickers at the top to filter all report data to a specific period. Click 'Apply' to refresh the charts and tables.",
              tip: "Start with 'This Month' to get a quick overview of recent performance, then compare with last month.",
            },
            {
              title: "KPI summary cards",
              description: "The top row shows key metrics: Total Revenue, Total Patients, Appointments Completed, and Average Invoice Value. These update based on your selected date range.",
            },
            {
              title: "Revenue Trend chart",
              description: "The line/bar chart shows revenue over time within your selected range. Peaks and dips indicate busy and slow periods — useful for staffing decisions.",
            },
            {
              title: "Treatment breakdown",
              description: "The treatment distribution chart shows which procedures generate the most revenue. Use this to identify your most profitable services.",
            },
            {
              title: "Staff performance",
              description: "The dentist performance section shows how many appointments and how much revenue each dentist generated. Helps with commission calculations and workload balancing.",
            },
            {
              title: "Export reports",
              description: "Click the export button (top right of each chart) to download data as CSV or print a formatted report for management review.",
            },
          ],
          nextPageHint: {
            label: "Advanced Analytics",
            description: "For deeper insights like patient lifetime value and profitability analysis, visit the Advanced Analytics page.",
          },
        }}
      >
        <div className="flex items-center gap-2 flex-wrap" data-tour="reports-date-range">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8 border-border/60 gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(dateFrom, "MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} initialFocus />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8 border-border/60 gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(dateTo, "MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} initialFocus />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline" size="sm"
            className="text-xs h-8 border-border/60 gap-1.5"
            onClick={() => downloadCSV(revenueData.map((r) => ({ Month: r.month, Revenue: r.revenue })), "revenue-report.csv")}
            data-tour="reports-export"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div data-tour="reports-kpis"><KPICards /></div>

      {/* ── Charts Row 1: Revenue + Treatment Distribution ── */}
      <motion.div
        className="grid gap-4 lg:grid-cols-3"
        variants={stagger.container}
        initial="hidden"
        animate="visible"
      >
        {/* Revenue Trend (area — smoother) */}
        <motion.div variants={stagger.item} className="lg:col-span-2" data-tour="reports-revenue-trend">
          <Card className="border-border bg-card shadow-sm h-full">
            <CardHeader className="pb-2 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[15px] font-semibold">Revenue Trend</CardTitle>
                  <CardDescription className="text-xs">Monthly revenue (₦)</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={filteredRevenue.length ? filteredRevenue : revenueData}>
                  <defs>
                    <linearGradient id="rptRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.20} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={formatCurrency} width={48}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#rptRevGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Treatment Distribution donut */}
        <motion.div variants={stagger.item} data-tour="reports-treatment-mix">
          <Card className="border-border bg-card shadow-sm h-full">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-[15px] font-semibold">Treatment Mix</CardTitle>
              <CardDescription className="text-xs">Most common procedures</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {treatmentDist.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">No treatment data yet.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={treatmentDist}
                        cx="50%" cy="50%"
                        innerRadius={52} outerRadius={76}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {treatmentDist.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {treatmentDist.slice(0, 4).map((item: any, i: number) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-muted-foreground flex-1 truncate">{item.name}</span>
                        <span className="text-xs font-semibold text-foreground tabular-nums">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Charts Row 2: Weekly Appts + Dentist Leaderboard ── */}
      <motion.div
        className="grid gap-4 lg:grid-cols-2"
        variants={stagger.container}
        initial="hidden"
        animate="visible"
      >
        {/* Weekly Appointment Trends */}
        <motion.div variants={stagger.item}>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-[15px] font-semibold">Weekly Appointments</CardTitle>
              <CardDescription className="text-xs">Appointment volume by day</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={weeklyData} barCategoryGap="28%">
                  <defs>
                    <linearGradient id="wkBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.40} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={26} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="url(#wkBarGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dentist Leaderboard */}
        <motion.div variants={stagger.item} data-tour="reports-dentist-performance">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-2 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[15px] font-semibold">{terms.clinician} Performance</CardTitle>
                  <CardDescription className="text-xs">Appointments & revenue this month</CardDescription>
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => downloadCSV(dentistData.map((d) => ({ [terms.clinician]: d.name, Appointments: d.appointments, Revenue: d.revenue })), "dentist-performance.csv")}
                >
                  <Download className="h-3 w-3" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {dentistData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
              ) : (
                <div className="space-y-4">
                  {dentistData.map((doc, i) => {
                    const initials = doc.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                    const pctAppts = (doc.appointments / maxAppts) * 100;
                    const pctRev   = (doc.revenue / maxRev) * 100;
                    return (
                      <div key={doc.name} className="flex items-center gap-3 group">
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                          {i + 1}
                        </div>
                        <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border/30">
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pctAppts}%` }}
                                transition={{ duration: 0.7, delay: i * 0.1 }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{doc.appointments} appts</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold tabular-nums">₦{(doc.revenue / 1000000).toFixed(1)}M</p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: COLORS[i % COLORS.length] }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pctRev}%` }}
                                transition={{ duration: 0.7, delay: i * 0.1 + 0.1 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Advanced Metrics Row ── */}
      <motion.div
        className="grid gap-4 lg:grid-cols-3"
        variants={stagger.container}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={stagger.item}><PatientLTVCard /></motion.div>
        <motion.div variants={stagger.item}><ProfitableTreatmentsCard /></motion.div>
        <motion.div variants={stagger.item}><ChairUtilizationCard /></motion.div>
      </motion.div>
    </div>
  );
}
