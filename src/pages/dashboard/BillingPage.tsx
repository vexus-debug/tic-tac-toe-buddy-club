import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, CreditCard, TrendingUp, AlertCircle, Receipt,
  CalendarRange, Search, Filter, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { CreateInvoiceDialog } from "@/components/dashboard/CreateInvoiceDialog";
import { InvoiceDetailDialog } from "@/components/dashboard/InvoiceDetailDialog";
import { GenerateClientInvoiceDialog } from "@/components/dashboard/GenerateClientInvoiceDialog";
import { useInvoices, useBillingStats, type InvoiceWithPatient } from "@/hooks/useInvoices";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClaimsTable } from "@/components/dashboard/ClaimsTable";
import { summarizeAging, invoiceBalance, AGING_LABELS, type AgingBucket } from "@/lib/arAging";

const statusStyles: Record<string, string> = {
  paid:    "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  pending: "bg-red-500/10 text-red-700 border-red-500/20",
  partial: "bg-amber-500/10 text-amber-700 border-amber-500/20",
};
const statusDots: Record<string, string> = {
  paid:    "bg-emerald-500",
  pending: "bg-red-500",
  partial: "bg-amber-500",
};

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

const PAGE_SIZE = 15;

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
};

export default function BillingPage() {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithPatient | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: invoices = [], isLoading } = useInvoices();
  const { data: stats } = useBillingStats();
  const aging = useMemo(() => summarizeAging(invoices), [invoices]);


  const readyForPayment = useMemo(
    () => invoices.filter((inv: any) => inv.status === "pending" && String(inv.notes || "").startsWith("Ready for payment")),
    [invoices],
  );

  const filtered = useMemo(() => {
    let list = invoices;
    if (statusFilter !== "all") list = list.filter((inv) => inv.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (inv) => inv.patient_name.toLowerCase().includes(q) || inv.invoice_number.toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, statusFilter, search]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const billingCards = [
    {
      label: "Collected Today",
      value: stats?.collectedToday ?? 0,
      icon: TrendingUp,
      trend: "+12%", trendUp: true,
      iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600",
      bar: "linear-gradient(90deg, hsl(152,62%,40%), hsl(152,55%,58%))",
      formatter: formatCurrency,
    },
    {
      label: "Outstanding Balance",
      value: stats?.totalOutstanding ?? 0,
      icon: CreditCard,
      trend: "-3%", trendUp: false,
      iconBg: "bg-amber-500/10", iconColor: "text-amber-600",
      bar: "linear-gradient(90deg, hsl(38,88%,50%), hsl(38,82%,68%))",
      formatter: formatCurrency,
    },
    {
      label: "Overdue Invoices",
      value: stats?.overdueCount ?? 0,
      icon: AlertCircle,
      trend: "needs attention", trendUp: false,
      iconBg: "bg-red-500/10", iconColor: "text-red-600",
      bar: "linear-gradient(90deg, hsl(0,84%,56%), hsl(0,78%,72%))",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing & Payments"
        description="Manage invoices and track payments"
        tutorial={{
          title: "Billing & Payments — How to Use",
          description: "Create invoices, record payments, and track outstanding balances for your patients.",
          steps: [
            {
              title: "Understand the summary cards",
              description: "The three cards at the top show: Collected Today (cash received today), Outstanding Balance (total unpaid across all patients), and Overdue Invoices (invoices past their due date).",
            },
            {
              title: "Create an invoice",
              description: "Click 'Create Invoice' (top right). Select the patient, then add treatment line items with quantities and prices. The system calculates the subtotal, tax, and total automatically.",
              tip: "You can add multiple treatments to a single invoice. Apply a discount as a percentage or flat amount.",
            },
            {
              title: "Record a payment",
              description: "Click any invoice row to open its details. Use the 'Record Payment' section to enter the amount paid, payment method (Cash, Card, Bank Transfer), and reference number.",
            },
            {
              title: "Track partial payments",
              description: "If a patient pays in parts, the invoice status becomes 'Partial'. Record each installment until the balance reaches zero and the status changes to 'Paid'.",
            },
            {
              title: "Generate a client statement",
              description: "Click 'Client Statement' to generate a date-range summary of all invoices and payments for a specific patient — useful for sending payment summaries by email.",
            },
            {
              title: "Filter & search invoices",
              description: "Use the search bar to find invoices by patient name or invoice number. Use the status filter to view only Paid, Pending, or Partial invoices.",
            },
          ],
          nextPageHint: {
            label: "Payment Plans",
            description: "For patients who need to spread payments over time, set up a Payment Plan linked to an invoice.",
          },
        }}
      >
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setStatementOpen(true)} className="gap-1.5" data-tour="billing-statement">
            <CalendarRange className="h-4 w-4" />
            Client Statement
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 gap-1.5" onClick={() => setInvoiceOpen(true)} data-tour="billing-create-invoice">
            <FileText className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </PageHeader>

      {readyForPayment.length > 0 && (
        <Card className="border-secondary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4 text-secondary" /> Ready for payment</CardTitle>
            <CardDescription>Sent from finished visits — collect payment at the front desk.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {readyForPayment.map((inv) => (
              <button key={inv.id} type="button" onClick={() => setSelectedInvoice(inv)} className="flex items-center gap-3 rounded-lg border border-border/40 p-3 text-left hover:bg-muted/40">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(Number(inv.total_amount))}</span>
                <Button size="sm" className="h-7 text-xs" asChild><span>Collect</span></Button>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Stat Cards ── */}
      <motion.div
        className="grid gap-4 sm:grid-cols-3"
        variants={stagger.container}
        initial="hidden"
        animate="visible"
        data-tour="billing-stats"
      >
        {billingCards.map((card, i) => (
          <motion.div key={i} variants={stagger.item}>
            <Card className="stat-card bg-card overflow-hidden" style={{ "--stat-card-bar": card.bar } as any}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center ring-1 ring-border/30", card.iconBg)}>
                    <card.icon className={cn("h-5 w-5", card.iconColor)} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                    card.trendUp ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"
                  )}>
                    {card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {card.trend}
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  <AnimatedCounter value={card.value} formatter={card.formatter} />
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── A/R aging ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4" data-tour="billing-aging">
        {(Object.keys(AGING_LABELS) as AgingBucket[]).map((b) => (
          <Card key={b} className={cn("bg-card", b === "90_plus" && aging[b].amount > 0 && "border-destructive/40")}>
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{AGING_LABELS[b]}</p>
              <p className={cn("text-xl font-bold tabular-nums mt-1", b === "90_plus" && aging[b].amount > 0 ? "text-destructive" : "text-foreground")}>
                {formatCurrency(aging[b].amount)}
              </p>
              <p className="text-xs text-muted-foreground">{aging[b].count} invoice{aging[b].count === 1 ? "" : "s"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4 space-y-5">
      {/* ── Filter Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3" data-tour="billing-filters">
        <div className="relative flex-1" data-tour="billing-search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or invoice number…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-9 bg-card border-border/60 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] h-9 text-sm border-border/60">
            <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Invoice Table ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-border bg-card shadow-sm overflow-hidden" data-tour="billing-table">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[15px] font-semibold">Invoices</CardTitle>
                <CardDescription className="text-xs">
                  {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton columns={6} rows={6} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No invoices found"
                description={
                  search || statusFilter !== "all"
                    ? "Try adjusting your filters."
                    : "Create your first invoice to start tracking payments."
                }
                actionLabel={!search && statusFilter === "all" ? "Create Invoice" : undefined}
                onAction={!search && statusFilter === "all" ? () => setInvoiceOpen(true) : undefined}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/50">
                        <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">Invoice</th>
                        <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">Patient</th>
                        <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider hidden md:table-cell">Date</th>
                        <th className="py-3 px-4 text-right font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">Amount</th>
                        <th className="py-3 px-4 text-right font-semibold text-muted-foreground text-[11px] uppercase tracking-wider hidden md:table-cell">Paid</th>
                        <th className="py-3 px-4 text-right font-semibold text-muted-foreground text-[11px] uppercase tracking-wider hidden lg:table-cell">Balance</th>
                        <th className="py-3 px-4 text-left font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((inv, i) => {
                        const balance = invoiceBalance(inv);
                        return (
                          <motion.tr
                            key={inv.id}
                            className={cn(
                              "border-b border-border/30 last:border-0 hover:bg-muted/30 cursor-pointer transition-all duration-150 group",
                              i % 2 === 0 ? "bg-card" : "bg-muted/10"
                            )}
                            onClick={() => setSelectedInvoice(inv)}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                          >
                            <td className="py-3 px-4 font-mono text-xs text-primary font-semibold">{inv.invoice_number}</td>
                            <td className="py-3 px-4 font-medium text-foreground group-hover:text-primary transition-colors">{inv.patient_name}</td>
                            <td className="py-3 px-4 hidden md:table-cell text-muted-foreground font-mono text-xs">{inv.invoice_date}</td>
                            <td className="py-3 px-4 font-bold text-right tabular-nums">{formatCurrency(inv.total_amount)}</td>
                            <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-right tabular-nums">{formatCurrency(inv.amount_paid)}</td>
                            <td className="py-3 px-4 hidden lg:table-cell text-right font-semibold tabular-nums">
                              <span className={balance > 0 ? "text-destructive" : "text-emerald-600"}>
                                {formatCurrency(balance)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
                                statusStyles[inv.status] || ""
                              )}>
                                <span className={cn("h-1.5 w-1.5 rounded-full", statusDots[inv.status] || "")} />
                                {inv.status}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                    <p className="text-xs text-muted-foreground">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8 border-border/60" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pg = i + 1;
                        return (
                          <Button
                            key={pg}
                            variant={pg === currentPage ? "default" : "outline"}
                            size="icon"
                            className={cn("h-8 w-8 text-xs border-border/60", pg === currentPage && "bg-primary text-primary-foreground")}
                            onClick={() => setPage(pg)}
                          >
                            {pg}
                          </Button>
                        );
                      })}
                      <Button variant="outline" size="icon" className="h-8 w-8 border-border/60" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
        </TabsContent>
        <TabsContent value="claims" className="mt-4">
          <ClaimsTable />
        </TabsContent>
      </Tabs>

      <CreateInvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} />
      <InvoiceDetailDialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)} invoice={selectedInvoice} />
      <GenerateClientInvoiceDialog open={statementOpen} onOpenChange={setStatementOpen} />
    </div>
  );
}
