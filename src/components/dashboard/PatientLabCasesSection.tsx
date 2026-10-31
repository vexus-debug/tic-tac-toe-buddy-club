import { useMemo, useState } from "react";
import { format, isPast, parseISO } from "date-fns";
import { FlaskConical, Plus, ExternalLink, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLabCases, type LabCaseRow } from "@/hooks/useLabCases";
import { LabCaseDetailDialog } from "@/components/dashboard/LabCaseDetailDialog";

const STATUS: Record<string, { label: string; variant: "secondary" | "default" | "outline" | "destructive" }> = {
  pending: { label: "Sent", variant: "outline" },
  "in-progress": { label: "In production", variant: "secondary" },
  ready: { label: "Ready to fit", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
};

export { isLabCaseActive } from "@/lib/labCasePrefill";
import { isLabCaseActive } from "@/lib/labCasePrefill";

export function usePatientLabCases(patientId?: string) {
  const q = useLabCases();
  const cases = useMemo(() => (q.data || []).filter((c) => c.patient_id === patientId), [q.data, patientId]);
  return { ...q, cases };
}

interface Props {
  patientId: string;
  onOrder: () => void;
  onOpenCentral: (caseId?: string) => void;
}

export function PatientLabCasesSection({ patientId, onOrder, onOpenCentral }: Props) {
  const { cases, isLoading } = usePatientLabCases(patientId);
  const [selected, setSelected] = useState<LabCaseRow | null>(null);
  const stats = {
    total: cases.length,
    production: cases.filter((c) => c.status === "pending" || c.status === "in-progress").length,
    ready: cases.filter((c) => c.status === "ready").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-4 text-sm">
          <span><strong>{stats.total}</strong> <span className="text-muted-foreground">total</span></span>
          <span><strong>{stats.production}</strong> <span className="text-muted-foreground">at lab</span></span>
          <span><strong>{stats.ready}</strong> <span className="text-muted-foreground">ready to fit</span></span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpenCentral()}><ExternalLink className="mr-1 h-4 w-4" /> All lab work</Button>
          <Button size="sm" onClick={onOrder}><Plus className="mr-1 h-4 w-4" /> Order lab case</Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading lab cases…</p>
      ) : cases.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <FlaskConical className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No lab work for this patient yet</p>
          <p className="text-xs text-muted-foreground">Crowns, bridges, dentures and aligners sent to the lab will appear here.</p>
          <Button size="sm" className="mt-2" onClick={onOrder}><Plus className="mr-1 h-4 w-4" /> Order first lab case</Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {cases.map((c) => {
            const s = STATUS[c.status] || { label: c.status, variant: "outline" as const };
            const overdue = c.due_date && isLabCaseActive(c) && c.status !== "ready" && isPast(parseISO(c.due_date));
            return (
              <button key={c.id} type="button" onClick={() => setSelected(c)}
                className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.work_type || "Lab case"} <span className="font-normal text-muted-foreground">· {c.case_number}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {[c.shade && `Shade ${c.shade}`, c.material, c.dentist?.full_name && `Dr ${c.dentist.full_name}`, c.technician?.full_name && `Tech: ${c.technician.full_name}`].filter(Boolean).join(" · ") || "No specification"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                  <span>Sent {format(parseISO(c.start_date || c.created_at), "d MMM yyyy")}</span>
                  {c.due_date && (
                    <span className={overdue ? "flex items-center gap-1 font-medium text-destructive" : ""}>
                      {overdue && <AlertTriangle className="h-3 w-3" />}Due {format(parseISO(c.due_date), "d MMM yyyy")}{overdue && " (overdue)"}
                    </span>
                  )}
                  {c.completed_date && <span>Delivered {format(parseISO(c.completed_date), "d MMM yyyy")}</span>}
                  <span role="link" tabIndex={0} className="ml-auto font-medium text-primary hover:underline"
                    onClick={(e) => { e.stopPropagation(); onOpenCentral(c.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onOpenCentral(c.id); } }}>
                    Open in lab queue
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <LabCaseDetailDialog labCase={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
