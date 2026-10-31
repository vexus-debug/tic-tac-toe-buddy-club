import { describe, it, expect } from "vitest";
import { DOSING_DRUGS, calcDose } from "@/lib/dentalDosing";
const amox = DOSING_DRUGS.find((d) => d.name === "Amoxicillin")!;
describe("weight dosing", () => {
  it("amoxicillin 20kg = 300mg", () => expect(calcDose(amox, 20).doseMg).toBe(300));
  it("caps at adult max", () => expect(calcDose(amox, 80).doseMg).toBe(500));
});
