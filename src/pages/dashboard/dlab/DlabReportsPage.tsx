import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeStage } from "@/config/dentalLab";
import { useLabRecords } from "@/hooks/useLabRecords";
import { useClientSummaries, money } from "./dlabMoney";
import { dentistScorecard } from "@/lib/labConformity";

export default function DlabReportsPage() {
  const { data: clients, cases, payments } = useClientSummaries();
  const { data: warranties = [] } = useLabRecords("warranties");

  const r = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), 5 - i), "yyyy-MM"));
    const monthly = months.map((m) => ({
      month: format(new Date(`${m}-01`), "MMM"),
      billed: cases.filter((c) => c.created_at.startsWith(m)).reduce((s, c) => s + Number(c.lab_fee || 0), 0),
      collected: payments.filter((p) => (p.record_date || p.created_at).startsWith(m) && p.status !== "bounced").reduce((s, p) => s + Number(p.amount || 0), 0),
    }));
    const types = new Map<string, number>();
    cases.forEach((c) => types.set(c.work_type, (types.get(c.work_type) || 0) + 1));
    const done = cases.filter((c) => c.completed_date && c.created_at);
    const avgDays = done.length ? done.reduce((s, c) => s + (new Date(c.completed_date!).getTime() - new Date(c.created_at).getTime()) / 864e5, 0) / done.length : 0;
    const finished = cases.filter((c) => ["ready", "delivered"].includes(normalizeStage(c.status)));
    const onTime = finished.filter((c) => !c.due_date || !c.completed_date || c.completed_date <= c.due_date).length;
    return {
      monthly,
      topTypes: [...types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      avgDays, onTimePct: finished.length ? Math.round((onTime / finished.length) * 100) : 0,
      remakePct: cases.length ? Math.round((warranties.length / cases.length) * 100) : 0,
      owing: clients.reduce((s, c) => s + Math.max(c.balance, 0), 0),
    };
  }, [cases, payments, warranties, clients]);

  const scorecard = useMemo(() => dentistScorecard(cases as any[], warranties as any[]), [cases, warranties]);

  const kpis = [
    { label: "Average turnaround", value: `${r.avgDays.toFixed(1)} days` },
    { label: "On time", value: `${r.onTimePct}%` },
    { label: "Remake rate", value: `${r.remakePct}%` },
    { label: "Owed by clients", value: money(r.owing) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="Production speed, quality and money over the last six months." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => <Card key={k.label}><CardContent className="p-4"><p className="text-xl font-bold">{k.value}</p><p className="text-xs text-muted-foreground">{k.label}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Billed vs collected</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.monthly}>
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={11} width={60} tickFormatter={(v) => `₦${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="billed" name="Billed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Top work types</CardTitle></CardHeader>
          <CardContent className="divide-y text-sm">
            {!r.topTypes.length && <p className="py-3 text-muted-foreground">No cases yet.</p>}
            {r.topTypes.map(([t, n]) => <div key={t} className="flex justify-between py-2"><span>{t}</span><span className="font-medium">{n}</span></div>)}
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Top clients</CardTitle></CardHeader>
          <CardContent className="divide-y text-sm">
            {!clients.length && <p className="py-3 text-muted-foreground">No clients yet.</p>}
            {[...clients].sort((a, b) => b.billed - a.billed).slice(0, 6).map((c) => <div key={c.name} className="flex justify-between py-2"><span className="truncate">{c.name}</span><span className="font-medium">{money(c.billed)}</span></div>)}
          </CardContent></Card>
      </div>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Dentist impression scorecard</CardTitle>
        <p className="text-xs text-muted-foreground">Remakes caused by the clinic (impressions, preps, clearance) per prescribing dentist.</p></CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          {!scorecard.length ? <p className="py-3 text-muted-foreground">No cases yet.</p> : (
            <table className="w-full">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Dentist</th><th>Cases</th><th>Clinic remakes</th><th>Rate</th><th>Main issues</th></tr></thead>
              <tbody className="divide-y">
                {scorecard.map((d) => (
                  <tr key={d.name}>
                    <td className="py-2 font-medium">{d.name}</td><td>{d.cases}</td><td>{d.clinicRemakes}</td>
                    <td className={d.pct >= 10 ? "font-semibold text-destructive" : ""}>{d.pct}%</td>
                    <td className="text-xs text-muted-foreground">{Object.entries(d.faults).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} (${n})`).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent></Card>
    </div>
  );
}
