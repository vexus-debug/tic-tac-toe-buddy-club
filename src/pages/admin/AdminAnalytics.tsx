import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, UserCheck, CalendarDays, TrendingUp } from "lucide-react";
import { useAllOrganizations, useOrgMemberCounts, useOrgPatientCounts, usePlatformStats } from "@/hooks/useAdminData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminAnalytics() {
  const { data: orgs } = useAllOrganizations();
  const { data: memberCounts } = useOrgMemberCounts();
  const { data: patientCounts } = useOrgPatientCounts();
  const { data: stats } = usePlatformStats();

  // Build chart data: patients per clinic
  const chartData = (orgs || []).map((org: any) => ({
    name: org.name.length > 15 ? org.name.slice(0, 15) + "…" : org.name,
    patients: patientCounts?.[org.id] || 0,
    members: memberCounts?.[org.id] || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">High-level metrics across all clinics.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Clinics", value: stats?.totalClinics || 0, icon: Building2, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Users", value: stats?.totalUsers || 0, icon: Users, color: "text-violet-600", bg: "bg-violet-500/10" },
          { label: "Patients", value: stats?.totalPatients || 0, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Appointments", value: stats?.totalAppointments || 0, icon: CalendarDays, color: "text-amber-600", bg: "bg-amber-500/10" },
        ].map((item, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Patients per clinic chart */}
      {chartData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Patients per Clinic</CardTitle>
            <CardDescription>Distribution of patients across organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="adminBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border) / 0.5)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="patients" fill="url(#adminBarGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Members per clinic */}
      {chartData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Staff per Clinic</CardTitle>
            <CardDescription>Number of org members per clinic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(orgs || []).map((org: any) => {
                const members = memberCounts?.[org.id] || 0;
                const patients = patientCounts?.[org.id] || 0;
                return (
                  <div key={org.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{org.name}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{members} members</span>
                        <span>{patients} patients</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize">{org.clinic_type}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
