import { describe, it, expect } from "vitest";
import { expandMacro, SOAP_MACROS } from "@/lib/soapMacros";

describe("SOAP dot macros", () => {
  it("expands .endo-prep at end of text", () => {
    expect(expandMacro("Tooth 36. .endo-prep")).toBe("Tooth 36. " + SOAP_MACROS["endo-prep"] + " ");
  });
  it("ignores unknown macros", () => {
    expect(expandMacro("note .unknown")).toBeNull();
  });
  it("does not expand mid-word dots", () => {
    expect(expandMacro("file.endo-prep")).toBeNull();
  });
});
