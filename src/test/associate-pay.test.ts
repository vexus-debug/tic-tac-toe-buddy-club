import { describe, it, expect } from "vitest";
import { calculatePayStatement, type ProducedLine } from "@/lib/associatePay";

const line = (o: Partial<ProducedLine>): ProducedLine => ({
  id: "l1", invoice_id: "i1", invoice_date: "2026-10-01", patient_id: null, description: "Filling",
  line_total: 100000, invoice_subtotal: 100000, invoice_discount: 0, invoice_total: 100000, invoice_paid: 0, ...o,
});
const base = { compensation_basis: "production" as const, commission_rate: 35, lab_fee_share: 50, daily_minimum: 0 };

describe("associate pay", () => {
  it("pays commission % on net production", () => {
    expect(calculatePayStatement(base, [line({})], []).totalPayable).toBe(35000);
  });
  it("removes invoice discount before commission", () => {
    const s = calculatePayStatement(base, [line({ invoice_discount: 20000, invoice_total: 80000 })], []);
    expect(s.netProduction).toBe(80000);
    expect(s.totalPayable).toBe(28000);
  });
  it("collections basis only pays on what was collected", () => {
    const s = calculatePayStatement({ ...base, compensation_basis: "collections" }, [line({ invoice_paid: 50000 })], []);
    expect(s.totalPayable).toBe(17500);
  });
  it("deducts the dentist's share of lab fees", () => {
    const s = calculatePayStatement(base, [line({})], [{ id: "c", date: "2026-10-02", patient_id: null, description: "Crown", lab_fee: 30000 }]);
    expect(s.labDeductions).toBe(15000);
    expect(s.totalPayable).toBe(20000);
  });
  it("tops up to the daily minimum per working day", () => {
    const s = calculatePayStatement({ ...base, daily_minimum: 50000 }, [line({}), line({ id: "l2", invoice_date: "2026-10-02", line_total: 0 })], []);
    expect(s.daysWorked).toBe(2);
    expect(s.guaranteeTopUp).toBe(65000);
    expect(s.totalPayable).toBe(100000);
  });
  it("credits only the dentist's split share of a co-provided line", () => {
    const s = calculatePayStatement(base, [line({ attribution: 60 })], []);
    expect(s.grossProduction).toBe(60000);
    expect(s.totalPayable).toBe(21000);
  });
});

describe("tiered commission (30% to 10k, 35% 10k–20k, 40% above, on net)", async () => {
  const { tieredCommission, calculatePayStatement } = await import("@/lib/associatePay");
  const tiers = [{ up_to: 10000, rate: 30 }, { up_to: 20000, rate: 35 }, { up_to: null, rate: 40 }];
  it("10,000 net earns 3,000", () => expect(tieredCommission(10000, tiers, 0)).toBe(3000));
  it("20,000 net earns 6,500", () => expect(tieredCommission(20000, tiers, 0)).toBe(6500));
  it("25,000 net earns 8,500", () => expect(tieredCommission(25000, tiers, 0)).toBe(8500));
  it("no tiers uses the flat rate", () => expect(tieredCommission(1000, [], 35)).toBe(350));
  it("statement crosses brackets across lines", () => {
    const line = (id: string, total: number) => ({ id, invoice_id: id, invoice_date: "2026-10-01", patient_id: null, description: id, line_total: total, invoice_subtotal: total, invoice_discount: 0, invoice_total: total, invoice_paid: total });
    const s = calculatePayStatement({ compensation_basis: "production", commission_rate: 0, lab_fee_share: 0, daily_minimum: 0, commission_tiers: tiers }, [line("a", 15000), line("b", 10000)], []);
    expect(s.commissionEarned).toBe(8500);
    expect(s.lines[0].earned_amount).toBe(4750);
  });
});
