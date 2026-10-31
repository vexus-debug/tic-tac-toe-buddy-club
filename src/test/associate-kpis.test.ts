import { describe, it, expect } from "vitest";
import { associateKpis, calculatePayStatement, type ProducedLine } from "@/lib/associatePay";

const line = (o: Partial<ProducedLine>): ProducedLine => ({
  id: "l1", invoice_id: "i1", invoice_date: "2026-10-01", patient_id: null, description: "Crown",
  line_total: 100000, invoice_subtotal: 100000, invoice_discount: 0, invoice_total: 100000, invoice_paid: 50000, ...o,
});
const contract = { compensation_basis: "collections" as const, commission_rate: 40, lab_fee_share: 50, daily_minimum: 30000 };

describe("associate portal KPIs", () => {
  it("collections ratio is net over gross production", () => {
    const s = calculatePayStatement(contract, [line({})], []);
    expect(associateKpis(s, contract.daily_minimum).collectionsRatio).toBe(50);
  });
  it("draw balance is earnings after lab fees minus the daily draw", () => {
    const s = calculatePayStatement(contract, [line({})], [{ id: "lab", date: "2026-10-01", patient_id: null, description: "Zirconia", lab_fee: 10000 }]);
    // 40% of 50,000 = 20,000; minus 5,000 lab share; minus 30,000 draw for 1 day
    expect(associateKpis(s, contract.daily_minimum).drawBalance).toBe(-15000);
  });
  it("split lines credit only the attributed share", () => {
    const s = calculatePayStatement({ ...contract, compensation_basis: "production" }, [line({ attribution: 60 })], []);
    expect(associateKpis(s, 0).netProduction).toBe(60000);
  });
});
