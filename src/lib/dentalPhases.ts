// Clinical helpers for the patient odontogram and phased treatment plans.

export type Notation = "fdi" | "universal";

/** FDI (11–48) → Universal (1–32) for permanent teeth. */
export function fdiToUniversal(fdi: number): number | null {
  const q = Math.floor(fdi / 10);
  const p = fdi % 10;
  if (p < 1 || p > 8) return null;
  if (q === 1) return 9 - p; // 18→1 … 11→8
  if (q === 2) return 8 + p; // 21→9 … 28→16
  if (q === 3) return 25 - p; // 38→17 … 31→24
  if (q === 4) return 24 + p; // 41→25 … 48→32
  return null;
}

/** FDI primary (51–85) → Universal letters A–T. */
export function fdiPrimaryToUniversal(fdi: number): string | null {
  const q = Math.floor(fdi / 10);
  const p = fdi % 10;
  if (p < 1 || p > 5) return null;
  const L = "ABCDEFGHIJKLMNOPQRST";
  if (q === 5) return L[5 - p]; // 55→A … 51→E
  if (q === 6) return L[4 + p]; // 61→F … 65→J
  if (q === 7) return L[15 - p]; // 75→K … 71→O
  if (q === 8) return L[14 + p]; // 81→P … 85→T
  return null;
}

export const isPrimaryTooth = (fdi: number) => Math.floor(fdi / 10) >= 5;

export function toothLabel(fdi: number, notation: Notation): string {
  if (notation === "fdi") return String(fdi);
  return isPrimaryTooth(fdi) ? (fdiPrimaryToUniversal(fdi) ?? String(fdi)) : String(fdiToUniversal(fdi) ?? fdi);
}

/** Permanent successor of a primary tooth (e.g. 55 → 15). */
export const successorOf = (fdi: number) => (Math.floor(fdi / 10) - 4) * 10 + (fdi % 10);

export const PHASES = [
  { id: 1, title: "Phase 1 · Urgent / Pain relief" },
  { id: 2, title: "Phase 2 · Disease control & hygiene" },
  { id: 3, title: "Phase 3 · Rehabilitation & prosthodontics" },
  { id: 4, title: "Phase 4 · Maintenance & recall" },
] as const;

export type PhaseId = 1 | 2 | 3 | 4;

const RULES: [PhaseId, RegExp][] = [
  [1, /extract|pulpot|pulpect|abscess|incision|drainage|emergency|pain|root canal|rct|endodont/],
  [3, /crown|bridge|implant|denture|veneer|inlay|onlay|post|prosth|aligner|ortho/],
  [4, /recall|review|check-?up|maintenance|prophy|polish|fluoride|sealant|exam/],
  [2, /scal|root planing|perio|filling|restor|composite|amalgam|gic|desensit|bonding|repair/],
];

/** Classifies a procedure description into a clinical treatment phase. */
export function procedurePhase(description: string): PhaseId {
  const d = (description || "").toLowerCase();
  for (const [phase, re] of RULES) if (re.test(d)) return phase;
  return 2;
}
