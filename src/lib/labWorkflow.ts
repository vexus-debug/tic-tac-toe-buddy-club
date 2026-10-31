// Deterministic lab case transitions, hold handling and tooth notation helpers.
export const STAGE_ORDER = ["pending", "design", "milling", "ceramics", "qc", "ready", "delivered"] as const;
export type Stage = (typeof STAGE_ORDER)[number];

export const HOLD_REASONS = [
  "Unclear margin line",
  "Missing opposing scan",
  "Shade verification needed",
  "Prescription contradiction",
  "Doctor requested delay",
] as const;

export function nextStage(s: string): Stage | null {
  const i = STAGE_ORDER.indexOf(s as Stage);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}
export function prevStage(s: string): Stage | null {
  const i = STAGE_ORDER.indexOf(s as Stage);
  return i > 0 ? STAGE_ORDER[i - 1] : null;
}

/** Shipping out of QC needs a passed inspection unless an admin overrides. */
export function blockedReason(from: string, to: string, qcStatus?: string | null): string | null {
  if (from === "on_hold") return "Release the hold first.";
  const fi = STAGE_ORDER.indexOf(from as Stage), ti = STAGE_ORDER.indexOf(to as Stage);
  const qi = STAGE_ORDER.indexOf("qc");
  if (ti > qi && fi <= qi && qcStatus !== "passed") return "Quality check has not passed yet.";
  return null;
}

/** Parse "11, 21 #14" style input into unique tooth numbers (keeps order). */
export function parseTeeth(input: string): string[] {
  const out: string[] = [];
  for (const m of input.matchAll(/\d{1,2}/g)) if (!out.includes(m[0])) out.push(m[0]);
  return out;
}

/** Older cases stored teeth as a "Teeth: …" line inside instructions. */
export function splitLegacyTeeth(instructions: string | null | undefined): { teeth: string[]; rest: string } {
  const text = instructions || "";
  const m = text.match(/^Teeth:\s*(.+)$/m);
  if (!m) return { teeth: [], rest: text };
  return { teeth: parseTeeth(m[1]), rest: text.replace(m[0], "").replace(/^\n+/, "") };
}

export function holdMessage(o: { caseNumber: string; patient: string; doctor?: string; reason: string; note?: string }) {
  return [
    `Hello${o.doctor ? ` Dr. ${o.doctor}` : ""},`,
    `Case ${o.caseNumber} (${o.patient}) is on hold at the lab: ${o.reason}.`,
    o.note || "",
    "Please advise so we can continue production. Thank you.",
  ].filter(Boolean).join("\n");
}

export const FDI_UPPER = ["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28"];
export const FDI_LOWER = ["48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"];
