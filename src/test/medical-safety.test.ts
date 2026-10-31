import { describe, it, expect } from "vitest";
import { checkPrescriptionConflicts, detectMedicalAlerts } from "@/lib/medicalSafety";

describe("prescription allergy hard-stop", () => {
  it("blocks amoxicillin for a penicillin-allergic patient", () => {
    const c = checkPrescriptionConflicts(["Amoxicillin 500mg"], "Penicillin");
    expect(c).toHaveLength(1);
    expect(c[0].severity).toBe("allergy");
  });
  it("allows azithromycin for a penicillin-allergic patient", () => {
    expect(checkPrescriptionConflicts(["Azithromycin 500mg"], "Penicillin")).toHaveLength(0);
  });
  it("flags ibuprofen for a patient on warfarin", () => {
    const c = checkPrescriptionConflicts(["Ibuprofen 400mg"], "", "On warfarin for AF");
    expect(c.some((x) => x.severity === "caution")).toBe(true);
  });
});

describe("medical alerts", () => {
  it("detects pregnancy and diabetes from history", () => {
    expect(detectMedicalAlerts("Type 2 diabetic, currently pregnant")).toEqual(["Diabetes", "Pregnant"]);
  });
});

import { toggleAlertInHistory } from "@/lib/medicalSafety";
describe("structured intake tags", () => {
  it("adds and removes a medical alert from history", () => {
    const on = toggleAlertInHistory("Asthma since childhood", "Bisphosphonates");
    expect(detectMedicalAlerts(on)).toContain("Bisphosphonates");
    expect(detectMedicalAlerts(toggleAlertInHistory(on, "Bisphosphonates"))).not.toContain("Bisphosphonates");
  });
});

describe("phase 5 systemic checks", () => {
  it("flags ibuprofen with peptic ulcer", () => {
    expect(checkPrescriptionConflicts(["Ibuprofen 400mg"], "", "Peptic ulcer").length).toBeGreaterThan(0);
  });
  it("flags lidocaine with adrenaline in hypertension", () => {
    expect(checkPrescriptionConflicts(["Lidocaine with adrenaline"], "", "Hypertension").length).toBeGreaterThan(0);
  });
});
