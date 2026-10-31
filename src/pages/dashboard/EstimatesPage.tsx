import { useState, useEffect } from "react";
import { usePatientContext } from "@/hooks/usePatientContext";
import { PatientVisitBar } from "@/components/dashboard/PatientVisitBar";
import { usePatientPlanItems } from "@/hooks/useVisitFlow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { useTreatmentEstimates, useCreateEstimate, useUpdateEstimateStatus, useConvertEstimateToInvoice } from "@/hooks/useTreatmentEstimates";
import { usePatients } from "@/hooks/usePatients";
import { useTreatments } from "@/hooks/useTreatments";
import { FileText, Plus, ArrowRight, Search, CheckCircle2, XCircle, Send } from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  declined: "bg-red-500/10 text-red-700 dark:text-red-400",
  expired: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  converted: "bg-secondary/10 text-secondary",
};

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function EstimatesPage() {
  const { data: estimates = [] } = useTreatmentEstimates();
  const { data: patients = [] } = usePatients();
  const { data: treatments = [] } = useTreatments();
  const createEstimate = useCreateEstimate();
  const updateStatus = useUpdateEstimateStatus();
  const convertToInvoice = useConvertEstimateToInvoice();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    patient_id: "",
    discount_percent: "0",
    valid_until: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    notes: "",
  });
  const { patientId: ctxPatientId, consumeFlag, searchParams } = usePatientContext();
  const { data: planItems = [], isFetched: planFetched } = usePatientPlanItems(ctxPatientId || null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [wantFromPlan] = useState(() => searchParams.get("fromPlan") === "1");
  useEffect(() => { consumeFlag("fromPlan"); }, [consumeFlag]);

  /** Builds an estimate from the patient's open treatment plan in one click. */
  const generateFromPlan = () => {
    const open = planItems.filter((i) => i.status !== "completed");
    if (!ctxPatientId || open.length === 0) return false;
    setForm((f) => ({ ...f, patient_id: ctxPatientId, notes: f.notes || `From ${open[0].plan_name}` }));
    setPlanId(open[0].plan_id);
    setLineItems(
      open.map((i) => ({
        treatment_id: i.treatment_id || "",
        description: `${i.description}${i.tooth_number ? ` (#${i.tooth_number})` : ""}`,
        quantity: 1,
        unit_price: Number(i.estimated_cost || 0),
        line_total: Number(i.estimated_cost || 0),
      })),
    );
    setCreateOpen(true);
    return true;
  };
  useEffect(() => {
    if (wantFromPlan && planFetched) generateFromPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantFromPlan, planFetched]);
  useEffect(() => {
    if (ctxPatientId) setForm((f) => (f.patient_id ? f : { ...f, patient_id: ctxPatientId }));
  }, [ctxPatientId]);

  const [lineItems, setLineItems] = useState<{ treatment_id: string; description: string; quantity: number; unit_price: number; line_total: number }[]>([]);

  const filtered = estimates.filter((e) =>
    e.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    e.estimate_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = estimates.filter((e) => ["draft", "sent"].includes(e.status)).reduce((s, e) => s + e.total, 0);
  const acceptedRate = estimates.length > 0 ? Math.round((estimates.filter((e) => e.status === "accepted" || e.status === "converted").length / estimates.length) * 100) : 0;

  const addLineItem = () => setLineItems((items) => [...items, { treatment_id: "", description: "", quantity: 1, unit_price: 0, line_total: 0 }]);
  const updateLineItem = (index: number, field: string, value: any) => {
    setLineItems((items) => items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === "treatment_id") {
        const t = treatments.find((tr: any) => tr.id === value);
        if (t) {
          updated.description = (t as any).name;
          updated.unit_price = Number((t as any).price || 0);
          updated.line_total = updated.quantity * updated.unit_price;
        }
      }
      if (field === "quantity" || field === "unit_price") {
        updated.line_total = updated.quantity * updated.unit_price;
      }
      return updated;
    }));
  };

  const handleCreate = () => {
    if (!form.patient_id || lineItems.length === 0) return;
    createEstimate.mutate({
      patient_id: form.patient_id,
      discount_percent: parseFloat(form.discount_percent) || 0,
      valid_until: form.valid_until,
      notes: form.notes,
      treatment_plan_id: planId,
      line_items: lineItems,
    }, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ patient_id: "", discount_percent: "0", valid_until: format(addDays(new Date(), 30), "yyyy-MM-dd"), notes: "" });
        setLineItems([]);
        setPlanId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {ctxPatientId && <PatientVisitBar patientId={ctxPatientId} />}
      <PageHeader title="Treatment Estimates" description="Generate cost estimates before invoicing">
        {ctxPatientId && planItems.some((i) => i.status !== "completed") && (
          <Button size="sm" variant="outline" onClick={generateFromPlan}>
            <FileText className="mr-2 h-4 w-4" /> Estimate from active plan
          </Button>
        )}
        <Button size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => { setCreateOpen(true); if (lineItems.length === 0) addLineItem(); }} data-tour="estimates-new">
          <Plus className="mr-2 h-4 w-4" /> New Estimate
        </Button>
      </PageHeader>

      <motion.div className="grid gap-4 sm:grid-cols-3" variants={stagger.container} initial="hidden" animate="visible" data-tour="estimates-stats">
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center"><FileText className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Estimates</p>
                <p className="text-xl font-bold"><AnimatedCounter value={estimates.length} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center"><FileText className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending Value</p>
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
                <p className="text-xs font-medium text-muted-foreground">Acceptance Rate</p>
                <p className="text-xl font-bold">{acceptedRate}%</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="relative" data-tour="estimates-search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search estimates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="glass-card overflow-hidden" data-tour="estimates-table">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={FileText} title="No estimates" description="Create your first treatment estimate." actionLabel="New Estimate" onAction={() => setCreateOpen(true)} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Estimate</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Patient</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Total</th>
                  <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((est, i) => (
                  <motion.tr key={est.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30 transition-all group" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                    <td className="py-3 px-4 font-mono text-xs text-secondary font-medium">{est.estimate_number}</td>
                    <td className="py-3 px-4 font-medium">{est.patient_name}</td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground font-mono text-xs">{est.estimate_date}</td>
                    <td className="py-3 px-4 font-semibold text-right">{formatCurrency(est.total)}</td>
                    <td className="py-3 px-4">
                      <Badge className={`text-[10px] ${statusStyles[est.status] || ""}`}>{est.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right" data-tour="estimates-actions">
                      <div className="flex items-center justify-end gap-1">
                        {est.status === "draft" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: est.id, status: "sent" })}>
                            <Send className="mr-1 h-3 w-3" /> Send
                          </Button>
                        )}
                        {(est.status === "sent" || est.status === "draft") && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => updateStatus.mutate({ id: est.id, status: "accepted" })}>
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => updateStatus.mutate({ id: est.id, status: "declined" })}>
                              <XCircle className="mr-1 h-3 w-3" /> Decline
                            </Button>
                          </>
                        )}
                        {est.status === "accepted" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => convertToInvoice.mutate(est.id)} disabled={convertToInvoice.isPending}>
                            <ArrowRight className="mr-1 h-3 w-3" /> Convert
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create Estimate Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl backdrop-blur-xl bg-card/95">
          <DialogHeader><DialogTitle>New Treatment Estimate</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Patient *</Label>
                <Select value={form.patient_id} onValueChange={(v) => setForm((f) => ({ ...f, patient_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {(patients as any[]).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Discount %</Label>
                  <Input type="number" value={form.discount_percent} onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valid Until</Label>
                  <Input type="date" value={form.valid_until} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Line Items</Label>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={addLineItem}>
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Select value={item.treatment_id} onValueChange={(v) => updateLineItem(idx, "treatment_id", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Treatment" /></SelectTrigger>
                      <SelectContent>
                        {(treatments as any[]).map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name} (₦{Number(t.price).toLocaleString()})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" className="h-8 text-xs" placeholder="Qty" value={item.quantity} onChange={(e) => updateLineItem(idx, "quantity", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" className="h-8 text-xs" placeholder="Price" value={item.unit_price} onChange={(e) => updateLineItem(idx, "unit_price", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2 text-right text-xs font-semibold pt-2">{formatCurrency(item.line_total)}</div>
                  <div className="col-span-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => setLineItems((items) => items.filter((_, i) => i !== idx))}>×</Button>
                  </div>
                </div>
              ))}
              {lineItems.length > 0 && (
                <div className="text-right text-sm font-bold pt-2 border-t border-border/30">
                  Total: {formatCurrency(lineItems.reduce((s, i) => s + i.line_total, 0) * (1 - (parseFloat(form.discount_percent) || 0) / 100))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-secondary hover:bg-secondary/90" disabled={createEstimate.isPending || !form.patient_id || lineItems.length === 0}>
              {createEstimate.isPending ? "Creating..." : "Create Estimate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
