// Pure rules for Phase 5: scan intake triage and equipment runs (mill, furnace, printer).
// Runs are stored as lab_records kind "cam-runs"; triage verdicts as kind "scan-triage".

export type ScanVerdict = "pending" | "verified" | "margin_question" | "missing_bite" | "rescan";
export const SCAN_VERDICTS: { value: ScanVerdict; label: string; hold?: string }[] = [
  { value: "pending", label: "Awaiting check" },
  { value: "verified", label: "Verified · ready for CAD" },
  { value: "margin_question", label: "Margin question", hold: "Margin clarification needed" },
  { value: "missing_bite", label: "Missing opposing / bite", hold: "Missing bite scan" },
  { value: "rescan", label: "Defective scan · rescan", hold: "Scan defective — rescan required" },
];
/** The clinical-hold reason a verdict triggers, or null when work can continue. */
export const verdictHoldReason = (v: ScanVerdict, note?: string) => {
  const r = SCAN_VERDICTS.find((x) => x.value === v)?.hold;
  return r ? (note?.trim() ? `${r}: ${note.trim()}` : r) : null;
};

export const SCAN_FILE_TYPES = ["Upper arch", "Lower arch", "Bite", "Scan body", "Pre-op", "Photo / Rx", "Other"] as const;
/** Guess a scan file's type from its name. */
export function scanFileType(name: string): (typeof SCAN_FILE_TYPES)[number] {
  const n = name.toLowerCase();
  if (/scan.?body|scanbody|implant/.test(n)) return "Scan body";
  if (/bite|bucc|occlu/.test(n)) return "Bite";
  if (/pre.?op|preparation_pre/.test(n)) return "Pre-op";
  if (/upper|maxill|\bmax\b|\bup\b/.test(n)) return "Upper arch";
  if (/lower|mandib|\bman\b|\blow\b/.test(n)) return "Lower arch";
  if (/\.(jpe?g|png|pdf)$/.test(n)) return "Photo / Rx";
  return "Other";
}

export type Equipment = "mill" | "furnace" | "printer";
export type RunStatus = "staged" | "running" | "completed" | "failed";
export const RUN_FLOW: Record<RunStatus, RunStatus[]> = {
  staged: ["running", "failed"], running: ["completed", "failed"], completed: [], failed: [],
};
export const canRunMove = (from: RunStatus, to: RunStatus) => RUN_FLOW[from]?.includes(to) ?? false;

export interface RunUnit { case_id: string; case_number: string; units: number; shade?: string | null; material?: string | null; sinter?: string | null }

/** Units on a disc / tray / platform; at least one per case. */
export const runUnits = (units: RunUnit[]) => units.reduce((s, u) => s + Math.max(1, Number(u.units) || 1), 0);

/** Fill against capacity, for the utilisation meter. */
export function runFill(units: RunUnit[], capacity: number) {
  const used = runUnits(units);
  const cap = Math.max(0, Number(capacity) || 0);
  return { used, capacity: cap, left: Math.max(0, cap - used), pct: cap ? Math.min(100, Math.round((used / cap) * 100)) : 0, over: cap > 0 && used > cap };
}

export const SINTER_PROFILES = [
  { value: "speed", label: "Speed (≈90 min)", minutes: 90 },
  { value: "standard", label: "Standard (≈4 h)", minutes: 240 },
  { value: "overnight", label: "Overnight (≈8 h)", minutes: 480 },
] as const;
export const profileMinutes = (p?: string | null) => SINTER_PROFILES.find((x) => x.value === p)?.minutes ?? 0;

/** Bridges of 3+ units and high-translucency multilayer zirconia should not be speed-sintered. */
export function sinterWarnings(profile: string, units: RunUnit[]): string[] {
  const out: string[] = [];
  if (profile === "speed") {
    units.filter((u) => (Number(u.units) || 1) >= 3).forEach((u) => out.push(`${u.case_number}: ${u.units}-unit bridge needs a standard or overnight cycle`));
    units.filter((u) => /multi|ut\b|uht|esthetic|aesthetic/i.test(u.material || "")).forEach((u) => out.push(`${u.case_number}: high-translucency material — avoid speed sintering`));
  }
  const curves = new Set(units.map((u) => (u.sinter || "").trim().toLowerCase()).filter(Boolean));
  if (curves.size > 1) out.push("Units need different sintering curves — split them into separate cycles");
  return out;
}

/** A case can be on only one active (staged or running) run per machine type. */
export function casesAlreadyQueued(runs: { status: string; data?: any }[], type: Equipment, excludeRunId?: string) {
  const ids = new Set<string>();
  runs.filter((r: any) => r.id !== excludeRunId && r.data?.equipment === type && (r.status === "staged" || r.status === "running"))
    .forEach((r) => (r.data?.units || []).forEach((u: RunUnit) => ids.add(u.case_id)));
  return ids;
}

/** Which production stage feeds each queue. */
export const QUEUE_STAGE: Record<Equipment, string[]> = { mill: ["design", "milling"], furnace: ["milling", "ceramics"], printer: ["design", "milling"] };
