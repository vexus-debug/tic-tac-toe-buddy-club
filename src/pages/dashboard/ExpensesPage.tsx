import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { usePatients } from "@/hooks/usePatients";
import { useInvoices } from "@/hooks/useInvoices";
import { nextDueDate, inferFrequency, type ExpenseFrequency } from "@/lib/billingDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign, Search, TrendingDown, Repeat, User, FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useExpenses, useCreateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { format } from "date-fns";

const baseExpenseCategories = [
  "supplies", "rent", "utilities", "equipment", "salaries", "marketing", "maintenance",
  "logistics", "lab_outsourcing", "staff_appraisal", "loan_repayment",
];

function formatCategory(value: string) {
  return value.replace(/_/g, " ");
}

export default function ExpensesPage() {
  const terms = useClinicTerms();
  const expenseCategories = [...baseExpenseCategories, terms.consumablesCategory, "other"];
  const { data: expenses = [] } = useExpenses();
  const { data: patients = [] } = usePatients();
  const { data: invoices = [] } = useInvoices();
  const { user } = useAuth();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const emptyForm = () => ({
    vendor: "", category: "other", description: "", amount: "",
    expense_date: format(new Date(), "yyyy-MM-dd"), payment_method: "cash", receipt_reference: "",
    patient_id: "none", invoice_id: "none", frequency: "none" as ExpenseFrequency,
  });
  const [form, setForm] = useState(emptyForm);

  const patientName = useMemo(() => {
    const m: Record<string, string> = {};
    (patients as any[]).forEach((p) => { m[p.id] = `${p.first_name} ${p.last_name}`; });
    return m;
  }, [patients]);
  const invoiceNumber = useMemo(() => {
    const m: Record<string, string> = {};
    (invoices as any[]).forEach((i) => { m[i.id] = i.invoice_number; });
    return m;
  }, [invoices]);
  const patientInvoices = (invoices as any[]).filter((i) => form.patient_id === "none" || i.patient_id === form.patient_id);

  const filtered = expenses.filter((e: any) => {
    const q = search.toLowerCase();
    const matchSearch = (e.vendor || "").toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || (e.patient_id && patientName[e.patient_id]?.toLowerCase().includes(q));
    const matchCat = catFilter === "all" || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const thisMonth = expenses.filter((e: any) => e.expense_date?.startsWith(format(new Date(), "yyyy-MM"))).reduce((s: number, e: any) => s + Number(e.amount), 0);

  const handleSubmit = () => {
    if (!form.vendor || !form.amount) return;
    const description = [form.description.trim(), form.receipt_reference.trim() ? `Receipt: ${form.receipt_reference.trim()}` : ""].filter(Boolean).join(" · ");
    createExpense.mutate({
      vendor: form.vendor,
      category: form.category,
      description: description || null,
      amount: Number(form.amount),
      expense_date: form.expense_date,
      payment_method: form.payment_method,
      patient_id: form.patient_id === "none" ? null : form.patient_id,
      invoice_id: form.invoice_id === "none" ? null : form.invoice_id,
      is_recurring: form.frequency !== "none",
      next_due_date: nextDueDate(form.expense_date, form.frequency),
      created_by: user?.id,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm(emptyForm());
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track clinic expenses and outgoings"
        tutorial={{
          title: "Expenses — How to Use",
          description: "Record and categorise all clinic expenses to track spending and calculate true profitability.",
          steps: [
            {
              title: "View expense history",
              description: "All recorded expenses appear in the table sorted by date. Each entry shows the amount, category, vendor, payment method, and description.",
            },
            {
              title: "Add a new expense",
              description: "Click 'Add Expense'. Select the category (Supplies, Utilities, Salaries, Rent, Lab Fees, etc.), enter the vendor name, amount, payment method, and date.",
              tip: "Categorise accurately — this powers the expense breakdown charts in the Profitability and Reports pages.",
            },
            {
              title: "Upload receipts",
              description: "Attach a receipt image or PDF to each expense for auditing and accounting purposes. Click the receipt upload field in the expense form.",
            },
            {
              title: "Filter by category or date",
              description: "Use the filter controls to view expenses by category (e.g. only Lab Fees) or within a specific date range. This helps with monthly budget reviews.",
            },
            {
              title: "Review totals",
              description: "The summary at the top shows total expenses for the selected period. Compare this with your revenue on the Reports page to calculate net profit.",
            },
          ],
          nextPageHint: {
            label: "Profitability",
            description: "Visit the Profitability page to see revenue vs expenses side by side with profit margin analysis.",
          },
        }}
      >
        <Button onClick={() => setDialogOpen(true)} className="bg-secondary hover:bg-secondary/90" data-tour="expenses-add">
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2" data-tour="expenses-stats">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center"><TrendingDown className="h-6 w-6 text-red-600" /></div>
              <div>
                <p className="text-2xl font-bold">₦{totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <Card className="glass-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center"><DollarSign className="h-6 w-6 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold">₦{thisMonth.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap" data-tour="expenses-filters">
        <div className="relative flex-1 min-w-[200px]" data-tour="expenses-search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px]" data-tour="expenses-category-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {expenseCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{formatCategory(c)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card" data-tour="expenses-table">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No expenses found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2 px-4 text-left font-medium text-muted-foreground">Date</th>
                  <th className="py-2 px-4 text-left font-medium text-muted-foreground">Vendor</th>
                  <th className="py-2 px-4 text-left font-medium text-muted-foreground">Category</th>
                  <th className="py-2 px-4 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="py-2 px-4 text-left font-medium text-muted-foreground">Method</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="py-2 px-4 text-muted-foreground">{e.expense_date}</td>
                    <td className="py-2 px-4 font-medium">
                      {e.vendor}
                      {(e.patient_id || e.invoice_id || e.is_recurring) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {e.patient_id && <Badge variant="secondary" className="text-[10px] gap-1"><User className="h-3 w-3" />{patientName[e.patient_id] || "Patient"}</Badge>}
                          {e.invoice_id && <Badge variant="outline" className="text-[10px] gap-1 font-mono"><FileText className="h-3 w-3" />{invoiceNumber[e.invoice_id] || "Invoice"}</Badge>}
                          {e.is_recurring && <Badge variant="outline" className="text-[10px] gap-1 capitalize border-primary/30 text-primary"><Repeat className="h-3 w-3" />{inferFrequency(e.expense_date, e.next_due_date, true)}{e.next_due_date ? ` · next ${e.next_due_date}` : ""}</Badge>}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-4"><Badge variant="outline" className="text-[10px] capitalize">{formatCategory(e.category)}</Badge></td>
                    <td className="py-2 px-4 font-medium text-destructive">₦{Number(e.amount).toLocaleString()}</td>
                    <td className="py-2 px-4 text-muted-foreground capitalize">{e.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Vendor *</Label>
                <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{formatCategory(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Payment Method</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Receipt Ref</Label>
                <Input value={form.receipt_reference} onChange={e => setForm(f => ({ ...f, receipt_reference: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Linked patient (optional)</Label>
                <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v, invoice_id: "none" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(patients as any[]).map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Linked invoice (optional)</Label>
                <Select value={form.invoice_id} onValueChange={v => setForm(f => ({ ...f, invoice_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {patientInvoices.map(i => <SelectItem key={i.id} value={i.id}>{i.invoice_number}{form.patient_id === "none" && i.patient_name ? ` — ${i.patient_name}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="exp-recurring" className="text-xs">Recurring expense</Label>
                <Switch id="exp-recurring" checked={form.frequency !== "none"} onCheckedChange={c => setForm(f => ({ ...f, frequency: c ? "monthly" : "none" }))} />
              </div>
              {form.frequency !== "none" && (
                <div className="flex items-center gap-3">
                  <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v as ExpenseFrequency }))}>
                    <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Next due {nextDueDate(form.expense_date, form.frequency)}</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-secondary hover:bg-secondary/90" disabled={createExpense.isPending}>
              {createExpense.isPending ? "Saving..." : "Save Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
