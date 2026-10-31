import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useEyeExams, useOpticalPrescriptions, useContactLensFittings, useOpticalOrders,
  useEyeDiagnostics, useSurgeryBookings, formatRxEye, iopFlag,
} from "@/hooks/eye/useEye";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/hooks/useOrg";
import { Eye, Glasses, Contact, Activity, Scissors, FileText, LineChart as LineChartIcon } from "lucide-react";

const d = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : "—");

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

export function EyeRecordsTab({ patientId }: { patientId: string }) {
  const { basePath } = useOrg();
  const { data: exams = [] } = useEyeExams(patientId);
  const { data: rxs = [] } = useOpticalPrescriptions(patientId);
  const { data: fittings = [] } = useContactLensFittings(patientId);
  const { data: orders = [] } = useOpticalOrders(patientId);
  const { data: studies = [] } = useEyeDiagnostics(patientId);
  const { data: surgeries = [] } = useSurgeryBookings(patientId);

  return (
    <>
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to={`${basePath}/eye/reports?patient=${patientId}`}>
          <FileText className="mr-1 h-3.5 w-3.5" /> Fundus / OCT / field results
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link to={`${basePath}/eye/charts?patient=${patientId}`}>
          <LineChartIcon className="mr-1 h-3.5 w-3.5" /> Eye charts &amp; trends
        </Link>
      </Button>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Eye Exams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {exams.length === 0 && <Empty text="No eye exams recorded." />}
          {exams.map((e) => (
            <div key={e.id} className="rounded-md border border-border/40 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{d(e.exam_date)}</p>
                <Badge variant={iopFlag(e.iop_od) === "high" || iopFlag(e.iop_os) === "high" ? "destructive" : "outline"}>
                  IOP {e.iop_od ?? "—"} / {e.iop_os ?? "—"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                VA {e.va_aided_od || e.va_unaided_od || "—"} / {e.va_aided_os || e.va_unaided_os || "—"}
                {e.diagnosis ? ` · ${e.diagnosis}` : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <Glasses className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Optical Prescriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rxs.length === 0 && <Empty text="No prescriptions issued." />}
          {rxs.map((r) => (
            <div key={r.id} className="rounded-md border border-border/40 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{r.rx_type || "Spectacle Rx"}</p>
                <span className="text-xs text-muted-foreground">issued {d(r.issue_date)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                OD {formatRxEye(r.sphere_od, r.cylinder_od, r.axis_od, r.add_od)} · OS {formatRxEye(r.sphere_os, r.cylinder_os, r.axis_os, r.add_os)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <Contact className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Contact Lenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fittings.length === 0 && <Empty text="No contact lens fittings." />}
          {fittings.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{f.lens_brand || "—"} · {f.lens_type || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {d(f.fitting_date)} · OD {f.power_od ?? "—"} / OS {f.power_os ?? "—"}
                </p>
              </div>
              <Badge variant="outline">{f.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <Glasses className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Optical Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {orders.length === 0 && <Empty text="No optical orders." />}
          {orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{o.frame_brand || "—"} {o.frame_model || ""}</p>
                <p className="text-xs text-muted-foreground">
                  {d(o.order_date)} · {o.lens_type || "—"} · total {Number(o.total_amount || 0).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">{o.status.replace("_", " ")}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Diagnostic Studies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {studies.length === 0 && <Empty text="No studies recorded." />}
          {studies.map((s) => (
            <div key={s.id} className="rounded-md border border-border/40 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{s.study_type}</p>
                <Badge variant="outline">{s.eye}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{d(s.study_date)}{s.findings ? ` · ${s.findings}` : ""}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <Scissors className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Surgery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {surgeries.length === 0 && <Empty text="No surgery booked." />}
          {surgeries.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{s.procedure_name}</p>
                <p className="text-xs text-muted-foreground">
                  {d(s.scheduled_date)} {s.scheduled_time?.slice(0, 5) || ""} · {s.eye} eye
                </p>
              </div>
              <Badge variant="outline">{s.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
