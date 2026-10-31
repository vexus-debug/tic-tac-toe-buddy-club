import { describe, it, expect } from "vitest";
import { resolveFee, tierPrice, surchargeAmount, clinicalDomain } from "@/lib/labCatalog";

describe("lab catalogue pricing", () => {
  it("custom clinic price wins over tier and catalogue", () => expect(resolveFee(80, 100, 10)).toBe(80));
  it("tier discount applies to catalogue price", () => expect(resolveFee(null, 100, 10)).toBe(90));
  it("falls back to catalogue price without tier", () => expect(resolveFee(null, 100, null)).toBe(100));
  it("no tier price without a catalogue price", () => expect(tierPrice(null, 10)).toBeNull());
  it("percent surcharge is a share of the case fee", () =>
    expect(surchargeAmount(200, { amount: 50, data: { charge_type: "Percent of case fee" } })).toBe(100));
  it("flat surcharge adds its amount", () => expect(surchargeAmount(200, { amount: 25, data: { charge_type: "Flat fee" } })).toBe(25));
  it("old categories map to clinical domains", () => {
    expect(clinicalDomain("Fixed")).toBe("Fixed Prosthetics");
    expect(clinicalDomain("Appliance")).toBe("Orthodontics & Splints");
  });
});
