import { describe, it, expect } from "vitest";
import { nextStage, prevStage, blockedReason, parseTeeth, splitLegacyTeeth } from "@/lib/labWorkflow";

describe("lab workflow", () => {
  it("steps through stages in fixed order", () => {
    expect(nextStage("pending")).toBe("design");
    expect(nextStage("delivered")).toBeNull();
    expect(prevStage("pending")).toBeNull();
    expect(prevStage("ready")).toBe("qc");
  });
  it("blocks qc -> ready unless QC passed", () => {
    expect(blockedReason("qc", "ready", "pending")).not.toBeNull();
    expect(blockedReason("qc", "ready", "passed")).toBeNull();
    expect(blockedReason("design", "delivered", null)).not.toBeNull();
    expect(blockedReason("design", "milling", null)).toBeNull();
  });
  it("blocks moving held cases", () => {
    expect(blockedReason("on_hold", "design", "passed")).not.toBeNull();
  });
  it("parses teeth and preserves legacy notation", () => {
    expect(parseTeeth("#14, #15 11 14")).toEqual(["14", "15", "11"]);
    expect(splitLegacyTeeth("Teeth: #14, #15\nUse A2")).toEqual({ teeth: ["14", "15"], rest: "Use A2" });
  });
});
