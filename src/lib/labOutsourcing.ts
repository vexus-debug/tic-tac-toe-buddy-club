// Outsourcing domain: partner labs, dispatches, receiving QC and vendor payables.
// Persisted in lab_records with kinds "external-labs", "outsourced-dispatches", "lab-payments".

export type DispatchStatus = "dispatched" | "in_transit" | "at_vendor" | "received" | "rejected" | "cancelled";

export const DISPATCH_STATUSES: DispatchStatus[] = ["dispatched", "in_transit", "at_vendor", "received", "rejected", "cancelled"];
export const OPEN_STATUSES: DispatchStatus[] = ["dispatched", "in_transit", "at_vendor"];

export const DISPATCH_STATUS_LABEL: Record<DispatchStatus, string> = {
  dispatched: "Dispatched", in_transit: "In transit", at_vendor: "At vendor",
  received: "Received", rejected: "Rejected", cancelled: "Cancelled",
};

// Allowed lifecycle moves (state machine).
export const NEXT_STATUSES: Record<DispatchStatus, DispatchStatus[]> = {
  dispatched: ["in_transit", "at_vendor", "cancelled"],
  in_transit: ["at_vendor", "cancelled"],
  at_vendor: ["in_transit", "cancelled"],
  received: [],
  rejected: ["dispatched"],
  cancelled: [],
};

export const canMove = (from: DispatchStatus, to: DispatchStatus) => NEXT_STATUSES[from]?.includes(to) ?? false;

// Most common outsourced services with typical turnaround (business days).
export const OUTSOURCE_SERVICES: { name: string; days: number }[] = [
  { name: "Zirconia Milling", days: 4 },
  { name: "Titanium Custom Abutment", days: 5 },
  { name: "SLM Metal Framework", days: 6 },
  { name: "3D Print Model", days: 2 },
  { name: "Clear Aligner Series", days: 10 },
  { name: "Specialty Casting", days: 5 },
];

export const defaultDaysFor = (service: string) => OUTSOURCE_SERVICES.find((s) => s.name === service)?.days ?? 5;

export const QC_CHECKS = [
  { key: "fit_margins", label: "Margin integrity & fit" },
  { key: "occlusion_thickness", label: "Contacts, occlusion & thickness" },
  { key: "shade_match", label: "Shade match" },
  { key: "surface_finish", label: "Anatomy & surface finish" },
] as const;
export type QcKey = (typeof QC_CHECKS)[number]["key"];
export type QcOutcome = "passed" | "rework_vendor" | "rework_internal";

export interface DispatchData {
  case_id?: string; case_number?: string; partner_id?: string; partner_name?: string;
  service_type?: string; send_date?: string; expected_return_date?: string; received_date?: string;
  tracking_ref?: string; qc_outcome?: QcOutcome; qc_checks?: Partial<Record<QcKey, boolean>>; qc_notes?: string;
}
export interface DispatchLike { status: string; amount: number; data: DispatchData }
export interface PaymentLike { status: string; amount: number; title: string; data: Record<string, any> }

const dayMs = 86400000;
const toDay = (s: string) => new Date(s.slice(0, 10) + "T00:00:00Z").getTime();

/** Adds business days (skips Sat/Sun) to an ISO date. */
export function addBusinessDays(iso: string, days: number): string {
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

/** Days until expected return (negative = overdue). Null when not open or no date. */
export function daysUntilDue(d: DispatchLike, today: string): number | null {
  if (!OPEN_STATUSES.includes(d.status as DispatchStatus) || !d.data.expected_return_date) return null;
  return Math.round((toDay(d.data.expected_return_date) - toDay(today)) / dayMs);
}

export const isOverdue = (d: DispatchLike, today: string) => (daysUntilDue(d, today) ?? 0) < 0;

export function dueLabel(n: number | null): string {
  if (n === null) return "";
  if (n < 0) return `Overdue by ${-n}d`;
  if (n === 0) return "Due today";
  return `Due in ${n}d`;
}

/** Received dispatches from the last `windowDays` days: on-time % and vendor rework %. */
export function partnerPerformance(dispatches: DispatchLike[], partnerId: string, today: string, windowDays = 90) {
  const from = toDay(today) - windowDays * dayMs;
  const done = dispatches.filter((d) => d.data.partner_id === partnerId && (d.status === "received" || d.status === "rejected")
    && d.data.received_date && toDay(d.data.received_date) >= from);
  if (!done.length) return { completed: 0, otd: null as number | null, remakeRate: null as number | null };
  const onTime = done.filter((d) => !d.data.expected_return_date || toDay(d.data.received_date!) <= toDay(d.data.expected_return_date)).length;
  const rework = done.filter((d) => d.status === "rejected" || d.data.qc_outcome === "rework_vendor").length;
  return { completed: done.length, otd: Math.round((onTime / done.length) * 100), remakeRate: Math.round((rework / done.length) * 100) };
}

/** Bills ("due") vs payments ("paid") per partner name. */
export function payablesByPartner(payments: PaymentLike[]) {
  const map = new Map<string, { partner: string; billed: number; paid: number; balance: number }>();
  for (const p of payments) {
    const key = p.title || "Unknown";
    const row = map.get(key) ?? { partner: key, billed: 0, paid: 0, balance: 0 };
    if (p.status === "paid") row.paid += Number(p.amount) || 0; else row.billed += Number(p.amount) || 0;
    row.balance = row.billed - row.paid;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.balance - a.balance);
}

export const outstandingTotal = (payments: PaymentLike[]) =>
  Math.max(0, payablesByPartner(payments).reduce((s, r) => s + r.balance, 0));

export function qcResult(checks: Partial<Record<QcKey, boolean>>): "passed" | "failed" | "incomplete" {
  const vals = QC_CHECKS.map((c) => checks[c.key]);
  if (vals.some((v) => v === undefined)) return "incomplete";
  return vals.every(Boolean) ? "passed" : "failed";
}
