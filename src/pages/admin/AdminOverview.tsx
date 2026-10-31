import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users, UserCheck, CalendarDays, ArrowUpRight } from "lucide-react";
import { usePlatformStats, useAllOrganizations } from "@/hooks/useAdminData";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function AdminOverview() {
  const { data: stats } = usePlatformStats();
  const { data: orgs } = useAllOrganizations();
  const s = stats || { totalClinics: 0, totalUsers: 0, totalPatients: 0, totalAppointments: 0 };
  const recentOrgs = (orgs || []).slice(0, 5);

  const statCards = [
    { label: "Total Clinics", value: s.totalClinics, icon: Building2, iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
    { label: "Platform Users", value: s.totalUsers, icon: Users, iconBg: "bg-violet-500/10", iconColor: "text-violet-600" },
    { label: "Total Patients", value: s.totalPatients, icon: UserCheck, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
    { label: "Total Appointments", value: s.totalAppointments, icon: CalendarDays, iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitor all clinics and users across the platform.</p>
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={stagger.container}
        initial="hidden"
        animate="visible"
      >
        {statCards.map((card, i) => (
          <motion.div key={i} variants={stagger.item}>
            <Card className="stat-card glass-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight">
                  <AnimatedCounter value={card.value} />
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Clinics */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Clinics</CardTitle>
              <CardDescription>Latest registered organizations</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-secondary hover:text-secondary">
              <Link to="/admin/clinics">View All <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Name</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Type</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs hidden md:table-cell">Slug</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                      No clinics registered yet.
                    </td>
                  </tr>
                ) : recentOrgs.map((org: any) => (
                  <tr key={org.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{org.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-[10px] capitalize">{org.clinic_type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{org.slug}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      {format(new Date(org.created_at), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
