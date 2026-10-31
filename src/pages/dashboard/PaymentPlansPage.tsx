import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { usePaymentPlans, usePlanInstallments, useCreatePaymentPlan, useMarkInstallmentPaid } from "@/hooks/usePaymentPlans";
import { useInvoices } from "@/hooks/useInvoices";
import { CreditCard, Calendar, CheckCircle2, Clock, Plus, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const statusStyles: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  defaulted: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  pending: "bg-muted text-muted-foreground",
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function PaymentPlansPage() {
  const { data: plans = [] } = usePaymentPlans();
  const { data: invoices = [] } = useInvoices();
  const createPlan = useCreatePaymentPlan();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const [form, setForm] = useState({
    invoice_id: "",
    installment_count: "3",
    frequency: "monthly",
    start_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const activePlans = plans.filter((p: any) => p.status === "active");
  const totalOutstanding = activePlans.reduce((s: number, p: any) => {
    const paid = plans.find((pp: any) => pp.id === p.id);
    return s + Number(p.total_amount);
  }, 0);

  const pendingInvoices = invoices.filter((inv) => inv.status === "pending" || inv.status === "partial");

  const handleCreate = () => {
    const invoice = invoices.find((i) => i.id === form.invoice_id);
    if (!invoice) return;
    createPlan.mutate({
      invoice_id: form.invoice_id,
      patient_id: invoice.patient_id,
      total_amount: invoice.total_amount,
      installment_count: parseInt(form.installment_count) || 3,
      frequency: form.frequency,
      start_date: form.start_date,
      notes: form.notes,
    }, { onSuccess: () => { setCreateOpen(false); setForm({ invoice_id: "", installment_count: "3", frequency: "monthly", start_date: format(new Date(), "yyyy-MM-dd"), notes: "" }); } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Plans"
        description="Manage installment-based payment schedules"
        tutorial={{
          title: "Payment Plans — How to Use",
          description: "Set up structured payment schedules for patients who need to pay for their treatment in installments.",
          steps: [
            {
              title: "When to use payment plans",
              description: "Payment plans are for patients who cannot pay a large invoice in full at once. You agree on a number of installments and a schedule (weekly, bi-weekly, monthly).",
              tip: "Always create the invoice on the Billing page first, then link it to a payment plan here.",
            },
            {
              title: "Create a new payment plan",
              description: "Click 'Create Plan'. Select the patient, link an existing invoice, set the total amount, number of installments, frequency (monthly, weekly), and start date.",
            },
            {
              title: "Installment schedule",
              description: "After creating the plan, the system automatically generates the installment schedule with individual due dates and amounts. Review these with the patient before confirming.",
            },
            {
              title: "Record installment payments",
              description: "When the patient makes a payment, click on the plan to open it, then mark the relevant installment as paid. Record the payment method and reference number.",
            },
            {
              title: "Monitor plan status",
              description: "Plans show their overall status: Active (ongoing), Completed (fully paid), or Defaulted (payments are overdue). Follow up with patients whose plans are overdue.",
            },
          ],
          nextPageHint: {
            label: "Billing & Payments",
            description: "View the linked invoice on the Billing page to see the complete payment history for the patient.",
          },
        }}
      >
        <Button size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => setCreateOpen(true)} data-tour="payment-plans-create">
          <Plus className="mr-2 h-4 w-4" /> Create Plan
        </Button>
      </PageHeader>

      <motion.div className="grid gap-4 sm:grid-cols-3" variants={stagger.container} initial="hidden" animate="visible" data-tour="payment-plans-stats">
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Plans</p>
                <p className="text-xl font-bold"><AnimatedCounter value={activePlans.length} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Outstanding</p>
                <p className="text-xl font-bold"><AnimatedCounter value={totalOutstanding} formatter={formatCurrency} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Completed Plans</p>
                <p className="text-xl font-bold"><AnimatedCounter value={plans.filter((p: any) => p.status === "completed").length} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2" data-tour="payment-plans-layout">
        {/* Plans List */}
        <Card className="glass-card overflow-hidden" data-tour="payment-plans-list">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-base">Payment Plans</CardTitle>
            <CardDescription>{plans.length} plan{plans.length !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {plans.length === 0 ? (
              <EmptyState icon={CreditCard} title="No payment plans" description="Create a plan to split invoices into installments." actionLabel="Create Plan" onAction={() => setCreateOpen(true)} />
            ) : (
              <div className="divide-y divide-border/30">
                {plans.map((plan: any) => (
                  <button
                    key={plan.id}
                    className={`w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors ${selectedPlan === plan.id ? "bg-accent/40" : ""}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{plan.patient_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.invoice_number} · {plan.installment_count} × {formatCurrency(plan.installment_amount)} ({plan.frequency})
                        </p>
                      </div>
                      <Badge className={`text-[10px] ${statusStyles[plan.status] || ""}`}>{plan.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Installment Details */}
        <div data-tour="payment-plans-installments">
          <InstallmentDetail planId={selectedPlan} plans={plans} />
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="backdrop-blur-xl bg-card/95">
          <DialogHeader><DialogTitle>Create Payment Plan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Invoice *</Label>
              <Select value={form.invoice_id} onValueChange={(v) => setForm((f) => ({ ...f, invoice_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                <SelectContent>
                  {pendingInvoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.patient_name} ({formatCurrency(inv.total_amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Installments</Label>
                <Input type="number" min={2} value={form.installment_count} onChange={(e) => setForm((f) => ({ ...f, installment_count: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-secondary hover:bg-secondary/90" disabled={createPlan.isPending || !form.invoice_id}>
              {createPlan.isPending ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InstallmentDetail({ planId, plans }: { planId: string | null; plans: any[] }) {
  const { data: installments = [] } = usePlanInstallments(planId);
  const markPaid = useMarkInstallmentPaid();
  const plan = plans.find((p: any) => p.id === planId);
  const [payMethod, setPayMethod] = useState("cash");

  if (!planId || !plan) {
    return (
      <Card className="glass-card flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-muted-foreground">Select a plan to view installments</p>
      </Card>
    );
  }

  const paidCount = installments.filter((i) => i.status === "paid").length;
  const paidAmount = installments.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{plan.patient_name}</CardTitle>
            <CardDescription>{paidCount}/{installments.length} paid · {formatCurrency(paidAmount)} of {formatCurrency(plan.total_amount)}</CardDescription>
          </div>
          <Select value={payMethod} onValueChange={setPayMethod}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Transfer</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border/30">
        {installments.map((inst) => (
          <div key={inst.id} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${inst.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                {inst.installment_number}
              </div>
              <div>
                <p className="text-sm font-medium">{formatCurrency(inst.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {inst.status === "paid" ? `Paid ${inst.paid_date}` : `Due ${inst.due_date}`}
                </p>
              </div>
            </div>
            {inst.status === "pending" ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={markPaid.isPending}
                onClick={() => markPaid.mutate({
                  installment_id: inst.id,
                  plan_id: planId,
                  invoice_id: plan.invoice_id,
                  amount: inst.amount,
                  payment_method: payMethod,
                })}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Paid
              </Button>
            ) : (
              <Badge className={`text-[10px] ${statusStyles[inst.status] || ""}`}>{inst.status}</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
