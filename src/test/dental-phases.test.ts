import { describe, it, expect } from "vitest";
import { fdiToUniversal, procedurePhase } from "@/lib/dentalPhases";

describe("FDI to Universal notation", () => {
  it("maps quadrant corners", () => {
    expect(fdiToUniversal(18)).toBe(1);
    expect(fdiToUniversal(11)).toBe(8);
    expect(fdiToUniversal(21)).toBe(9);
    expect(fdiToUniversal(28)).toBe(16);
    expect(fdiToUniversal(38)).toBe(17);
    expect(fdiToUniversal(31)).toBe(24);
    expect(fdiToUniversal(41)).toBe(25);
    expect(fdiToUniversal(46)).toBe(30);
    expect(fdiToUniversal(48)).toBe(32);
  });
});

describe("treatment phases", () => {
  it("puts extractions and root canals in phase 1", () => {
    expect(procedurePhase("Surgical Extraction")).toBe(1);
    expect(procedurePhase("Root Canal Treatment")).toBe(1);
  });
  it("puts fillings and scaling in phase 2", () => {
    expect(procedurePhase("Filling (O · Composite)")).toBe(2);
    expect(procedurePhase("Scaling and root planing")).toBe(2);
  });
  it("puts crowns, bridges and implants in phase 3", () => {
    expect(procedurePhase("Porcelain Crown")).toBe(3);
    expect(procedurePhase("Implant / Bridge")).toBe(3);
  });
  it("puts recalls in phase 4", () => {
    expect(procedurePhase("6-month recall check-up")).toBe(4);
  });
});
