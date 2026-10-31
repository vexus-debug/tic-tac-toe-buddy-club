import type { EyeDiagnostic, EyeExam } from "@/hooks/eye/useEye";

export type StudyCategory = "fundus" | "oct" | "field" | "other";

export const STUDY_CATEGORY_LABELS: Record<StudyCategory, string> = {
  fundus: "Fundus",
  oct: "OCT",
  field: "Visual Field",
  other: "Other studies",
};

export function studyCategory(studyType: string | null | undefined): StudyCategory {
  const t = (studyType || "").toLowerCase();
  if (t.includes("oct")) return "oct";
  if (t.includes("visual field") || t.includes("perimetry") || t.includes("humphrey")) return "field";
  if (t.includes("fundus") || t.includes("angiograph") || t.includes("retina")) return "fundus";
  return "other";
}

/** Pull a labelled number out of a free-text findings note, e.g. "MD -4.5 dB" → -4.5 */
export function parseMetric(text: string | null | undefined, labels: string[]): number | null {
  if (!text) return null;
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:=]?\\s*(-?\\d+(?:\\.\\d+)?)`, "i");
    const m = text.match(re);
    if (m) {
      const n = Number(m[1]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

export const METRIC_LABELS = {
  md: ["md", "mean deviation"],
  psd: ["psd", "pattern standard deviation"],
  rnfl: ["rnfl", "nerve fibre", "nerve fiber"],
  cmt: ["cmt", "cst", "central macular thickness", "central thickness", "foveal thickness"],
  cdr: ["cdr", "c/d", "cup[- ]?to[- ]?disc"],
};

const sideOf = (eye: string | null | undefined) => (eye || "both").toLowerCase();

/** Builds a date-keyed series for a metric parsed out of diagnostic findings, split by eye. */
export function diagnosticSeries(
  studies: EyeDiagnostic[],
  category: StudyCategory,
  labels: string[],
) {
  const byDate = new Map<string, { date: string; od: number | null; os: number | null }>();
  studies
    .filter((s) => studyCategory(s.study_type) === category)
    .forEach((s) => {
      const value = parseMetric(s.findings, labels);
      if (value === null) return;
      const date = (s.study_date || s.created_at || "").slice(0, 10);
      if (!date) return;
      const row = byDate.get(date) || { date, od: null, os: null };
      const side = sideOf(s.eye);
      if (side === "right" || side === "od" || side === "both") row.od = value;
      if (side === "left" || side === "os" || side === "both") row.os = value;
      byDate.set(date, row);
    });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Series from eye exams (IOP, cup/disc ratio) — fundus & glaucoma trends. */
export function examSeries(exams: EyeExam[], field: "iop" | "cd") {
  return exams
    .map((e) => ({
      date: (e.exam_date || e.created_at || "").slice(0, 10),
      od: field === "iop" ? e.iop_od : e.cd_ratio_od,
      os: field === "iop" ? e.iop_os : e.cd_ratio_os,
    }))
    .filter((r) => r.date && (r.od !== null || r.os !== null))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const hasPoints = (rows: { od: number | null; os: number | null }[]) =>
  rows.some((r) => r.od !== null || r.os !== null);

export const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : "—");
