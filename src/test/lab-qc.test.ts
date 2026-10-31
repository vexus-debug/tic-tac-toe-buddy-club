import { describe, it, expect } from "vitest";
import { qcOutcome, isComplete, suggestRework, QC_POINTS } from "@/lib/labQc";

const allPass = Object.fromEntries(QC_POINTS.map((p) => [p.key, p.pass]));

describe("lab QC", () => {
  it("has a 6-point checklist", () => expect(QC_POINTS).toHaveLength(6));
  it("passing every point sends the case to Ready to Ship", () => {
    expect(qcOutcome(allPass)).toMatchObject({ status: "ready", qc_status: "passed" });
  });
  it("a failure sends the case back to the chosen stage as rework", () => {
    expect(qcOutcome({ ...allPass, shade: "Dark" }, "milling")).toMatchObject({ status: "milling", qc_status: "rework_needed" });
  });
  it("suggests CAD redesign for margin failures and re-glaze for shade", () => {
    expect(suggestRework({ ...allPass, margins: "Fail" })).toBe("design");
    expect(suggestRework({ ...allPass, shade: "Light" })).toBe("ceramics");
  });
  it("pending disinfection keeps the case in QC", () => {
    expect(qcOutcome({ ...allPass, disinfection: "Pending" })).toMatchObject({ status: "qc", qc_status: "pending" });
  });
  it("requires every point answered", () => {
    expect(isComplete({ margins: "Pass" })).toBe(false);
    expect(isComplete(allPass)).toBe(true);
  });
});
