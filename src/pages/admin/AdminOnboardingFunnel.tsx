import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { UserPlus, Building2, UserCheck, CalendarDays, ArrowDown } from "lucide-react";

function useOnboardingData() {
  return useQuery({
    queryKey: ["admin-onboarding-funnel"],
    queryFn: async () => {
      const [users, orgs, patients, appointments] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("patients").select("org_id").limit(1000),
        supabase.from("appointments").select("org_id").limit(1000),
      ]);

      const totalUsers = users.count || 0;
      const totalOrgs = orgs.count || 0;
      const orgsWithPatients = new Set((patients.data || []).map((p) => p.org_id)).size;
      const orgsWithAppointments = new Set((appointments.data || []).map((a) => a.org_id)).size;

      return {
        totalUsers,
        totalOrgs,
        orgsWithPatients,
        orgsWithAppointments,
        signupToClinic: totalUsers > 0 ? (totalOrgs / totalUsers) * 100 : 0,
        clinicToPatient: totalOrgs > 0 ? (orgsWithPatients / totalOrgs) * 100 : 0,
        patientToAppt: orgsWithPatients > 0 ? (orgsWithAppointments / orgsWithPatients) * 100 : 0,
      };
    },
  });
}

export default function AdminOnboardingFunnel() {
  const { data } = useOnboardingData();
  const d = data || { totalUsers: 0, totalOrgs: 0, orgsWithPatients: 0, orgsWithAppointments: 0, signupToClinic: 0, clinicToPatient: 0, patientToAppt: 0 };

  const steps = [
    { label: "Signed Up", value: d.totalUsers, icon: UserPlus, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Created Clinic", value: d.totalOrgs, icon: Building2, color: "text-violet-600", bg: "bg-violet-500/10", rate: d.signupToClinic },
    { label: "Added First Patient", value: d.orgsWithPatients, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-500/10", rate: d.clinicToPatient },
    { label: "Booked First Appointment", value: d.orgsWithAppointments, icon: CalendarDays, color: "text-amber-600", bg: "bg-amber-500/10", rate: d.patientToAppt },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Onboarding Funnel</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Signup → Clinic → Patient → Appointment conversion.</p>
      </div>

      <div className="max-w-lg mx-auto space-y-2">
        {steps.map((step, i) => (
          <div key={i}>
            {i > 0 && (
              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowDown className="h-4 w-4" />
                  <span className="font-medium">{step.rate?.toFixed(1)}% conversion</span>
                </div>
              </div>
            )}
            <Card className="glass-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${step.bg} flex items-center justify-center shrink-0`}>
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{step.label}</p>
                  <p className="text-2xl font-bold"><AnimatedCounter value={step.value} /></p>
                </div>
                <div className="text-right">
                  <div
                    className="h-2 rounded-full bg-muted overflow-hidden"
                    style={{ width: 120 }}
                  >
                    <div
                      className="h-full rounded-full bg-secondary transition-all duration-700"
                      style={{ width: `${Math.min((step.value / Math.max(d.totalUsers, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
