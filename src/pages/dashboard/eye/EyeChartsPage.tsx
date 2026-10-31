import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PatientPicker } from "@/components/dashboard/eye/PatientPicker";
import { useOrg } from "@/hooks/useOrg";
import { useEyeExams, useEyeDiagnostics } from "@/hooks/eye/useEye";
import {
  diagnosticSeries, examSeries, hasPoints, METRIC_LABELS, studyCategory, fmtDate,
} from "@/lib/eyeMetrics";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Activity, Eye, FileText, ArrowLeft } from "lucide-react";

type Row = { date: string; od: number | null; os: number | null };

function TrendChart({
  title, description, rows, unit, domain, invert,
}: {
  title: string;
  description: string;
  rows: Row[];
  unit?: string;
  domain?: [number | "auto", number | "auto"];
  invert?: boolean;
}) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {!hasPoints(rows) ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            No readings recorded yet for this graph.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => fmtDate(v)}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                domain={domain || ["auto", "auto"]}
                reversed={invert}
                unit={unit}
              />
              <Tooltip
                labelFormatter={(v) => fmtDate(String(v))}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone" dataKey="od" name="Right eye (OD)" connectNulls
                stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }}
              />
              <Line
                type="monotone" dataKey="os" name="Left eye (OS)" connectNulls
                stroke="hsl(var(--chart-2, var(--accent)))" strokeWidth={2} dot={{ r: 3 }}
                strokeDasharray="5 4"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function EyeChartsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { basePath } = useOrg();
  const patientId = params.get("patient") || "";

  const { data: exams = [] } = useEyeExams(patientId || undefined);
  const { data: studies = [] } = useEyeDiagnostics(patientId || undefined);

  const iop = useMemo(() => examSeries(exams, "iop"), [exams]);
  const cdFromExams = useMemo(() => examSeries(exams, "cd"), [exams]);
  const cdFromFundus = useMemo(() => diagnosticSeries(studies, "fundus", METRIC_LABELS.cdr), [studies]);
  const cd = useMemo(() => {
    const merged = new Map<string, Row>();
    [...cdFromExams, ...cdFromFundus].forEach((r) => {
      const cur = merged.get(r.date) || { date: r.date, od: null, os: null };
      merged.set(r.date, { date: r.date, od: r.od ?? cur.od, os: r.os ?? cur.os });
    });
    return [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [cdFromExams, cdFromFundus]);

  const rnfl = useMemo(() => diagnosticSeries(studies, "oct", METRIC_LABELS.rnfl), [studies]);
  const cmt = useMemo(() => diagnosticSeries(studies, "oct", METRIC_LABELS.cmt), [studies]);
  const md = useMemo(() => diagnosticSeries(studies, "field", METRIC_LABELS.md), [studies]);
  const psd = useMemo(() => diagnosticSeries(studies, "field", METRIC_LABELS.psd), [studies]);

  const counts = useMemo(() => {
    const c = { fundus: 0, oct: 0, field: 0, other: 0 };
    studies.forEach((s) => { c[studyCategory(s.study_type)] += 1; });
    return c;
  }, [studies]);

  const patientLabel = (studies[0] || exams[0]) as any;
  const name = patientLabel?.patients
    ? `${patientLabel.patients.first_name} ${patientLabel.patients.last_name}`
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eye Charts"
        description="Fundus, OCT and visual field trends plotted over time for each eye."
        badge={patientId && name ? <Badge variant="outline">{name}</Badge> : undefined}
      >
        {patientId && (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/patients/${patientId}`)}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Patient
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/eye/reports?patient=${patientId}`)}>
              <FileText className="mr-1 h-3.5 w-3.5" /> Results
            </Button>
          </>
        )}
      </PageHeader>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" /> Patient</CardTitle>
          <CardDescription className="text-xs">
            {patientId ? "Showing this patient's graphs. Pick another patient to switch." : "Pick a patient to plot their graphs, or view clinic-wide readings below."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <PatientPicker
            value={patientId}
            onChange={(id) => setParams(id ? { patient: id } : {})}
          />
          <div className="space-y-2 text-sm">
            <p className="text-xs text-muted-foreground">Studies on record</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Fundus: {counts.fundus}</Badge>
              <Badge variant="secondary">OCT: {counts.oct}</Badge>
              <Badge variant="secondary">Visual field: {counts.field}</Badge>
              <Badge variant="secondary">Other: {counts.other}</Badge>
            </div>
            {patientId && (
              <Button variant="ghost" size="sm" className="px-0" onClick={() => setParams({})}>
                Clear patient
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Intraocular pressure (IOP)"
          description="From eye exams, in mmHg. Watch for a rising trend above 21."
          rows={iop}
          unit=" mmHg"
        />
        <TrendChart
          title="Fundus — cup/disc ratio"
          description="From eye exams and fundus study findings (CDR value)."
          rows={cd}
          domain={[0, 1]}
        />
        <TrendChart
          title="OCT — RNFL thickness"
          description="Nerve fibre layer in microns, read from OCT findings (e.g. “RNFL 82”)."
          rows={rnfl}
          unit=" µm"
        />
        <TrendChart
          title="OCT — central macular thickness"
          description="Macular thickness in microns, read from OCT findings (e.g. “CMT 310”)."
          rows={cmt}
          unit=" µm"
        />
        <TrendChart
          title="Visual field — mean deviation (MD)"
          description="From visual field findings (e.g. “MD -4.5”). Lower values mean more loss."
          rows={md}
          unit=" dB"
        />
        <TrendChart
          title="Visual field — pattern standard deviation (PSD)"
          description="From visual field findings (e.g. “PSD 3.2”)."
          rows={psd}
          unit=" dB"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Graph values are read from the numbers recorded in each study's findings — write them as
        “MD -4.5”, “PSD 3.2”, “RNFL 82”, “CMT 310” or “CDR 0.6” and they will plot automatically.
      </p>
    </div>
  );
}
