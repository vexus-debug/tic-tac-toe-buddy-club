import { describe, it, expect } from "vitest";
import { agingBucket, daysOutstanding, invoiceBalance, summarizeAging, canAdjustInvoices } from "@/lib/arAging";

const today = new Date(2026, 9, 29);

describe("A/R aging", () => {
  it("buckets by 30/60/90 day boundaries", () => {
    expect(agingBucket(30)).toBe("current");
    expect(agingBucket(31)).toBe("31_60");
    expect(agingBucket(60)).toBe("31_60");
    expect(agingBucket(61)).toBe("61_90");
    expect(agingBucket(90)).toBe("61_90");
    expect(agingBucket(91)).toBe("90_plus");
  });

  it("counts days from invoice date", () => {
    expect(daysOutstanding("2026-09-29", today)).toBe(30);
  });

  it("subtracts payments and adjustments from balance", () => {
    expect(invoiceBalance({ total_amount: 10000, amount_paid: 3000, adjustments_total: 2000 })).toBe(5000);
    expect(invoiceBalance({ total_amount: 1000, amount_paid: 1500 })).toBe(0);
  });

  it("skips settled invoices in the summary", () => {
    const s = summarizeAging([
      { invoice_date: "2026-10-20", total_amount: 5000, amount_paid: 5000 },
      { invoice_date: "2026-06-01", total_amount: 8000, amount_paid: 1000 },
    ], today);
    expect(s.current.count).toBe(0);
    expect(s["90_plus"].amount).toBe(7000);
  });

  it("only owner/admin/manager/accountant can adjust", () => {
    expect(canAdjustInvoices("accountant")).toBe(true);
    expect(canAdjustInvoices("receptionist")).toBe(false);
  });
});
