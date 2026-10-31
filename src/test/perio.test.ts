import { describe, it, expect } from "vitest";
import { cal, bopPercent, emptyTooth, hasFurcation } from "@/lib/perio";

describe("perio", () => {
  it("CAL = PD + recession", () => {
    expect(cal(4, 2)).toBe(6);
    expect(cal(null, 2)).toBeNull();
  });
  it("BOP % over probed sites", () => {
    const t = emptyTooth();
    t.pd = [3, 3, 3, 3, null, null];
    t.bop = [true, false, false, false, true, false];
    expect(bopPercent({ "16": t })).toBe(25);
  });
  it("furcation only on multi-rooted teeth", () => {
    expect(hasFurcation(16)).toBe(true);
    expect(hasFurcation(14)).toBe(true);
    expect(hasFurcation(44)).toBe(false);
    expect(hasFurcation(11)).toBe(false);
  });
});
