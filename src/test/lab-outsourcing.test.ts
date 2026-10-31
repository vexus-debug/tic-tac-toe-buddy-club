import { describe, expect, it } from "vitest";
import { addBusinessDays, canMove, daysUntilDue, defaultDaysFor, outstandingTotal, partnerPerformance, qcResult } from "@/lib/labOutsourcing";

describe("labOutsourcing", () => {
  it("uses common turnaround defaults", () => {
    expect(defaultDaysFor("Zirconia Milling")).toBe(4);
    expect(defaultDaysFor("SLM Metal Framework")).toBe(6);
  });
  it("skips weekends when adding business days", () => {
    expect(addBusinessDays("2026-10-30", 1)).toBe("2026-11-02"); // Fri -> Mon
  });
  it("flags overdue open dispatches", () => {
    expect(daysUntilDue({ status: "at_vendor", amount: 0, data: { expected_return_date: "2026-10-29" } }, "2026-10-31")).toBe(-2);
    expect(daysUntilDue({ status: "received", amount: 0, data: { expected_return_date: "2026-10-29" } }, "2026-10-31")).toBeNull();
  });
  it("enforces the dispatch state machine", () => {
    expect(canMove("dispatched", "in_transit")).toBe(true);
    expect(canMove("received", "dispatched")).toBe(false);
  });
  it("computes on-time and remake rates", () => {
    const p = partnerPerformance([
      { status: "received", amount: 0, data: { partner_id: "a", expected_return_date: "2026-10-20", received_date: "2026-10-19" } },
      { status: "rejected", amount: 0, data: { partner_id: "a", expected_return_date: "2026-10-20", received_date: "2026-10-22" } },
    ], "a", "2026-10-31");
    expect(p).toEqual({ completed: 2, otd: 50, remakeRate: 50 });
  });
  it("nets bills against payments", () => {
    expect(outstandingTotal([
      { status: "due", amount: 1000, title: "X", data: {} },
      { status: "paid", amount: 400, title: "X", data: {} },
    ])).toBe(600);
  });
  it("needs all four QC checks", () => {
    expect(qcResult({ fit_margins: true })).toBe("incomplete");
    expect(qcResult({ fit_margins: true, occlusion_thickness: true, shade_match: false, surface_finish: true })).toBe("failed");
  });
});
