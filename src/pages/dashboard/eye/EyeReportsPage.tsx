import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PatientPicker } from "@/components/dashboard/eye/PatientPicker";
import { useOrg } from "@/hooks/useOrg";
import { useEyeDiagnostics, useEyeExams, patientName, iopFlag } from "@/hooks/eye/useEye";
import type { EyeDiagnostic } from "@/hooks/eye/useEye";
import {
  METRIC_LABELS, STUDY_CATEGORY_LABELS, fmtDate, parseMetric, studyCategory,
  type StudyCategory,
} from "@/lib/eyeMetrics";
import { Activity, ArrowLeft, Download, Eye, LineChart as LineChartIcon, ScanEye } from "lucide-react";

const EYE_LABEL: Record<string, string> = {
  right: "Right eye (OD)", od: "Right eye (OD)",
  left: "Left eye (OS)", os: "Left eye (OS)",
  both: "Both eyes",
};

function metricsFor(study: EyeDiagnostic, cat: StudyCategory) {
  const out: { label: string; value: string; alert?: boolean }[] = [];
  const push = (label: string, v: number | null, unit = "", alert?: boolean) => {
    if (v !== null) out.push({ label, value: `${v}${unit}`, alert });
  };
  if (cat === "oct") {
    const rnfl = parseMetric(study.findings, METRIC_LABELS.rnfl);
    const cmt = parseMetric(study.findings, METRIC_LABELS.cmt);
    push("RNFL", rnfl, " µm", rnfl !== null && rnfl < 80);
    push("CMT", cmt, " µm", cmt !== null && cmt > 320);
  } else if (cat === "field") {
    const md = parseMetric(study.findings, METRIC_LABELS.md);
    const psd = parseMetric(study.findings, METRIC_LABELS.psd);
    push("MD", md, " dB", md !== null && md < -6);
    push("PSD", psd, " dB", psd !== null && psd > 3);
  } else if (cat === "fundus") {
    const cdr = parseMetric(study.findings, METRIC_LABELS.cdr);
    push("CDR", cdr, "", cdr !== null && cdr >= 0.6);
  }
  return out;
}

function StudyList({
  cat, studies, icon: Icon,
}: { cat: StudyCategory; studies: EyeDiagnostic[]; icon: typeof Eye }) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {STUDY_CATEGORY_LABELS[cat]} results
          <Badge variant="secondary" className="ml-auto">{studies.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Most recent first, with the key numbers pulled out of each report.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {studies.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No results recorded yet.</p>
        )}
        {studies.map((s) => {
          const metrics = metricsFor(s, cat);
          return (
            <div key={s.id} className="rounded-md border border-border/40 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{s.study_type}</p>
                <span className="text-xs text-muted-foreground">{fmtDate(s.study_date)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {EYE_LABEL[(s.eye || "both").toLowerCase()] || s.eye} · {patientName(s)}
              </p>
              {metrics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {metrics.map((m) => (
                    <Badge key={m.label} variant={m.alert ? "destructive" : "outline"}>
                      {m.label} {m.value}
                    </Badge>
                  ))}
                </div>
              )}
              {s.findings && <p className="mt-2 whitespace-pre-wrap text-xs">{s.findings}</p>}
              {s.file_url && (
                <Button asChild variant="ghost" size="sm" className="mt-1 px-0">
                  <a href={s.file_url} target="_blank" rel="noreferrer">
                    <Download className="mr-1 h-3.5 w-3.5" /> {s.file_name || "Open report file"}
                  </a>
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function EyeReportsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { basePath } = useOrg();
  const patientId = params.get("patient") || "";

  const { data: studies = [] } = useEyeDiagnostics(patientId || undefined);
  const { data: exams = [] } = useEyeExams(patientId || undefined);

  const grouped = useMemo(() => {
    const g: Record<StudyCategory, EyeDiagnostic[]> = { fundus: [], oct: [], field: [], other: [] };
    studies.forEach((s) => g[studyCategory(s.study_type)].push(s));
    return g;
  }, [studies]);

  const latestExam = exams[0];
  const anchor = (studies[0] || exams[0]) as any;
  const name = anchor?.patients ? `${anchor.patients.first_name} ${anchor.patients.last_name}` : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eye Results"
        description="Fundus, OCT and visual field reports gathered in one place."
        badge={patientId && name ? <Badge variant="outline">{name}</Badge> : undefined}
      >
        {patientId && (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/patients/${patientId}`)}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Patient
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/eye/charts?patient=${patientId}`)}>
              <LineChartIcon className="mr-1 h-3.5 w-3.5" /> Graphs
            </Button>
          </>
        )}
      </PageHeader>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" /> Patient</CardTitle>
          <CardDescription className="text-xs">
            {patientId ? "Showing this patient's results. Pick another patient to switch." : "Pick a patient, or review every recent result below."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <PatientPicker value={patientId} onChange={(id) => setParams(id ? { patient: id } : {})} />
          <div className="space-y-2 text-sm">
            {latestExam ? (
              <>
                <p className="text-xs text-muted-foreground">Latest eye exam — {fmtDate(latestExam.exam_date)}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={iopFlag(latestExam.iop_od) === "high" || iopFlag(latestExam.iop_os) === "high" ? "destructive" : "outline"}>
                    IOP {latestExam.iop_od ?? "—"} / {latestExam.iop_os ?? "—"} mmHg
                  </Badge>
                  <Badge variant="outline">
                    VA {latestExam.va_aided_od || latestExam.va_unaided_od || "—"} / {latestExam.va_aided_os || latestExam.va_unaided_os || "—"}
                  </Badge>
                  {(latestExam.cd_ratio_od !== null || latestExam.cd_ratio_os !== null) && (
                    <Badge variant="outline">
                      CDR {latestExam.cd_ratio_od ?? "—"} / {latestExam.cd_ratio_os ?? "—"}
                    </Badge>
                  )}
                </div>
                {latestExam.diagnosis && <p className="text-xs">{latestExam.diagnosis}</p>}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No eye exam recorded yet.</p>
            )}
            {patientId && (
              <Button variant="ghost" size="sm" className="px-0" onClick={() => setParams({})}>
                Clear patient
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyList cat="fundus" studies={grouped.fundus} icon={Eye} />
        <StudyList cat="oct" studies={grouped.oct} icon={ScanEye} />
        <StudyList cat="field" studies={grouped.field} icon={Activity} />
        <StudyList cat="other" studies={grouped.other} icon={Activity} />
      </div>
    </div>
  );
}
