import { describe, it, expect } from "vitest";
import { dueOrders, advanceDue, nextDueAfter } from "@/lib/labRecurring";

const o = (id: string, status: string, record_date: string | null) => ({ id, title: id, status, record_date, data: {} });
const today = new Date(2026, 9, 30);

describe("recurring orders", () => {
  it("only active orders due today or earlier", () => {
    const r = dueOrders([o("a", "active", "2026-10-30"), o("b", "active", "2026-10-31"), o("c", "paused", "2026-10-01"), o("d", "active", null)], today);
    expect(r.map((x) => x.id)).toEqual(["a"]);
  });
  it("advances by frequency", () => {
    expect(advanceDue("2026-10-30", "Weekly")).toBe("2026-11-06");
    expect(advanceDue("2026-10-30", "Fortnightly")).toBe("2026-11-13");
    expect(advanceDue("2026-10-15", "Monthly")).toBe("2026-11-15");
    expect(advanceDue("2026-10-15", "Quarterly")).toBe("2027-01-15");
  });
  it("skips missed cycles to the next future date", () => {
    expect(nextDueAfter("2026-10-01", "Weekly", today)).toBe("2026-11-05");
  });
});
