export type AgingBucket = "current" | "31_60" | "61_90" | "90_plus";

export const AGING_LABELS: Record<AgingBucket, string> = {
  current: "Current (0–30 days)",
  "31_60": "31–60 days",
  "61_90": "61–90 days",
  "90_plus": "90+ days",
};

/** Days since the invoice date, measured from `today` (both yyyy-mm-dd or Date). */
export function daysOutstanding(invoiceDate: string, today: Date = new Date()): number {
  const d = new Date(invoiceDate + (invoiceDate.length === 10 ? "T00:00:00" : ""));
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((t.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000));
}

export function agingBucket(days: number): AgingBucket {
  if (days <= 30) return "current";
  if (days <= 60) return "31_60";
  if (days <= 90) return "61_90";
  return "90_plus";
}

/** Balance still owed after payments and adjustments (never negative). */
export function invoiceBalance(inv: { total_amount: number; amount_paid: number; adjustments_total?: number }): number {
  return Math.max(0, Number(inv.total_amount) - Number(inv.amount_paid) - Number(inv.adjustments_total || 0));
}

export function summarizeAging<T extends { invoice_date: string; total_amount: number; amount_paid: number; adjustments_total?: number }>(
  invoices: T[],
  today: Date = new Date(),
) {
  const totals: Record<AgingBucket, { amount: number; count: number }> = {
    current: { amount: 0, count: 0 },
    "31_60": { amount: 0, count: 0 },
    "61_90": { amount: 0, count: 0 },
    "90_plus": { amount: 0, count: 0 },
  };
  for (const inv of invoices) {
    const bal = invoiceBalance(inv);
    if (bal <= 0) continue;
    const b = agingBucket(daysOutstanding(inv.invoice_date, today));
    totals[b].amount += bal;
    totals[b].count += 1;
  }
  return totals;
}

/** Roles allowed to write off / adjust invoice balances. */
export const ADJUSTMENT_ROLES = ["owner", "admin", "manager", "accountant"];
export const canAdjustInvoices = (role?: string | null) => !!role && ADJUSTMENT_ROLES.includes(role);

export const ADJUSTMENT_KINDS = [
  { value: "courtesy", label: "Professional courtesy" },
  { value: "bad_debt", label: "Bad debt" },
  { value: "insurance_writeoff", label: "Insurance write-off" },
  { value: "cash_discount", label: "Cash discount" },
] as const;
