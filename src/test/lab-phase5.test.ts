import { describe, it, expect } from "vitest";
import { verdictHoldReason, scanFileType, canRunMove, runFill, sinterWarnings, casesAlreadyQueued } from "@/lib/labCam";

const u = (o: any) => ({ case_id: "a", case_number: "LC-1", units: 1, ...o });

describe("lab phase 5 CAD/CAM rules", () => {
  it("a verified scan does not hold the case", () => {
    expect(verdictHoldReason("verified")).toBeNull();
  });
  it("missing bite puts the case on hold with the note", () => {
    expect(verdictHoldReason("missing_bite", "no left side")).toBe("Missing bite scan: no left side");
  });
  it("guesses scan file types from names", () => {
    expect(scanFileType("Patient_UpperJaw.stl")).toBe("Upper arch");
    expect(scanFileType("lower.stl")).toBe("Lower arch");
    expect(scanFileType("BuccalBite.ply")).toBe("Bite");
    expect(scanFileType("ScanBody_36.stl")).toBe("Scan body");
  });
  it("runs go staged → running → completed, never backwards", () => {
    expect(canRunMove("staged", "running")).toBe(true);
    expect(canRunMove("running", "completed")).toBe(true);
    expect(canRunMove("completed", "running")).toBe(false);
    expect(canRunMove("staged", "completed")).toBe(false);
  });
  it("disc fill counts units and flags overfill", () => {
    expect(runFill([u({ units: 3 }), u({ units: 11 })], 20)).toMatchObject({ used: 14, left: 6, pct: 70, over: false });
    expect(runFill([u({ units: 21 })], 20).over).toBe(true);
  });
  it("speed sintering warns on 3+ unit bridges", () => {
    expect(sinterWarnings("speed", [u({ units: 3 })])).toHaveLength(1);
    expect(sinterWarnings("overnight", [u({ units: 3 })])).toEqual([]);
  });
  it("mixed sintering curves must be split", () => {
    expect(sinterWarnings("standard", [u({ sinter: "HT 1450" }), u({ sinter: "UT 1530" })])).toContain("Units need different sintering curves — split them into separate cycles");
  });
  it("a case already on an active mill run is not queued again", () => {
    const runs = [
      { id: "r1", status: "running", data: { equipment: "mill", units: [u({ case_id: "x" })] } },
      { id: "r2", status: "completed", data: { equipment: "mill", units: [u({ case_id: "y" })] } },
    ];
    expect([...casesAlreadyQueued(runs, "mill")]).toEqual(["x"]);
  });
});
