import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useChairUtilization } from "@/hooks/useAnalyticsData";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export function ChairUtilizationCard() {
  const { data } = useChairUtilization();

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2 border-b border-border/30">
        <CardTitle className="text-base">Chair Utilization</CardTitle>
        <CardDescription>Monthly usage by chair</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {!data?.perChair?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No chair data yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-foreground">{data.overall}%</p>
              <p className="text-xs text-muted-foreground">Overall Utilization</p>
            </div>
            {data.perChair.map((chair) => (
              <div key={chair.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{chair.name}</span>
                  <span className="text-muted-foreground">{chair.count} appts · {chair.utilization}%</span>
                </div>
                <Progress value={chair.utilization} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
