// Dental lab monthly statements, price matrix tiers and remake credit memos.
const r2 = (n: number) => Math.round(n * 100) / 100;

export interface StatementLine { date: string; debit: number; credit: number; kind?: "invoice" | "payment" | "credit" }

/** Opening + new invoices − payments − credit memos = closing balance due. */
export function statementSummary(opening: number, lines: StatementLine[]) {
  const invoiced = r2(lines.reduce((s, l) => s + (l.debit || 0), 0));
  const payments = r2(lines.filter((l) => l.kind !== "credit").reduce((s, l) => s + (l.credit || 0), 0));
  const credits = r2(lines.filter((l) => l.kind === "credit").reduce((s, l) => s + (l.credit || 0), 0));
  return { opening: r2(opening), invoiced, payments, credits, closing: r2(opening + invoiced - payments - credits) };
}

/** Tier price = list price less discount %, rounded to cents; discount clamped 0–100. */
export const tierPrice = (list: number, discountPct: number) =>
  r2(Number(list || 0) * (1 - Math.min(100, Math.max(0, Number(discountPct || 0))) / 100));

export const CREDIT_REASONS = [
  "Warranty Remake (Lab Defect)",
  "Shade Discrepancy",
  "Impression Re-take Courtesy",
  "Billing Error Adjustment",
] as const;

/** A credit memo can't exceed the invoice's open balance (when linked) and must be positive. */
export function validateCredit(amount: number, reason: string, openBalance: number | null): string[] {
  const e: string[] = [];
  if (!(amount > 0)) e.push("Enter a credit amount.");
  if (!reason) e.push("Choose a reason.");
  if (openBalance !== null && amount > r2(openBalance)) e.push(`Credit exceeds the invoice balance (${r2(openBalance)}).`);
  return e;
}
