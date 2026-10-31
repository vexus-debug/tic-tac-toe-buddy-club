import { describe, it, expect } from "vitest";
import { hasActiveClaim, settlementAmount, invoiceStatusAfterPayment } from "./claims";
import { filterClaims } from "./printDocs";

describe("claims", () => {
  it("draft/submitted/pending claims block a duplicate; paid/denied do not", () => {
    expect(hasActiveClaim([{ status: "submitted" }])).toBe(true);
    expect(hasActiveClaim([{ status: "paid" }, { status: "denied" }])).toBe(false);
  });
  it("settlement is capped at the open balance", () => {
    expect(settlementAmount(50000, 30000)).toBe(30000);
    expect(settlementAmount(20000, 30000)).toBe(20000);
    expect(settlementAmount(-5, 30000)).toBe(0);
  });
  it("invoice becomes paid when fully covered, partial otherwise", () => {
    expect(invoiceStatusAfterPayment(100, 100)).toBe("paid");
    expect(invoiceStatusAfterPayment(40, 100)).toBe("partial");
  });
  it("filters claims by status and invoice number", () => {
    const c = [
      { status: "paid", insurer_name: "AXA", invoices: { invoice_number: "INV-1" } },
      { status: "draft", insurer_name: "Hygeia", invoices: { invoice_number: "INV-2" } },
    ];
    expect(filterClaims(c, "draft", "")).toHaveLength(1);
    expect(filterClaims(c, "all", "inv-1")[0].insurer_name).toBe("AXA");
  });
});
