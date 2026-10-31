// Quality Control inspection rules for dental lab cases.

export interface QcPoint { key: string; label: string; options: string[]; pass: string }

/** The 6-point inspection. The first option of each point is the pass answer. */
export const QC_POINTS: QcPoint[] = [
  { key: "margins", label: "Margin fit & seal", options: ["Pass", "Fail"], pass: "Pass" },
  { key: "contacts", label: "Interproximal contacts", options: ["Pass", "Tight", "Open"], pass: "Pass" },
  { key: "occlusion", label: "Occlusal clearance", options: ["Pass", "High", "Out of occlusion"], pass: "Pass" },
  { key: "shade", label: "Shade match", options: ["Exact", "Light", "Dark", "Stump shade mismatch"], pass: "Exact" },
  { key: "finish", label: "Anatomy & glaze", options: ["Pass", "Over-glazed", "Rough"], pass: "Pass" },
  { key: "disinfection", label: "Disinfection protocol", options: ["Completed", "Pending"], pass: "Completed" },
];

/** Where a failed case can be sent back to. */
export const REWORK_TARGETS = [
  { stage: "design", label: "CAD redesign" },
  { stage: "milling", label: "Mill again" },
  { stage: "ceramics", label: "Stain & re-glaze" },
] as const;

/** Cases waiting for inspection. */
export const QC_QUEUE_STAGES = ["qc"]; // ceramics is still being glazed — never inspectable

export type QcAnswers = Record<string, string | undefined>;

export const isComplete = (a: QcAnswers) => QC_POINTS.every((p) => !!a[p.key]);
export const failedPoints = (a: QcAnswers) => QC_POINTS.filter((p) => a[p.key] && a[p.key] !== p.pass);

/** Suggested rework stage for the first failed point. */
export function suggestRework(a: QcAnswers): string {
  const f = failedPoints(a).map((p) => p.key);
  if (f.includes("margins")) return "design";
  if (f.includes("contacts") || f.includes("occlusion")) return "milling";
  return "ceramics";
}

/**
 * Outcome of an inspection.
 * - all points pass → case goes to "ready" with qc_status "passed"
 * - only disinfection pending → stays in "qc", qc_status "pending"
 * - any other failure → back to the chosen rework stage, qc_status "rework_needed"
 */
export function qcOutcome(a: QcAnswers, reworkStage?: string) {
  const failed = failedPoints(a);
  if (!failed.length) return { qc_status: "passed", status: "ready", record: "passed" } as const;
  if (failed.every((p) => p.key === "disinfection")) return { qc_status: "pending", status: "qc", record: "rework needed" } as const;
  return { qc_status: "rework_needed", status: reworkStage || suggestRework(a), record: "rework needed" } as const;
}
