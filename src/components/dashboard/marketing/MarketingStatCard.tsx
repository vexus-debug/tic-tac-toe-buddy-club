import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MarketingStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  index?: number;
}

export function MarketingStatCard({ icon: Icon, label, value, hint, trend, index = 0 }: MarketingStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="glass-card h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
              {hint && <p className="mt-0.5 text-xs text-muted-foreground truncate">{hint}</p>}
            </div>
            <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-secondary" />
            </div>
          </div>
          {trend && (
            <p className={cn("mt-2 text-xs font-medium", trend.startsWith("-") ? "text-destructive" : "text-emerald-500")}>
              {trend}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}