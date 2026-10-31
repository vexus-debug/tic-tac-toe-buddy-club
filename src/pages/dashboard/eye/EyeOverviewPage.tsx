import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useOrg } from "@/hooks/useOrg";
import {
  useEyeExams, useOpticalPrescriptions, useContactLensFittings, useOpticalOrders,
  useEyeDiagnostics, useSurgeryBookings, patientName, iopFlag,
} from "@/hooks/eye/useEye";
import {
  Eye, Glasses, Contact, Activity, Scissors, AlertTriangle, CalendarDays, Plus, Gauge,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const isToday = (d?: string | null) => !!d && new Date(d).toDateString() === new Date().toDateString();
const daysFromNow = (d?: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null);

export default function EyeOverviewPage() {
  const { basePath } = useOrg();
  const { data: exams = [] } = useEyeExams();
  const { data: rxs = [] } = useOpticalPrescriptions();
  const { data: fittings = [] } = useContactLensFittings();
  const { data: orders = [] } = useOpticalOrders();
  const { data: studies = [] } = useEyeDiagnostics();
  const { data: surgeries = [] } = useSurgeryBookings();

  const stats = useMemo(() => ({
    examsToday: exams.filter((e) => isToday(e.exam_date)).length,
    rxIssued: rxs.length,
    clActive: fittings.filter((f) => f.status === "trial" || f.status === "dispensed").length,
    ordersOpen: orders.filter((o) => o.status !== "collected" && o.status !== "cancelled").length,
    ordersReady: orders.filter((o) => o.status === "ready").length,
    surgeriesUpcoming: surgeries.filter((s) => ["booked", "confirmed"].includes(s.status) && new Date(s.scheduled_date) >= new Date(Date.now() - 86400000)).length,
    studies: studies.length,
    opticalRevenue: orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    outstanding: orders.reduce((sum, o) => sum + (Number(o.total_amount || 0) - Number(o.amount_paid || 0)), 0),
  }), [exams, rxs, fittings, orders, studies, surgeries]);

  const raisedIop = useMemo(
    () => exams.filter((e) => iopFlag(e.iop_od) === "high" || iopFlag(e.iop_os) === "high").slice(0, 6),
    [exams]
  );

  const largeCupDisc = useMemo(
    () => exams.filter((e) => Number(e.cd_ratio_od || 0) >= 0.6 || Number(e.cd_ratio_os || 0) >= 0.6).slice(0, 6),
    [exams]
  );

  const aftercareDue = useMemo(
    () => fittings
      .filter((f) => f.aftercare_date && (daysFromNow(f.aftercare_date) ?? 99) <= 14)
      .slice(0, 6),
    [fittings]
  );

  const rxExpiring = useMemo(
    () => rxs.filter((r) => r.expiry_date && (daysFromNow(r.expiry_date) ?? 999) <= 60).slice(0, 6),
    [rxs]
  );

  const theatreList = useMemo(
    () => surgeries
      .filter((s) => ["booked", "confirmed"].includes(s.status))
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
      .slice(0, 6),
    [surgeries]
  );

  const diagnosisChart = useMemo(() => {
    const map = new Map<string, number>();
    exams.forEach((e) => {
      (e.diagnosis || "Unspecified").split(/[,;]/).forEach((d) => {
        const key = d.trim() || "Unspecified";
        map.set(key, (map.get(key) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [exams]);

  const cards = [
    { label: "Exams Today", value: stats.examsToday, icon: Eye },
    { label: "Prescriptions Issued", value: stats.rxIssued, icon: Glasses },
    { label: "Active CL Wearers", value: stats.clActive, icon: Contact },
    { label: "Open Optical Orders", value: stats.ordersOpen, icon: Glasses },
    { label: "Upcoming Surgeries", value: stats.surgeriesUpcoming, icon: Scissors },
    { label: "Diagnostic Studies", value: stats.studies, icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Eye Clinic Overview" description="Clinic-wide view of exams, optical, contact lenses and theatre">
        <Button asChild size="sm"><Link to={`${basePath}/eye/exams`}><Plus className="mr-2 h-4 w-4" /> New Eye Exam</Link></Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground">{c.label}</p>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Optical Sales Value</p>
            <p className="mt-2 text-2xl font-bold">{stats.opticalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Outstanding on Orders</p>
            <p className="mt-2 text-2xl font-bold">{stats.outstanding.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Glasses Ready for Collection</p>
            <p className="mt-2 text-2xl font-bold">{stats.ordersReady}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-base">Raised IOP (&gt; 21 mmHg)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {raisedIop.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{patientName(e)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.exam_date).toLocaleDateString()} · {e.iop_method || "IOP"}</p>
                </div>
                <Badge variant="destructive">OD {e.iop_od ?? "—"} / OS {e.iop_os ?? "—"}</Badge>
              </div>
            ))}
            {raisedIop.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No raised pressures recorded.</p>}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Glaucoma watch (C/D ≥ 0.6)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {largeCupDisc.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{patientName(e)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.exam_date).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline">C/D {e.cd_ratio_od ?? "—"} / {e.cd_ratio_os ?? "—"}</Badge>
              </div>
            ))}
            {largeCupDisc.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nothing flagged.</p>}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Theatre list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {theatreList.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{patientName(s)}</p>
                  <p className="text-xs text-muted-foreground">{s.procedure_name} · {s.eye} eye</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.scheduled_date).toLocaleDateString()} {s.scheduled_time?.slice(0, 5) || ""}
                </span>
              </div>
            ))}
            {theatreList.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No surgery booked.</p>}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <Contact className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Contact lens aftercare due</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {aftercareDue.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{patientName(f)}</p>
                  <p className="text-xs text-muted-foreground">{f.lens_brand || "—"} · {f.modality || "—"}</p>
                </div>
                <Badge variant="outline">{new Date(f.aftercare_date!).toLocaleDateString()}</Badge>
              </div>
            ))}
            {aftercareDue.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nothing due in the next 2 weeks.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Prescriptions expiring soon</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rxExpiring.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{patientName(r)}</p>
                <p className="text-xs text-muted-foreground">{r.rx_type || "Spectacle Rx"} · issued {new Date(r.issue_date).toLocaleDateString()}</p>
              </div>
              <Badge variant="outline">expires {new Date(r.expiry_date!).toLocaleDateString()}</Badge>
            </div>
          ))}
          {rxExpiring.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No prescriptions expiring soon.</p>}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Common diagnoses</CardTitle></CardHeader>
        <CardContent className="h-64">
          {diagnosisChart.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No exams recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diagnosisChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
