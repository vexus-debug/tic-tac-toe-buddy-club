import { describe, it, expect } from "vitest";
import { daysLate, loadLevel, turnaroundFor, unitsOf, addDaysYmd, isUnscheduled } from "@/lib/labCalendar";

const today = new Date(2026, 9, 30);

describe("lab calendar", () => {
  it("counts days late for undelivered cases", () => {
    expect(daysLate({ due_date: "2026-10-27", status: "ceramics" }, today)).toBe(3);
    expect(daysLate({ due_date: "2026-10-27", status: "delivered" }, today)).toBe(0);
  });
  it("capacity bands: <70 normal, 70-90 busy, >90 overloaded", () => {
    expect(loadLevel(13, 20)).toBe("normal");
    expect(loadLevel(14, 20)).toBe("busy");
    expect(loadLevel(18, 20)).toBe("busy");
    expect(loadLevel(19, 20)).toBe("overloaded");
  });
  it("turnaround: zirconia 5 days, model 2 days", () => {
    expect(turnaroundFor("Zirconia crown")).toBe(5);
    expect(turnaroundFor("Model / Study cast")).toBe(2);
    expect(addDaysYmd(today, 5)).toBe("2026-11-04");
  });
  it("units = teeth count, min 1; unscheduled = no due date and open", () => {
    expect(unitsOf({ due_date: null, status: "pending", teeth: ["11", "12"] })).toBe(2);
    expect(unitsOf({ due_date: null, status: "pending" })).toBe(1);
    expect(isUnscheduled({ due_date: null, status: "delivered" })).toBe(false);
  });
});
