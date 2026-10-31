import { describe, it, expect } from "vitest";
import { agingByClient, allocateOldestFirst, delinquencyRate, shouldAutoHold, validateAllocations, type AgingInvoice } from "@/lib/labAging";

const today = new Date(2026, 9, 31);
const k = (s: string) => s.trim().toLowerCase();
const inv = (id: string, d: string, total: number, paid = 0, client = "Apex"): AgingInvoice => ({ id, client, invoice_date: d, total, paid });

describe("lab A/R aging & payments", () => {
  it("buckets a client's open balances and flags 61+ days as high risk", () => {
    const [a] = agingByClient([inv("1", "2026-10-20", 500), inv("2", "2026-08-15", 300, 100)], k, today);
    expect(a.total).toBe(700);
    expect(a.buckets.current).toBe(500);
    expect(a.buckets["61_90"]).toBe(200);
    expect(a.risk).toBe("high");
  });
  it("auto-holds on 90+ days or over credit limit", () => {
    const b = { current: 0, "31_60": 0, "61_90": 0, "90_plus": 0 };
    expect(shouldAutoHold({ total: 6000, buckets: b }, 5000)).toBe(true);
    expect(shouldAutoHold({ total: 4000, buckets: b }, 5000)).toBe(false);
    expect(shouldAutoHold({ total: 10, buckets: { ...b, "90_plus": 10 } }, 0)).toBe(true);
  });
  it("delinquency rate is share over 30 days", () => {
    expect(delinquencyRate(agingByClient([inv("1", "2026-10-20", 750), inv("2", "2026-09-01", 250)], k, today))).toBe(25);
  });
  it("lump-sum $2,500 pays oldest first and leftover is credit on account", () => {
    const r = allocateOldestFirst(2500, [inv("new", "2026-10-25", 1000), inv("old", "2026-09-01", 1200), inv("mid", "2026-10-01", 200)]);
    expect(r.allocations).toEqual([
      { invoice_id: "old", amount_applied: 1200 }, { invoice_id: "mid", amount_applied: 200 }, { invoice_id: "new", amount_applied: 1000 },
    ]);
    expect(r.unallocated).toBe(100);
  });
  it("rejects over-allocation", () => {
    const invs = [inv("a", "2026-10-01", 100)];
    expect(validateAllocations(50, [{ invoice_id: "a", amount_applied: 80 }], invs)).toContain("Allocated more than the amount received.");
    expect(validateAllocations(500, [{ invoice_id: "a", amount_applied: 150 }], invs).length).toBe(1);
  });
});
