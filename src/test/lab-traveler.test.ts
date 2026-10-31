import { describe, it, expect } from "vitest";
import { code128Values, code128Svg } from "@/lib/code128";
import { travelerHtml } from "@/lib/printTraveler";

describe("Code 128 barcode", () => {
  it("encodes with start B, correct checksum and stop", () => {
    // "AB": A=33, B=34; checksum = (104 + 33*1 + 34*2) % 103 = 102
    expect(code128Values("AB")).toEqual([104, 33, 34, 102, 106]);
  });
  it("rejects unsupported characters", () => {
    expect(() => code128Values("é")).toThrow();
  });
  it("renders an svg", () => {
    expect(code128Svg("CAS-0001")).toContain("<svg");
  });
});

describe("Pan traveler", () => {
  const base = { labName: "Lab", case_number: "CAS-0001", clinic: "C", patient: "P", work_type: "Crown", teeth: ["14"], rush: false };
  it("shows RUSH banner only for rush cases", () => {
    expect(travelerHtml({ ...base, rush: true })).toContain('class="rush"');
    expect(travelerHtml(base)).not.toContain('class="rush"');
  });
  it("escapes instructions", () => {
    expect(travelerHtml({ ...base, instructions: "<script>x</script>" })).toContain("&lt;script&gt;x");
  });
});
