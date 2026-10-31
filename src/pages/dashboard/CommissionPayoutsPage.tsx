import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { useCommissionPayouts, useCreateCommissionPayout, useMarkCommissionPaid } from "@/hooks/useCommissionPayouts";
import { useStaff } from "@/hooks/useStaff";
import { useStaffAllocationBreakdown } from "@/hooks/useRevenueAllocation";
import { DollarSign, Plus, CheckCircle2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useClinicTerms } from "@/hooks/useClinicTerms";
import { AssociatePayPanel } from "@/components/dashboard/associate/AssociatePayPanel";
import { useLockPayouts } from "@/hooks/useAssociatePay";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Lock } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  approved: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  disputed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function CommissionPayoutsPage() {
  const terms = useClinicTerms();
  const { data: payouts = [] } = useCommissionPayouts();
  const { data: staffList = [] } = useStaff();
  const { data: staffBreakdown } = useStaffAllocationBreakdown();
  const createPayout = useCreateCommissionPayout();
  const markPaid = useMarkCommissionPaid();
  const lockPayouts = useLockPayouts();
  const [lockTarget, setLockTarget] = useState<{ id: string; label: string } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [payDialog, setPayDialog] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ amount: "", payment_method: "bank_transfer", reference: "" });

  const now = new Date();
  const [form, setForm] = useState({
    staff_id: "",
    period_start: format(startOfMonth(now), "yyyy-MM-dd"),
    period_end: format(endOfMonth(now), "yyyy-MM-dd"),
    calculated_amount: "",
    notes: "",
  });

  const dentists = (staffList as any[]).filter((s) => s.role === "dentist");
  const totalPending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.calculated_amount, 0);
  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.paid_amount, 0);

  const handleCreate = () => {
    if (!form.staff_id || !form.calculated_amount) return;
    createPayout.mutate({
      staff_id: form.staff_id,
      period_start: form.period_start,
      period_end: form.period_end,
      calculated_amount: parseFloat(form.calculated_amount),
      notes: form.notes,
    }, { onSuccess: () => { setCreateOpen(false); setForm({ staff_id: "", period_start: format(startOfMonth(now), "yyyy-MM-dd"), period_end: format(endOfMonth(now), "yyyy-MM-dd"), calculated_amount: "", notes: "" }); } });
  };

  const handlePay = () => {
    if (!payDialog || !payForm.amount) return;
    markPaid.mutate({
      id: payDialog,
      paid_amount: parseFloat(payForm.amount),
      payment_method: payForm.payment_method,
      reference: payForm.reference,
    }, { onSuccess: () => { setPayDialog(null); setPayForm({ amount: "", payment_method: "bank_transfer", reference: "" }); } });
  };

  // Auto-fill amount from staff allocation breakdown
  const handleStaffSelect = (staffId: string) => {
    setForm((f) => ({ ...f, staff_id: staffId }));
    const monthAmount = staffBreakdown?.thisMonth?.[staffId] || 0;
    if (monthAmount > 0) {
      setForm((f) => ({ ...f, calculated_amount: String(monthAmount) }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Commission Payouts" description="Track dentist commissions and payouts">
        <Button size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Payout
        </Button>
      </PageHeader>

      <motion.div className="grid gap-4 sm:grid-cols-3" variants={stagger.container} initial="hidden" animate="visible">
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending Payouts</p>
                <p className="text-xl font-bold"><AnimatedCounter value={totalPending} formatter={formatCurrency} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
                <p className="text-xl font-bold"><AnimatedCounter value={totalPaid} formatter={formatCurrency} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{terms.clinicianPlural}</p>
                <p className="text-xl font-bold"><AnimatedCounter value={dentists.length} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <AssociatePayPanel />

      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-base">Payout History</CardTitle>
          <CardDescription>{payouts.length} record{payouts.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <EmptyState icon={DollarSign} title="No commission payouts" description="Create payout records for dentist commissions." actionLabel="New Payout" onAction={() => setCreateOpen(true)} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">{terms.clinician}</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Period</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Calculated</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Paid</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p, i) => (
                  <motion.tr key={p.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30 transition-all group" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                    <td className="py-3 px-4 font-medium">{p.staff_name}</td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs font-mono">{p.period_start} – {p.period_end}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(p.calculated_amount)}</td>
                    <td className="py-3 px-4 text-right">{p.paid_amount > 0 ? formatCurrency(p.paid_amount) : "—"}</td>
                    <td className="py-3 px-4"><Badge className={`text-[10px] ${statusStyles[p.status] || ""}`}>{p.status}</Badge></td>
                    <td className="py-3 px-4 text-right">
                      {(p as any).locked_at ? (
                        <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-3 w-3" /> Locked</Badge>
                      ) : p.status === "paid" ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLockTarget({ id: p.id, label: `${p.staff_name} · ${p.period_start} – ${p.period_end}` })}>
                          <Lock className="mr-1 h-3 w-3" /> Finalize &amp; Lock
                        </Button>
                      ) : null}
                      {p.status === "pending" && !(p as any).locked_at && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setPayDialog(p.id); setPayForm({ amount: String(p.calculated_amount), payment_method: "bank_transfer", reference: "" }); }}>
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Pay
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="backdrop-blur-xl bg-card/95">
          <DialogHeader><DialogTitle>New Commission Payout</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{terms.clinician} *</Label>
              <Select value={form.staff_id} onValueChange={handleStaffSelect}>
                <SelectTrigger><SelectValue placeholder={`Select ${terms.clinician.toLowerCase()}`} /></SelectTrigger>
                <SelectContent>
                  {dentists.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Period Start</Label>
                <Input type="date" value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Period End</Label>
                <Input type="date" value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Calculated Amount (₦) *</Label>
              <Input type="number" value={form.calculated_amount} onChange={(e) => setForm((f) => ({ ...f, calculated_amount: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-secondary hover:bg-secondary/90" disabled={createPayout.isPending || !form.staff_id}>
              {createPayout.isPending ? "Creating..." : "Create Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent className="backdrop-blur-xl bg-card/95">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Amount (₦)</Label>
              <Input type="number" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Method</Label>
                <Select value={payForm.payment_method} onValueChange={(v) => setPayForm((f) => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reference</Label>
                <Input value={payForm.reference} onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
            <Button onClick={handlePay} className="bg-secondary hover:bg-secondary/90" disabled={markPaid.isPending}>
              {markPaid.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!lockTarget} onOpenChange={(o) => !o && setLockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize &amp; lock this pay period?</AlertDialogTitle>
            <AlertDialogDescription>
              {lockTarget?.label}. Once locked, this payout and every bill in its dates for this provider can no longer be edited or deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={lockPayouts.isPending} onClick={() => lockTarget && lockPayouts.mutate([lockTarget.id], { onSuccess: () => setLockTarget(null) })}>
              {lockPayouts.isPending ? "Locking..." : "Lock period"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
