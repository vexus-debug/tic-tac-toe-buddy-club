/** Shared billing helpers: dental line labels, estimate splits, recurring expense dates. */

export interface DentalLineLike {
  tooth_number?: string | null;
  surfaces?: string | null;
  cdt_code?: string | null;
}

/** "#14 · MOD · D2391", or null when the line has no dental details (e.g. retail products). */
export function dentalLineMeta(item: DentalLineLike): string | null {
  const parts = [
    item.tooth_number ? `#${item.tooth_number}` : null,
    item.surfaces || null,
    item.cdt_code || null,
  ].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : null;
}

/** Insurance covers at most the estimate total; the patient pays the rest. */
export function estimateSplit(total: number, insurance: number) {
  const t = Math.max(0, Number(total) || 0);
  const ins = Math.min(t, Math.max(0, Number(insurance) || 0));
  return { insurance: ins, patient: t - ins };
}

export type ExpenseFrequency = "none" | "weekly" | "monthly" | "annual";

/** Next due date (yyyy-mm-dd) for a recurring expense, or null when one-off. */
export function nextDueDate(fromDate: string, frequency: ExpenseFrequency): string | null {
  if (frequency === "none") return null;
  const [y, m, d] = fromDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (frequency === "weekly") dt.setUTCDate(dt.getUTCDate() + 7);
  if (frequency === "monthly") {
    const target = new Date(Date.UTC(y, m, 1));
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(d, last));
    return target.toISOString().slice(0, 10);
  }
  if (frequency === "annual") dt.setUTCFullYear(dt.getUTCFullYear() + 1);
  return dt.toISOString().slice(0, 10);
}

/** Infer the frequency back from an expense's date and next due date. */
export function inferFrequency(expenseDate: string, nextDue: string | null, isRecurring: boolean): ExpenseFrequency {
  if (!isRecurring || !nextDue) return "none";
  for (const f of ["weekly", "monthly", "annual"] as const) if (nextDueDate(expenseDate, f) === nextDue) return f;
  return "monthly";
}
