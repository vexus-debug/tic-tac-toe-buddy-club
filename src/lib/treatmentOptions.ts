import { procedurePhase, type PhaseId } from "@/lib/dentalPhases";

export const ACCEPTANCE = ["proposed", "accepted", "declined", "referred"] as const;
export type Acceptance = (typeof ACCEPTANCE)[number];

/** Phase stored on the item wins; otherwise derive from the description. */
export const itemPhase = (i: { phase?: number | null; description: string }): PhaseId =>
  (i.phase && i.phase >= 1 && i.phase <= 4 ? i.phase : procedurePhase(i.description)) as PhaseId;

/** Insurance pays the stored amount, or plan coverage % of the fee; never more than the fee. */
export function splitCost(fee: number, insuranceAmount: number, coveragePercent: number) {
  const f = Math.max(0, Number(fee) || 0);
  const explicit = Math.max(0, Number(insuranceAmount) || 0);
  const ins = Math.min(f, explicit > 0 ? explicit : (f * Math.min(100, Math.max(0, coveragePercent || 0))) / 100);
  const insurance = Math.round(ins * 100) / 100;
  return { insurance, patient: Math.round((f - insurance) * 100) / 100 };
}

/** Next free option letter in a group (A, B, C…). */
export function nextOptionLabel(used: (string | null | undefined)[]): string {
  const set = new Set(used.filter(Boolean));
  for (const c of "ABCDEFGHIJ") if (!set.has(c)) return c;
  return String(set.size + 1);
}
