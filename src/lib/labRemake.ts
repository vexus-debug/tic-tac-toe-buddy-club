import { addWorkingDaysYmd, DEFAULT_WORK_CALENDAR, type WorkCalendar } from "@/lib/labCalendar";
// Remake & warranty rules for dental lab cases.

export const REMAKE_FAULTS = [
  { key: "lab", label: "Lab fault", hint: "Free remake — internal error (over-milled margin, wrong shade)", billable: false },
  { key: "clinic", label: "Clinic fault", hint: "Billable remake — new impression, changed prep or shade", billable: true },
  { key: "material", label: "Material failure", hint: "Supplier claim — fractured disc, defective blank", billable: false },
] as const;

export type RemakeFault = (typeof REMAKE_FAULTS)[number]["key"];

export const REMAKE_REASONS = ["Fit", "Shade", "Fracture", "Contact / occlusion", "New impression", "Prep changed", "Other"];

/** Remakes are rushed back with this many days turnaround. */
export const REMAKE_TURNAROUND_DAYS = 2;

/** "LC-2026-0042-R1" → "LC-2026-0042". */
export const baseCaseNumber = (n: string) => (n || "").replace(/-R\d+$/i, "");

/** Next free remake number for a case, looking at every existing case number. */
export function nextRemakeNumber(caseNumber: string, existing: string[]): string {
  const base = baseCaseNumber(caseNumber);
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-R(\\d+)$`, "i");
  const max = existing.reduce((m, n) => { const x = re.exec(n || ""); return x ? Math.max(m, Number(x[1])) : m; }, 0);
  return `${base}-R${max + 1}`;
}

/** Lab fee charged on the remake: only clinic-fault remakes are billed. */
export const remakeFee = (fault: RemakeFault, originalFee: number) =>
  REMAKE_FAULTS.find((f) => f.key === fault)?.billable ? Number(originalFee || 0) : 0;

/** A case already has an open remake when a child is not delivered or cancelled. */
export const hasOpenRemake = (parentId: string, cases: { parent_case_id?: string | null; status?: string | null }[]) =>
  cases.some((c) => c.parent_case_id === parentId && !["delivered", "cancelled"].includes(c.status || ""));

export function remakeDueDate(from = new Date(), cal: WorkCalendar = DEFAULT_WORK_CALENDAR) {
  return addWorkingDaysYmd(from, REMAKE_TURNAROUND_DAYS, cal);
}

/** Remake rate for a period: remakes opened in the period ÷ cases delivered in the period. */
export function periodRemakeRate(
  cases: { parent_case_id?: string | null; status?: string | null; created_at?: string | null; delivered_date?: string | null; completed_date?: string | null }[],
  fromYmd: string, toYmd: string,
) {
  const inP = (d?: string | null) => !!d && d.slice(0, 10) >= fromYmd && d.slice(0, 10) <= toYmd;
  const live = cases.filter((c) => c.status !== "cancelled");
  const delivered = live.filter((c) => !c.parent_case_id && c.status === "delivered" && inP(c.delivered_date || c.completed_date)).length;
  const remakes = live.filter((c) => c.parent_case_id && inP(c.created_at)).length;
  return { delivered, remakes, pct: delivered ? Math.round((remakes / delivered) * 100) : 0 };
}

/** Free-remake value: each original case's fee counts once, however many remakes it spawned. */
export function freeRemakeValue(claims: { title?: string | null; case_id?: string | null; data?: { fault?: string; original_fee?: number | string } | null }[]) {
  const seen = new Set<string>();
  return claims.reduce((sum, r, i) => {
    if (r.data?.fault === "clinic") return sum;
    const key = baseCaseNumber(r.title || "") || r.case_id || `row-${i}`;
    if (seen.has(key)) return sum;
    seen.add(key);
    return sum + Number(r.data?.original_fee || 0);
  }, 0);
}

/** Remake % grouped by a key (clinic, work type, technician). */
export function remakeRateBy<T>(cases: T[], remakes: T[], key: (c: T) => string) {
  const total = new Map<string, number>();
  cases.forEach((c) => total.set(key(c), (total.get(key(c)) || 0) + 1));
  const rm = new Map<string, number>();
  remakes.forEach((c) => rm.set(key(c), (rm.get(key(c)) || 0) + 1));
  return [...rm.entries()]
    .map(([name, n]) => ({ name, remakes: n, total: total.get(name) || n, pct: Math.round((n / (total.get(name) || n)) * 100) }))
    .sort((a, b) => b.pct - a.pct || b.remakes - a.remakes);
}
