// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { TrendingUp, TrendingDown, DollarSign, Users, Building2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

function useRevenueData() {
  return useQuery({
    queryKey: ["admin-revenue-dashboard"],
    queryFn: async () => {
      const [subsRes, invoicesRes, orgsRes, profilesRes] = await Promise.all([
        supabase.from("clinic_subscriptions").select("*"),
        supabase.from("invoices").select("total, status, invoice_date, org_id"),
        supabase.from("organizations").select("id, created_at"),
        supabase.from("profiles").select("id, created_at"),
      ]);

      const subs = subsRes.data || [];
      const invoices = invoicesRes.data || [];
      const orgs = orgsRes.data || [];

      // MRR: sum of active monthly subscriptions
      const activeSubs = subs.filter((s) => s.status === "active");
      const mrr = activeSubs.reduce((sum, s) => {
        const amt = Number(s.amount);
        return sum + (s.billing_cycle === "yearly" ? amt / 12 : amt);
      }, 0);
      const arr = mrr * 12;

      // Churn: cancelled / total
      const cancelled = subs.filter((s) => s.status === "cancelled").length;
      const churnRate = subs.length > 0 ? (cancelled / subs.length) * 100 : 0;

      // Avg revenue per clinic
      const totalPaid = invoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + Number(i.total), 0);
      const avgRevPerClinic = orgs.length > 0 ? totalPaid / orgs.length : 0;

      // Monthly revenue trend (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        const monthRevenue = invoices
          .filter((inv) => inv.status === "paid" && new Date(inv.invoice_date) >= start && new Date(inv.invoice_date) <= end)
          .reduce((sum, inv) => sum + Number(inv.total), 0);
        monthlyData.push({
          month: format(month, "MMM yy"),
          revenue: monthRevenue,
        });
      }

      // New clinics per month
      const clinicGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        const count = orgs.filter((o) => new Date(o.created_at) >= start && new Date(o.created_at) <= end).length;
        clinicGrowth.push({ month: format(month, "MMM yy"), clinics: count });
      }

      return { mrr, arr, churnRate, avgRevPerClinic, totalPaid, activeSubs: activeSubs.length, totalSubs: subs.length, monthlyData, clinicGrowth };
    },
  });
}

export default function AdminRevenue() {
  const { data, isLoading } = useRevenueData();
  const d = data || { mrr: 0, arr: 0, churnRate: 0, avgRevPerClinic: 0, totalPaid: 0, activeSubs: 0, totalSubs: 0, monthlyData: [], clinicGrowth: [] };

  const metrics = [
    { label: "MRR", value: d.mrr, prefix: "$", icon: DollarSign, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
    { label: "ARR", value: d.arr, prefix: "$", icon: TrendingUp, iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
    { label: "Churn Rate", value: d.churnRate, suffix: "%", icon: TrendingDown, iconBg: "bg-red-500/10", iconColor: "text-red-600" },
    { label: "Avg Revenue/Clinic", value: d.avgRevPerClinic, prefix: "$", icon: Building2, iconBg: "bg-violet-500/10", iconColor: "text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Revenue Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform-wide financial metrics and trends.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-5">
              <div className={`h-10 w-10 rounded-xl ${m.iconBg} flex items-center justify-center mb-3`}>
                <m.icon className={`h-5 w-5 ${m.iconColor}`} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
              <p className="text-2xl font-bold">
                {m.prefix || ""}<AnimatedCounter value={Math.round(m.value)} />{m.suffix || ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={d.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">New Clinics per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={d.clinicGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="clinics" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Platform Revenue</p>
              <p className="text-xl font-bold mt-1">${d.totalPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Subscriptions</p>
              <p className="text-xl font-bold mt-1">{d.activeSubs} / {d.totalSubs}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">LTV (Avg)</p>
              <p className="text-xl font-bold mt-1">${d.avgRevPerClinic.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
