// Recurring (standing) lab orders: which are due, and when they next fall due.

export interface RecurringOrder {
  id: string;
  title: string;
  status: string;
  record_date: string | null; // next due (YYYY-MM-DD)
  amount?: number | null;
  data: Record<string, any>;
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

/** Active orders whose next due date is today or earlier. */
export function dueOrders<T extends RecurringOrder>(orders: T[], today = new Date()): T[] {
  const t = ymd(today);
  return orders.filter((o) => o.status === "active" && !!o.record_date && o.record_date <= t);
}

/** Next due date after `from` for a frequency (Weekly 7d, Fortnightly 14d, Monthly +1m, Quarterly +3m). */
export function advanceDue(from: string, frequency?: string | null): string {
  const d = parse(from);
  switch ((frequency || "Monthly").toLowerCase()) {
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "fortnightly": d.setDate(d.getDate() + 14); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return ymd(d);
}

/** Roll forward until strictly after today, so missed cycles don't pile up. */
export function nextDueAfter(from: string, frequency: string | null | undefined, today = new Date()): string {
  const t = ymd(today);
  let n = advanceDue(from, frequency);
  while (n <= t) n = advanceDue(n, frequency);
  return n;
}
