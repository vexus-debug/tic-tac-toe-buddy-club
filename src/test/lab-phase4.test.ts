import { describe, it, expect } from "vitest";
import { workTypeOptions, suggestedFee, stockState, usableLots, shadeOptions, findShade, materialSpecs } from "@/lib/labCatalog";

const rec = (o: any) => ({ title: "", status: "active", amount: 0, record_date: null, data: {}, ...o });

describe("lab phase 4 catalogue & stock", () => {
  it("uses catalogue turnaround and price", () => {
    const w = workTypeOptions([rec({ title: "Zirconia Crown", amount: 40000, data: { turnaround_days: 4 } })]);
    expect(w[0]).toMatchObject({ name: "Zirconia Crown", price: 40000, turnaround: 4 });
  });
  it("reads the bridge flag and CDT code from the catalogue", () => {
    const w = workTypeOptions([rec({ title: "PFM Bridge", data: { multi_unit: "Yes", cdt: "D6750" } })]);
    expect(w[0]).toMatchObject({ multiUnit: true, cdt: "D6750" });
  });
  it("hides retired work types", () => {
    const w = workTypeOptions([rec({ title: "Zirconia Crown", status: "retired" })]);
    expect(w.some((x) => x.name === "Zirconia Crown")).toBe(false);
  });
  it("clinic agreed price beats catalogue price", () => {
    expect(suggestedFee(30000, 40000)).toBe(30000);
    expect(suggestedFee(null, 40000)).toBe(40000);
  });
  it("flags low stock at or below the minimum", () => {
    expect(stockState(rec({ amount: 2, data: { min_stock: 2 } }), "2026-10-31")).toBe("low");
    expect(stockState(rec({ amount: 3, data: { min_stock: 2 } }), "2026-10-31")).toBe("in stock");
  });
  it("expired and recalled lots are not usable, soonest expiry first", () => {
    const lots = usableLots([
      rec({ id: "a", amount: 5, record_date: "2027-05-01" }),
      rec({ id: "b", amount: 5, record_date: "2026-11-01" }),
      rec({ id: "c", amount: 5, record_date: "2026-01-01" }),
      rec({ id: "d", amount: 5, status: "recalled" }),
    ], "2026-10-31");
    expect(lots.map((l: any) => l.id)).toEqual(["b", "a"]);
  });
  it("shade library lists custom shades plus VITA and finds entries", () => {
    const lib = [rec({ title: "Custom A2+" })];
    expect(shadeOptions(lib)).toContain("A2");
    expect(shadeOptions(lib)[0]).toBe("Custom A2+");
    expect(findShade(lib, "custom a2+")?.title).toBe("Custom A2+");
  });
  it("summarises disc and resin specs, skipping not applicable", () => {
    expect(materialSpecs(rec({ data: { thickness: "14 mm", translucency: "ST", spec: "A2", wavelength: "Not applicable" } }))).toBe("14 mm · ST · A2");
    expect(materialSpecs(rec({ data: { wavelength: "405 nm", volume_ml: 500 } }))).toBe("405 nm · 500 ml");
  });
});
