import { describe, it, expect } from "vitest";
import { addWorkingDaysYmd, netDaysLate, isWorkingDay } from "@/lib/labCalendar";
import { periodRemakeRate, freeRemakeValue, remakeDueDate } from "@/lib/labRemake";
import { QC_QUEUE_STAGES } from "@/lib/labQc";

describe("lab phase 1 rules", () => {
  it("5-day crown received Thursday is due the next Thursday (weekend skipped)", () => {
    expect(addWorkingDaysYmd(new Date(2026, 9, 29), 5)).toBe("2026-11-05");
  });
  it("lab holidays are skipped", () => {
    const cal = { workingDays: [1, 2, 3, 4, 5], holidays: ["2026-11-02"] };
    expect(addWorkingDaysYmd(new Date(2026, 9, 30), 1, cal)).toBe("2026-11-03");
    expect(isWorkingDay(new Date(2026, 9, 31))).toBe(false);
  });
  it("Saturday counts when the lab opens Saturdays", () => {
    expect(addWorkingDaysYmd(new Date(2026, 9, 30), 1, { workingDays: [1, 2, 3, 4, 5, 6], holidays: [] })).toBe("2026-10-31");
  });
  it("remakes are due 2 working days later", () => {
    expect(remakeDueDate(new Date(2026, 9, 30))).toBe("2026-11-03");
  });
  it("clinic hold days are not counted as lab lateness", () => {
    const today = new Date(2026, 9, 30);
    expect(netDaysLate({ due_date: "2026-10-25", status: "milling", hold_days_total: 4 }, today)).toBe(1);
    expect(netDaysLate({ due_date: "2026-10-28", status: "milling", hold_days_total: 4 }, today)).toBe(0);
  });
  it("remake rate uses delivered cases in the period, not new in-progress ones", () => {
    const cases = [
      ...Array.from({ length: 10 }, () => ({ status: "delivered", delivered_date: "2026-10-10" })),
      ...Array.from({ length: 100 }, () => ({ status: "design", created_at: "2026-10-28" })),
      { status: "pending", parent_case_id: "x", created_at: "2026-10-12" },
    ];
    expect(periodRemakeRate(cases, "2026-10-01", "2026-10-31")).toEqual({ delivered: 10, remakes: 1, pct: 10 });
  });
  it("free remake value counts each original fee once across R1, R2", () => {
    const claims = [
      { title: "LC-1", data: { fault: "lab", original_fee: 100 } },
      { title: "LC-1-R1", data: { fault: "lab", original_fee: 100 } },
      { title: "LC-2", data: { fault: "clinic", original_fee: 50 } },
    ];
    expect(freeRemakeValue(claims)).toBe(100);
  });
  it("only QC-stage cases are inspectable", () => {
    expect(QC_QUEUE_STAGES).toEqual(["qc"]);
  });
});
