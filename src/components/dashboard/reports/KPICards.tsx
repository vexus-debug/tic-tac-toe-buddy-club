import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, CalendarCheck, CalendarX, DollarSign, Armchair, TrendingUp, TrendingDown } from "lucide-react";
import {
  usePatientGrowthRate,
  useAppointmentCompletionRate,
  useAverageTreatmentValue,
  useChairUtilization,
} from "@/hooks/useAnalyticsData";

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

function KPICard({ icon: Icon, label, value, subtitle, iconBg, iconColor, trend }: {
  icon: typeof Users;
  label: string;
  value: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; up: boolean };
}) {
  return (
    <Card className="stat-card bg-card border-border/40">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${trend.up ? "bg-gold-pale text-gold-deep dark:bg-gold-pale/20 dark:text-gold-light" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
              {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </div>
          )}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function KPICards() {
  const { data: growth } = usePatientGrowthRate();
  const { data: completion } = useAppointmentCompletionRate();
  const { data: avgTreatment } = useAverageTreatmentValue();
  const { data: chair } = useChairUtilization();

  return (
    <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" variants={stagger.container} initial="hidden" animate="visible">
      <motion.div variants={stagger.item}>
        <KPICard
          icon={Users}
          label="Patient Growth"
          value={`${growth?.current || 0} new`}
          subtitle="This month"
          iconBg="bg-primary/10"
          iconColor="text-primary"
          trend={growth ? { value: `${growth.rate > 0 ? "+" : ""}${growth.rate}%`, up: growth.rate >= 0 } : undefined}
        />
      </motion.div>
      <motion.div variants={stagger.item}>
        <KPICard
          icon={CalendarCheck}
          label="Completion Rate"
          value={`${completion?.completionRate || 0}%`}
          subtitle={`${completion?.completed || 0} of ${completion?.total || 0}`}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
        />
      </motion.div>
      <motion.div variants={stagger.item}>
        <KPICard
          icon={CalendarX}
          label="No-Show Rate"
          value={`${completion?.noShowRate || 0}%`}
          subtitle={`${completion?.noShow || 0} cancellations`}
          iconBg="bg-red-500/10"
          iconColor="text-red-600"
        />
      </motion.div>
      <motion.div variants={stagger.item}>
        <KPICard
          icon={DollarSign}
          label="Avg Treatment Value"
          value={`₦${(avgTreatment?.average || 0).toLocaleString()}`}
          subtitle={`${avgTreatment?.count || 0} items`}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
        />
      </motion.div>
      <motion.div variants={stagger.item}>
        <KPICard
          icon={Armchair}
          label="Chair Utilization"
          value={`${chair?.overall || 0}%`}
          subtitle={`${chair?.chairCount || 0} chairs`}
          iconBg="bg-slate-pale"
          iconColor="text-slate"
        />
      </motion.div>
    </motion.div>
  );
}
