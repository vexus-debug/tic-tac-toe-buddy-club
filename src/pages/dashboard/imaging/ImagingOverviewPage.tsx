import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useScans, useRealtimeScans, useScanAppointments } from "@/hooks/scan/useScan";
import { useOrg } from "@/hooks/useOrg";
import { Scan as ScanIcon, Clock, CheckCircle2, CalendarDays, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ImagingOverviewPage() {
  useRealtimeScans();
  const { basePath } = useOrg();
  const { data: scans = [] } = useScans();
  const { data: appts = [] } = useScanAppointments();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      today: scans.filter((s) => new Date(s.created_at).toDateString() === today).length,
      scheduled: scans.filter((s) => s.status === "scheduled").length,
      inProgress: scans.filter((s) => s.status === "in_progress").length,
      reported: scans.filter((s) => s.status === "reported" || s.status === "approved").length,
      upcoming: appts.filter((a) => new Date(a.scheduled_at) >= new Date()).length,
      revenue: scans.reduce((sum, s) => sum + Number(s.price || 0), 0),
    };
  }, [scans, appts]);

  const byModality = useMemo(() => {
    const map = new Map<string, number>();
    scans.forEach((s) => map.set(s.modality, (map.get(s.modality) || 0) + 1));
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [scans]);

  const cards = [
    { label: "Scans Today", value: stats.today, icon: ScanIcon },
    { label: "Scheduled", value: stats.scheduled, icon: Clock },
    { label: "In Progress", value: stats.inProgress, icon: Clock },
    { label: "Reported", value: stats.reported, icon: CheckCircle2 },
    { label: "Upcoming Appointments", value: stats.upcoming, icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Imaging" description="Radiology and diagnostic imaging at a glance">
        <Button asChild size="sm"><Link to={`${basePath}/imaging/register`}><Plus className="mr-2 h-4 w-4" /> Register Scan</Link></Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Scans by modality</CardTitle></CardHeader>
        <CardContent className="h-64">
          {byModality.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No scans recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byModality}>
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

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Recent scans</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {scans.slice(0, 8).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{s.scan_patients?.full_name || "Unknown patient"}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{s.serial}</span> · {s.modality} {s.body_part || ""}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">{String(s.status).replace("_", " ")}</Badge>
            </div>
          ))}
          {scans.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nothing yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
