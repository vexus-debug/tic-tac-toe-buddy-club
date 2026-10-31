import { describe, it, expect } from "vitest";
import { dentalLineMeta, estimateSplit, nextDueDate, inferFrequency } from "@/lib/billingDisplay";

describe("dentalLineMeta", () => {
  it("formats tooth, surfaces and CDT code", () => {
    expect(dentalLineMeta({ tooth_number: "14", surfaces: "MOD", cdt_code: "D2391" })).toBe("#14 · MOD · D2391");
  });
  it("falls back to null for retail lines", () => {
    expect(dentalLineMeta({ tooth_number: null, surfaces: "", cdt_code: null })).toBeNull();
  });
});

describe("estimateSplit", () => {
  it("splits insurance and patient share", () => {
    expect(estimateSplit(100000, 60000)).toEqual({ insurance: 60000, patient: 40000 });
  });
  it("caps insurance at the total", () => {
    expect(estimateSplit(50000, 80000)).toEqual({ insurance: 50000, patient: 0 });
  });
});

describe("nextDueDate", () => {
  it("adds a week", () => expect(nextDueDate("2026-10-29", "weekly")).toBe("2026-11-05"));
  it("clamps month end", () => expect(nextDueDate("2026-01-31", "monthly")).toBe("2026-02-28"));
  it("adds a year", () => expect(nextDueDate("2026-10-29", "annual")).toBe("2027-10-29"));
  it("one-off has no due date", () => expect(nextDueDate("2026-10-29", "none")).toBeNull());
  it("infers frequency back", () => expect(inferFrequency("2026-10-29", "2026-11-05", true)).toBe("weekly"));
});
