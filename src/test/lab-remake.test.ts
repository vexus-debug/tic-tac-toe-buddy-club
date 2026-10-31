import { describe, it, expect } from "vitest";
import { nextRemakeNumber, remakeFee, hasOpenRemake, remakeRateBy } from "@/lib/labRemake";

describe("lab remakes", () => {
  it("first remake gets -R1", () => {
    expect(nextRemakeNumber("LC-2026-0042", ["LC-2026-0042"])).toBe("LC-2026-0042-R1");
  });
  it("remaking a remake continues the series (-R2)", () => {
    expect(nextRemakeNumber("LC-2026-0042-R1", ["LC-2026-0042", "LC-2026-0042-R1"])).toBe("LC-2026-0042-R2");
  });
  it("only clinic-fault remakes are billed", () => {
    expect(remakeFee("clinic", 50000)).toBe(50000);
    expect(remakeFee("lab", 50000)).toBe(0);
    expect(remakeFee("material", 50000)).toBe(0);
  });
  it("blocks a second remake while one is still open", () => {
    expect(hasOpenRemake("a", [{ parent_case_id: "a", status: "design" }])).toBe(true);
    expect(hasOpenRemake("a", [{ parent_case_id: "a", status: "delivered" }])).toBe(false);
  });
  it("remake rate per clinic", () => {
    const cases = [{ k: "A" }, { k: "A" }, { k: "A" }, { k: "A" }, { k: "B" }];
    expect(remakeRateBy(cases, [{ k: "A" }], (c) => c.k)).toEqual([{ name: "A", remakes: 1, total: 4, pct: 25 }]);
  });
});
