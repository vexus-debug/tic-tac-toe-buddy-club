import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStaffPerformance, useLabPerformance, useChairHeatmap, useNoShowAnalytics, useDemandForecast, useReferralAnalytics } from "@/hooks/useAdvancedAnalytics";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { motion } from "framer-motion";
import { Star, TrendingUp, Users, Clock, Activity, Share2 } from "lucide-react";

const COLORS = ["hsl(174, 60%, 40%)", "hsl(220, 60%, 20%)", "hsl(174, 50%, 50%)", "hsl(220, 50%, 30%)", "hsl(165, 40%, 50%)", "hsl(210, 30%, 60%)"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`);

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border) / 0.5)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 8px 24px -4px hsl(var(--foreground) / 0.1)",
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function AdvancedAnalyticsPage() {
  const { data: staffPerf = [] } = useStaffPerformance();
  const { data: labPerf } = useLabPerformance();
  const { data: heatmap } = useChairHeatmap();
  const { data: noShow } = useNoShowAnalytics();
  const { data: demand } = useDemandForecast();
  const { data: referrals } = useReferralAnalytics();

  const maxHeatVal = heatmap ? Math.max(...heatmap.flat(), 1) : 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Advanced Analytics" description="Data-driven insights for better decisions" />

      <motion.div className="grid gap-4 lg:grid-cols-2" variants={stagger.container} initial="hidden" animate="visible">
        {/* Staff Performance */}
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-secondary" />
                <CardTitle className="text-base">Staff Performance</CardTitle>
              </div>
              <CardDescription>This month's metrics</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {staffPerf.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {staffPerf.slice(0, 8).map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-secondary transition-colors">{s.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{s.totalAppointments} appts</span>
                          <span>·</span>
                          <span>{s.completionRate}% complete</span>
                          {s.avgRating && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                {s.avgRating}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="w-20">
                        <Progress value={s.completionRate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Lab Performance */}
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" />
                <CardTitle className="text-base">Lab Performance</CardTitle>
              </div>
              <CardDescription>Case metrics & turnaround</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!labPerf?.overall?.total ? (
                <p className="text-sm text-muted-foreground text-center py-8">No lab data yet.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold">{labPerf.overall.total}</p>
                      <p className="text-[10px] text-muted-foreground">Total Cases</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{labPerf.overall.avgTurnaround}d</p>
                      <p className="text-[10px] text-muted-foreground">Avg Turnaround</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{labPerf.overall.onTimeRate}%</p>
                      <p className="text-[10px] text-muted-foreground">On-Time Rate</p>
                    </div>
                  </div>
                  {labPerf.byType.slice(0, 5).map((t: any) => (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t.count} cases</span>
                        <Badge variant="outline" className="text-[10px]">₦{t.revenue.toLocaleString()}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Chair Utilization Heatmap */}
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" />
                <CardTitle className="text-base">Chair Utilization Heatmap</CardTitle>
              </div>
              <CardDescription>Appointments by day & hour (last 30 days)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!heatmap ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr>
                        <th className="p-1"></th>
                        {HOURS.map((h) => <th key={h} className="p-1 text-muted-foreground font-normal">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {DAY_NAMES.map((day, di) => (
                        <tr key={day}>
                          <td className="p-1 font-medium text-muted-foreground">{day}</td>
                          {heatmap[di].map((val: number, hi: number) => (
                            <td key={hi} className="p-0.5">
                              <div
                                className="w-full h-6 rounded"
                                style={{
                                  backgroundColor: val === 0
                                    ? "hsl(var(--muted))"
                                    : `hsl(174, 60%, ${70 - (val / maxHeatVal) * 50}%)`,
                                  opacity: val === 0 ? 0.3 : 0.5 + (val / maxHeatVal) * 0.5,
                                }}
                                title={`${day} ${HOURS[hi]}: ${val} appointments`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* No-Show Analytics */}
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <CardTitle className="text-base">No-Show Analytics</CardTitle>
              </div>
              <CardDescription>Overall rate: {noShow?.overall || 0}%</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!noShow?.monthlyRates?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
              ) : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={noShow.monthlyRates}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "No-Show Rate"]} />
                      <Line type="monotone" dataKey="rate" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  {noShow.topNoShows.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Frequent No-Shows</p>
                      {noShow.topNoShows.slice(0, 5).map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1">
                          <span>{p.name}</span>
                          <Badge variant="outline" className="text-[10px]">{p.count}x</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Demand Forecasting */}
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/30">
              <CardTitle className="text-base">Demand Patterns</CardTitle>
              <CardDescription>Appointment volume by day of week</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!demand?.byDayOfWeek?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={demand.byDayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Analytics */}
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-secondary" />
                <CardTitle className="text-base">Referral Sources</CardTitle>
              </div>
              <CardDescription>{referrals?.total || 0} total patients</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!referrals?.sources?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No referral data yet.</p>
              ) : (
                <div className="space-y-3">
                  {referrals.sources.slice(0, 8).map((s: any, i: number) => (
                    <div key={s.source} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{s.source}</span>
                        <span className="text-muted-foreground">{s.count} ({s.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.percentage}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
