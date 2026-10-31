import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePatientLifetimeValue } from "@/hooks/useAnalyticsData";
import { motion } from "framer-motion";

export function PatientLTVCard() {
  const { data } = usePatientLifetimeValue();

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2 border-b border-border/30">
        <CardTitle className="text-base">Patient Lifetime Value</CardTitle>
        <CardDescription>Avg LTV: ₦{(data?.averageLTV || 0).toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {!data?.topPatients?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No invoice data yet.</p>
        ) : (
          <div className="space-y-3">
            {data.topPatients.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 group">
                <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                    {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-secondary transition-colors">{p.name}</p>
                </div>
                <p className="text-sm font-bold">₦{p.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
