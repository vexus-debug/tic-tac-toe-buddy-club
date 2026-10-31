import { describe, it, expect } from "vitest";
import { lineTotal, invoiceTotals, caseToLine, groupForBatch, invoiceStatus, validateLines, type LineItem } from "@/lib/labInvoicing";

const line = (p: Partial<LineItem> = {}): LineItem => ({ description: "Zirconia", units: 1, unit_price: 0, add_ons: [], ...p });

describe("lab invoicing", () => {
  it("3-unit zirconia bridge at 145 is 435", () => {
    expect(lineTotal(line({ units: 3, unit_price: 145 }))).toBe(435);
  });
  it("adds add-ons and rush percentage on base", () => {
    expect(lineTotal(line({ units: 2, unit_price: 100, add_ons: [{ name: "Custom shade", price: 35 }], rush_pct: 25 }))).toBe(285);
  });
  it("line discount never takes a line below zero", () => {
    expect(lineTotal(line({ units: 1, unit_price: 50, discount: 80 }))).toBe(0);
  });
  it("applies invoice discount then tax", () => {
    const t = invoiceTotals([line({ units: 1, unit_price: 1000 })], 100, 10);
    expect(t).toEqual({ subtotal: 1000, discount: 100, taxable: 900, tax: 90, total: 990 });
  });
  it("builds a rush line from an urgent case", () => {
    const l = caseToLine({ id: "c1", lab_fee: 300, units: 3, is_urgent: true, work_type: "Bridge" });
    expect(l.unit_price).toBe(100);
    expect(l.rush_pct).toBe(25);
    expect(lineTotal(l)).toBe(375);
  });
  it("groups cases by client case-insensitively and filters by date", () => {
    const cases = [
      { id: "1", c: "Apex", d: "2026-10-02" }, { id: "2", c: "apex ", d: "2026-10-20" },
      { id: "3", c: "Smile", d: "2026-09-01" },
    ];
    const g = groupForBatch(cases, (x) => x.c, (x) => x.d, "2026-10-01", "2026-10-31");
    expect(g).toHaveLength(1);
    expect(g[0].cases.map((x) => x.id)).toEqual(["1", "2"]);
  });
  it("derives lifecycle status", () => {
    expect(invoiceStatus(100, 0)).toBe("unpaid");
    expect(invoiceStatus(100, 40)).toBe("partial");
    expect(invoiceStatus(100, 100)).toBe("paid");
    expect(invoiceStatus(100, 100, "void")).toBe("void");
  });
  it("rejects empty invoices and zero units", () => {
    expect(validateLines([])).toContain("Add at least one line.");
    expect(validateLines([line({ units: 0 })])).toContain("Line 1: units must be at least 1.");
  });
});
