import { describe, it, expect } from "vitest";
import { shadeRecipe } from "@/lib/labCatalog";

describe("shade recipe on the bench", () => {
  it("case stratification overrides the library entry", () => {
    const r = shadeRecipe({ stump: "ND3", body: "A3" }, { guide: "VITA Classical", body: "A2", incisal: "T1" });
    expect(r.line).toBe("VITA Classical · Stump ND3 · Body A3 · Incisal T1");
  });
  it("shows the library firing notes", () => {
    expect(shadeRecipe({}, { recipe: "Glaze 770°C" }).firing).toBe("Glaze 770°C");
  });
  it("empty when nothing is recorded", () => {
    expect(shadeRecipe(null, null)).toEqual({ line: "", firing: "" });
  });
});
