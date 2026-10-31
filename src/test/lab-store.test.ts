import { describe, it, expect } from "vitest";
import { storeSection, filterStock } from "@/lib/labCatalog";

const rec = (o: any) => ({ title: "x", status: "in stock", amount: 5, record_date: null, data: {}, ...o });
const day = "2026-10-31";

describe("lab material store", () => {
  it("sorts categories into store sections", () => {
    expect(storeSection("Zirconia disc")).toBe("Milling Discs");
    expect(storeSection("PMMA / wax")).toBe("Milling Discs");
    expect(storeSection("3D printing resin")).toBe("3D Resins");
    expect(storeSection("Implant component")).toBe("Implant Hardware");
    expect(storeSection("Porcelain powder")).toBe("Other Consumables");
  });
  it("low stock pill shows lots at or below minimum", () => {
    const r = [rec({ id: "a", amount: 2, data: { min_stock: 2 } }), rec({ id: "b", amount: 9, data: { min_stock: 2 } })];
    expect(filterStock(r, "low", day).map((x: any) => x.id)).toEqual(["a"]);
  });
  it("quarantine pill shows recalled and expired lots", () => {
    const r = [rec({ id: "a", status: "recalled" }), rec({ id: "b", record_date: "2026-01-01" }), rec({ id: "c" })];
    expect(filterStock(r, "quarantine", day).map((x: any) => x.id)).toEqual(["a", "b"]);
  });
  it("expiring pill shows lots within 30 days", () => {
    const r = [rec({ id: "a", record_date: "2026-11-15" }), rec({ id: "b", record_date: "2027-03-01" })];
    expect(filterStock(r, "expiring", day).map((x: any) => x.id)).toEqual(["a"]);
  });
});
