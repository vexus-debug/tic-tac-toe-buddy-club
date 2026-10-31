import { describe, it, expect } from "vitest";
import { validateClient, toProfileRecord, creditState, agingRisk, shouldHold, buildLedger, termDays } from "@/lib/labClients";

describe("lab clients", () => {
  it("requires a practice name", () => {
    expect(validateClient({ name: " " })).toContain("Practice name is required.");
  });
  it("rejects negative credit limit", () => {
    expect(validateClient({ name: "Apex", credit_limit: -5 })).toContain("Credit limit cannot be negative.");
  });
  it("keeps the existing client UUID on edit", () => {
    expect(toProfileRecord({ name: "Apex" }, "abc").data.client_id).toBe("abc");
  });
  it("defaults to Net 30 standard tier and hold status", () => {
    const r = toProfileRecord({ name: "Apex", on_hold: true });
    expect(r.data.terms).toBe("net_30");
    expect(r.data.tier).toBe("standard");
    expect(r.status).toBe("hold");
  });
  it("computes utilisation of 4200 on a 5000 limit", () => {
    const c = creditState(5000, 4200);
    expect(c.utilization).toBeCloseTo(0.84);
    expect(c.available).toBe(800);
    expect(c.overLimit).toBe(false);
  });
  it("auto-holds when over the credit limit", () => {
    expect(shouldHold(false, creditState(5000, 5200))).toBe(true);
    expect(shouldHold(false, creditState(0, 99999))).toBe(false);
  });
  it("classifies aging risk", () => {
    expect(agingRisk(10, 100)).toBe("overdue");
    expect(agingRisk(61, 100)).toBe("high_risk");
    expect(agingRisk(90, 0)).toBe("current");
  });
  it("maps terms to days", () => { expect(termDays("net_45")).toBe(45); expect(termDays("cod")).toBe(0); });
  it("builds a running ledger", () => {
    const l = buildLedger([
      { date: "2026-10-05", kind: "payment", ref: "P1", amount: 300 },
      { date: "2026-10-01", kind: "invoice", ref: "I1", amount: 1000 },
      { date: "2026-10-09", kind: "credit", ref: "C1", amount: 100 },
    ]);
    expect(l.map((e) => e.balance)).toEqual([1000, 700, 600]);
  });
});
