import { describe, it, expect } from "vitest";
import { statementSummary, tierPrice, validateCredit } from "@/lib/labStatements";

describe("lab phase 4 statements, price matrix & credit memos", () => {
  it("closing = opening + invoices − payments − credits", () => {
    const s = statementSummary(100, [
      { date: "2026-10-02", debit: 500, credit: 0, kind: "invoice" },
      { date: "2026-10-10", debit: 0, credit: 200, kind: "payment" },
      { date: "2026-10-12", debit: 0, credit: 50, kind: "credit" },
    ]);
    expect(s).toEqual({ opening: 100, invoiced: 500, payments: 200, credits: 50, closing: 350 });
  });
  it("tier price applies the discount", () => {
    expect(tierPrice(145, 10)).toBe(130.5);
    expect(tierPrice(145, 15)).toBe(123.25);
    expect(tierPrice(145, 150)).toBe(0);
  });
  it("credit memo cannot exceed invoice balance", () => {
    expect(validateCredit(60, "Shade Discrepancy", 50)).toHaveLength(1);
    expect(validateCredit(50, "Shade Discrepancy", 50)).toEqual([]);
    expect(validateCredit(0, "", null)).toHaveLength(2);
  });
});
