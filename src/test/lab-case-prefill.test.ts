import { describe, it, expect } from "vitest";
import { pickDefaultDentist, latestClinicalNote, isLabCaseActive } from "@/lib/labCasePrefill";

const dentists = [{ id: "d1", user_id: "u1" }, { id: "d2", user_id: "u2" }];

describe("lab case pre-fill", () => {
  it("uses the signed-in dentist first", () => {
    expect(pickDefaultDentist(dentists, "u2", [{ dentistId: "d1" }])).toBe("d2");
  });
  it("falls back to the patient's most recent attending dentist for non-dentist staff", () => {
    expect(pickDefaultDentist(dentists, "receptionist", [{ dentistId: "d1" }, { dentistId: "d2" }])).toBe("d1");
  });
  it("skips visits by staff who are not dentists", () => {
    expect(pickDefaultDentist(dentists, undefined, [{ dentistId: "hyg" }, { dentistId: "d2" }])).toBe("d2");
  });
  it("leaves the clinician blank when there is no history", () => {
    expect(pickDefaultDentist(dentists, "x", [])).toBe("");
  });
  it("carries the latest non-empty clinical note", () => {
    expect(latestClinicalNote([{ notes: "  " }, { notes: "Prep #14 done" }])).toBe("Prep #14 done");
  });
  it("delivered cases are not active", () => {
    expect(isLabCaseActive({ status: "delivered" })).toBe(false);
    expect(isLabCaseActive({ status: "ready" })).toBe(true);
  });
});
