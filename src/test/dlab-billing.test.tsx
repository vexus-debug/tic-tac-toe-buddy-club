import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { allocateOldestFirst, applyCredit, bucketTotals, dueDateOf, overdueDays, type AgingInvoice } from "@/lib/labAging";

vi.mock("@/hooks/useLabRecords", () => ({
  useLabRecords: () => ({ data: [], isLoading: false }),
  useSaveLabRecord: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteLabRecord: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/useLabInvoices", () => ({ useLabInvoices: () => ({ data: [] }) }));
vi.mock("@/hooks/useOrg", () => ({ useOrg: () => ({ currentOrg: null }) }));
vi.mock("@/pages/dashboard/dlab/dlabMoney", () => ({
  useClientSummaries: () => ({ data: [], cases: [], payments: [], credits: [], invoices: [], isLoading: false }),
  money: (n: number) => `₦${n}`,
  sameClient: () => true,
}));
vi.mock("@/pages/dashboard/dlab/dlabLinks", () => ({ clientKey: (s: string) => s.toLowerCase(), useLabClientNames: () => [], applyToInvoice: vi.fn() }));
vi.mock("@/hooks/useDentalLab", () => ({ clientOf: () => "" }));
vi.mock("@/pages/dashboard/dlab/DlabInvoicesPage", () => ({ default: () => <div>Invoices list</div> }));
vi.mock("@/pages/dashboard/dlab/LabRegisterPage", () => ({ default: () => <div>Register</div> }));

import DlabBillingPage from "@/pages/dashboard/dlab/DlabBillingPage";

describe("DlabBillingPage", () => {
  it("has two tabs and the four aging cards", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/app/clinic/demo/dlab/billing"]}>
          <DlabBillingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Invoices", "Payments & Credits"]);
    expect(screen.getByText("Invoices list")).toBeInTheDocument();
    for (const l of ["Current", "31–60d", "61–90d", "90d+"]) expect(screen.getByText(l)).toBeInTheDocument();
  });
});

const inv = (id: string, invoice_date: string, total: number, paid = 0): AgingInvoice => ({ id, client: "A", invoice_date, total, paid });
const today = new Date(2026, 9, 31);

describe("billing maths", () => {
  it("due date is invoice date + 30 days", () => {
    expect(dueDateOf("2026-10-01")).toBe("2026-10-31");
  });
  it("overdue days count from the due date, zero when paid", () => {
    expect(overdueDays(inv("1", "2026-09-01", 100), today)).toBe(30);
    expect(overdueDays(inv("2", "2026-09-01", 100, 100), today)).toBe(0);
  });
  it("lump sum pays the oldest invoice first and leaves credit", () => {
    const r = allocateOldestFirst(250, [inv("new", "2026-10-20", 100), inv("old", "2026-08-01", 200, 50)]);
    expect(r.allocations).toEqual([{ invoice_id: "old", amount_applied: 150 }, { invoice_id: "new", amount_applied: 100 }]);
    expect(r.unallocated).toBe(0);
    expect(allocateOldestFirst(400, [inv("x", "2026-10-01", 100)]).unallocated).toBe(300);
  });
  it("partial balances land in the right aging bucket", () => {
    const t = bucketTotals([inv("a", "2026-10-15", 100, 40), inv("b", "2026-07-01", 80)], today);
    expect(t.current).toEqual({ amount: 60, count: 1 });
    expect(t["90_plus"]).toEqual({ amount: 80, count: 1 });
  });
  it("credit on account is deducted from open invoices", () => {
    const r = applyCredit(50, [inv("a", "2026-10-01", 30), inv("b", "2026-10-05", 100)]);
    expect(r.allocations).toEqual([{ invoice_id: "a", amount_applied: 30 }, { invoice_id: "b", amount_applied: 20 }]);
  });
});
