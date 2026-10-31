import { describe, it, expect } from "vitest";
import { splitCost, itemPhase, nextOptionLabel } from "@/lib/treatmentOptions";

describe("insurance copay split", () => {
  it("applies plan coverage percent", () => {
    expect(splitCost(100000, 0, 70)).toEqual({ insurance: 70000, patient: 30000 });
  });
  it("explicit per-procedure limit overrides percent", () => {
    expect(splitCost(100000, 25000, 70)).toEqual({ insurance: 25000, patient: 75000 });
  });
  it("insurance never exceeds the fee", () => {
    expect(splitCost(10000, 50000, 0)).toEqual({ insurance: 10000, patient: 0 });
  });
});

describe("phase and options", () => {
  it("stored phase overrides keyword phase", () => {
    expect(itemPhase({ phase: 4, description: "Zirconia Crown" })).toBe(4);
    expect(itemPhase({ phase: null, description: "Zirconia Crown" })).toBe(3);
  });
  it("labels options A, B, C", () => {
    expect(nextOptionLabel([])).toBe("A");
    expect(nextOptionLabel(["A", "B"])).toBe("C");
  });
});
