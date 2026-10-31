// Pure helpers for the Technician Bench ("My tasks today").
export const BENCH_STAGES = ["pending", "design", "milling", "ceramics", "qc"];

export interface BenchCase {
  status: string;
  technician_id: string | null;
  due_date: string | null;
  is_urgent?: boolean | null;
  urgency?: string | null;
}

const rush = (c: BenchCase) => !!(c.is_urgent || c.urgency === "urgent");

/** Cases assigned to this technician that are still on a bench stage, rush first, then earliest due. */
export function benchTasks<T extends BenchCase>(cases: T[], staffId: string | null): T[] {
  if (!staffId) return [];
  return cases
    .filter((c) => c.technician_id === staffId && BENCH_STAGES.includes(c.status))
    .sort((a, b) =>
      Number(rush(b)) - Number(rush(a)) ||
      (a.due_date || "9999-12-31").localeCompare(b.due_date || "9999-12-31"));
}
