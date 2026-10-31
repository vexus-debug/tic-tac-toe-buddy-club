import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMostProfitableTreatments } from "@/hooks/useAnalyticsData";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border) / 0.5)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 8px 24px -4px hsl(var(--foreground) / 0.1)",
};

export function ProfitableTreatmentsCard() {
  const { data = [] } = useMostProfitableTreatments();

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2 border-b border-border/30">
        <CardTitle className="text-base">Most Profitable Treatments</CardTitle>
        <CardDescription>Revenue by treatment type</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">No treatment revenue data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <defs>
                <linearGradient id="treatmentBarGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₦${v.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="url(#treatmentBarGrad)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
