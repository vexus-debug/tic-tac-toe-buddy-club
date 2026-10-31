import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Users, UserCheck, CalendarDays, CreditCard, Activity, Clock } from "lucide-react";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { format } from "date-fns";
import { AdminWalletTopup } from "@/components/dashboard/CaseWallet";

function useClinicDetail(slug: string) {
  return useQuery({
    queryKey: ["admin-clinic-detail", slug],
    queryFn: async () => {
      const { data: org, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!org) throw new Error("Clinic not found");

      const [members, patients, appointments, invoices, sub] = await Promise.all([
        supabase.from("org_members").select("*, profiles(full_name, avatar_url)").eq("org_id", org.id),
        supabase.from("patients").select("id, status, created_at").eq("org_id", org.id),
        supabase.from("appointments").select("id, status, appointment_date").eq("org_id", org.id),
        supabase.from("invoices").select("id, total, status, invoice_date").eq("org_id", org.id),
        supabase.from("clinic_subscriptions").select("*").eq("org_id", org.id).maybeSingle(),
      ]);

      const totalRevenue = (invoices.data || [])
        .filter((i: any) => i.status === "paid")
        .reduce((sum: number, i: any) => sum + Number(i.total), 0);

      const activePatients = (patients.data || []).filter((p: any) => p.status === "active").length;
      const recentAppointments = (appointments.data || [])
        .sort((a: any, b: any) => b.appointment_date.localeCompare(a.appointment_date))
        .slice(0, 5);

      return {
        org,
        members: members.data || [],
        patients: patients.data || [],
        appointments: appointments.data || [],
        invoices: invoices.data || [],
        subscription: sub.data,
        totalRevenue,
        activePatients,
        recentAppointments,
      };
    },
    enabled: !!slug,
  });
}

export default function AdminClinicDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useClinicDetail(slug || "");

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" /></div>;
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Clinic not found</p>
        <Button variant="outline" onClick={() => navigate("/admin/clinics")} className="mt-4">Back to Clinics</Button>
      </div>
    );
  }

  const { org, members, patients, appointments, invoices, subscription, totalRevenue, activePatients, recentAppointments } = data;

  const stats = [
    { label: "Members", value: members.length, icon: Users, iconBg: "bg-violet-500/10", iconColor: "text-violet-600" },
    { label: "Active Patients", value: activePatients, icon: UserCheck, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
    { label: "Total Appointments", value: appointments.length, icon: CalendarDays, iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
    { label: "Total Revenue", value: totalRevenue, icon: CreditCard, iconBg: "bg-blue-500/10", iconColor: "text-blue-600", prefix: "$" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clinics")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> {org.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">/{org.slug} • {org.clinic_type} • Created {format(new Date(org.created_at), "MMM d, yyyy")}</p>
        </div>
      </div>

      {org.clinic_type === "dental" && !org.parent_org_id && <AdminWalletTopup orgId={org.id} />}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-5">
              <div className={`h-10 w-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                <s.icon className={`h-5 w-5 ${s.iconColor}`} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-2xl font-bold">{s.prefix || ""}<AnimatedCounter value={s.value} /></p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="text-[10px] capitalize">{subscription.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Billing</span><span className="capitalize">{subscription.billing_cycle}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>${Number(subscription.amount).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><Badge variant="outline" className="text-[10px] capitalize">{subscription.payment_status}</Badge></div>
                {subscription.trial_ends_at && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Trial Ends</span><span>{format(new Date(subscription.trial_ends_at), "MMM d, yyyy")}</span></div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No subscription configured.</p>
            )}
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Team ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {members.slice(0, 8).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{(m as any).profiles?.full_name || "Unknown"}</span>
                  <Badge variant="secondary" className="text-[10px] capitalize">{m.role}</Badge>
                </div>
              ))}
              {members.length === 0 && <p className="text-sm text-muted-foreground">No members</p>}
            </div>
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAppointments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {format(new Date(a.appointment_date), "MMM d, yyyy")}
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize">{a.status}</Badge>
                </div>
              ))}
              {recentAppointments.length === 0 && <p className="text-sm text-muted-foreground">No appointments</p>}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Invoices</span><span className="font-bold">{invoices.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{invoices.filter((i: any) => i.status === "paid").length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span>{invoices.filter((i: any) => i.status === "draft" || i.status === "sent").length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-bold text-emerald-600">${totalRevenue.toFixed(2)}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => navigate(`/clinic/${org.slug}/dashboard`)}>Open Clinic Dashboard</Button>
      </div>
    </div>
  );
}
