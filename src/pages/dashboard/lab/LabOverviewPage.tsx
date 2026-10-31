import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useTestForms, useRealtimeTestForms, useResultAuditLog, useLabSettings } from "@/hooks/lab/useLab";
import { useOrg } from "@/hooks/useOrg";
import { FlaskConical, Clock, Loader2, CheckCircle2, Timer, Plus, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

function hoursBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 36e5;
}

export default function LabOverviewPage() {
  useRealtimeTestForms();
  const { basePath } = useOrg();
  const { data: forms = [] } = useTestForms();
  const { data: audit = [] } = useResultAuditLog();
  const { data: settings } = useLabSettings();
  const sla = settings?.sla_hours || 24;

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayForms = forms.filter((f) => new Date(f.created_at).toDateString() === today);
    const pending = forms.filter((f) => f.status === "pending");
    const processing = forms.filter((f) => f.status === "processing");
    const completed = forms.filter((f) => f.status === "completed" || f.status === "approved");

    const tats = completed
      .filter((f) => f.completed_at)
      .map((f) => hoursBetween(f.collected_at || f.created_at, f.completed_at as string))
      .sort((a, b) => a - b);
    const median = tats.length ? tats[Math.floor(tats.length / 2)] : 0;
    const breaches = forms.filter((f) => {
      const end = f.completed_at || new Date().toISOString();
      return f.status !== "approved" && hoursBetween(f.collected_at || f.created_at, end) > sla;
    }).length;

    return { today: todayForms.length, pending: pending.length, processing: processing.length, completed: completed.length, median, breaches };
  }, [forms, sla]);

  const workload = useMemo(() => {
    const map = new Map<string, { open: number; done: number }>();
    forms.forEach((f) => {
      const key = f.assigned_to || "unassigned";
      const cur = map.get(key) || { open: 0, done: 0 };
      if (f.status === "completed" || f.status === "approved") cur.done++;
      else cur.open++;
      map.set(key, cur);
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [forms]);

  const topTests = useMemo(() => {
    const counts = new Map<string, number>();
    audit.forEach(() => {});
    forms.forEach((f) => {
      if (f.specimen) counts.set(f.specimen, (counts.get(f.specimen) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [forms, audit]);

  const cards = [
    { label: "Tests Today", value: stats.today, icon: FlaskConical },
    { label: "Pending", value: stats.pending, icon: Clock },
    { label: "In Progress", value: stats.processing, icon: Loader2 },
    { label: "Completed", value: stats.completed, icon: CheckCircle2 },
    { label: `Median TAT`, value: `${stats.median.toFixed(1)}h`, icon: Timer, sub: `${stats.breaches} over ${sla}h SLA` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Laboratory Overview" description="Live workload, turnaround and activity">
        <Button asChild size="sm" className="bg-secondary hover:bg-secondary/90">
          <Link to={`${basePath}/diagnostics/forms/new`}><Plus className="mr-2 h-4 w-4" /> New Test Form</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</span>
                  <c.icon className="h-4 w-4 text-secondary" />
                </div>
                <div className="mt-2 text-2xl font-bold">{c.value}</div>
                {c.sub && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-amber-500" /> {c.sub}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Most Requested Specimens</CardTitle></CardHeader>
          <CardContent className="h-64">
            {topTests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTests}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Scientist Workload</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="py-2 px-4 text-left text-xs uppercase text-muted-foreground">Scientist</th>
                  <th className="py-2 px-4 text-left text-xs uppercase text-muted-foreground">Open</th>
                  <th className="py-2 px-4 text-left text-xs uppercase text-muted-foreground">Done</th>
                </tr>
              </thead>
              <tbody>
                {workload.length === 0 && (
                  <tr><td colSpan={3} className="py-6 px-4 text-center text-muted-foreground">No forms yet.</td></tr>
                )}
                {workload.map((w) => (
                  <tr key={w.id} className="border-b border-border/30 last:border-0">
                    <td className="py-2 px-4 font-mono text-xs">{w.id === "unassigned" ? "Unassigned" : w.id.slice(0, 8)}</td>
                    <td className="py-2 px-4">{w.open}</td>
                    <td className="py-2 px-4">{w.done}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {audit.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
          {audit.slice(0, 12).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] capitalize">{String(a.action).replace("_", " ")}</Badge>
                <span className="font-mono text-xs">{a.serial}</span>
                {a.reason && <span className="text-xs text-muted-foreground">— {a.reason}</span>}
              </div>
              <span className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
