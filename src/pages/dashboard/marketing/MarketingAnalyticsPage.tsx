import { PageHeader } from "@/components/dashboard/PageHeader";
import { MarketingStatCard } from "@/components/dashboard/marketing/MarketingStatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { channelPerformance, monthlyTrend, newPatientSources, funnelStages } from "@/data/marketing/mockMarketing";

const money = (n: number) => `₦${n.toLocaleString()}`;
const COLORS = ["hsl(var(--secondary))", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function MarketingAnalyticsPage() {
  const totalReached = channelPerformance.reduce((a, c) => a + c.reached, 0);
  const totalBooked = channelPerformance.reduce((a, c) => a + c.booked, 0);
  const totalRevenue = channelPerformance.reduce((a, c) => a + c.revenue, 0);
  const conversion = ((totalBooked / totalReached) * 100).toFixed(1);
  const topStage = funnelStages[0].value;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketing Analytics" description="Where new patients come from and what each channel is worth" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketingStatCard index={0} icon={Users} label="Patients reached" value={totalReached.toLocaleString()} hint="All channels" trend="+16%" />
        <MarketingStatCard index={1} icon={Target} label="Bookings" value={String(totalBooked)} hint="Attributed to marketing" trend="+23" />
        <MarketingStatCard index={2} icon={TrendingUp} label="Conversion rate" value={`${conversion}%`} hint="Reached → booked" trend="+0.4%" />
        <MarketingStatCard index={3} icon={DollarSign} label="Attributed revenue" value={money(totalRevenue)} hint="Last 30 days" trend="+18%" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly trend</CardTitle>
            <CardDescription>Reach, bookings and revenue over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="reached" stroke="#3b82f6" strokeWidth={2} name="Reached" />
                <Line yAxisId="right" type="monotone" dataKey="booked" stroke="#10b981" strokeWidth={2} name="Booked" />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New patient sources</CardTitle>
            <CardDescription>Share of new patients this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={newPatientSources} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {newPatientSources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenue by channel</CardTitle>
            <CardDescription>Attributed revenue per marketing channel</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="channel" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversion funnel</CardTitle>
            <CardDescription>From first touch to treatment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {funnelStages.map((s) => (
              <div key={s.stage}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{s.stage}</span>
                  <span className="text-muted-foreground">{s.value.toLocaleString()}</span>
                </div>
                <Progress value={(s.value / topStage) * 100} className="mt-1.5 h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Channel performance</CardTitle>
          <CardDescription>Reach, bookings, revenue and cost efficiency</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Reached</TableHead>
                <TableHead className="text-right">Booked</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Revenue / booking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelPerformance.map((c) => (
                <TableRow key={c.channel}>
                  <TableCell className="font-medium text-foreground">{c.channel}</TableCell>
                  <TableCell className="text-right">{c.reached.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{c.booked}</TableCell>
                  <TableCell className="text-right">{((c.booked / c.reached) * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{money(c.revenue)}</TableCell>
                  <TableCell className="text-right">{money(Math.round(c.revenue / c.booked))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
