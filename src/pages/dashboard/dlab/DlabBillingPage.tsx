import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLabRecords } from "@/hooks/useLabRecords";
import { useLabInvoices } from "@/hooks/useLabInvoices";
import type { AgingBucket } from "@/lib/arAging";
import { applyCredit } from "@/lib/labAging";
import LabRegisterPage from "./LabRegisterPage";
import DlabInvoicesPage from "./DlabInvoicesPage";
import AgingKpiStrip from "./billing/AgingKpiStrip";
import CreditNoteDialog from "./billing/CreditNoteDialog";
import PaymentAllocationModal from "./billing/PaymentAllocationModal";
import { toAging } from "./billing/agingRows";
import { applyToInvoice, clientKey } from "./dlabLinks";
import { money } from "./dlabMoney";

const TABS = [
  { value: "receivables", label: "Invoices" },
  { value: "payments", label: "Payments & Credits" },
];
// Old links (?tab=aging / credits) land on the merged tab.
const ALIAS: Record<string, string> = { aging: "receivables", credits: "payments", prices: "receivables", statements: "receivables" };

export default function DlabBillingPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab") || "receivables";
  const tab = ALIAS[raw] || raw;
  const [aging, setAging] = useState<AgingBucket | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  return (
    <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="space-y-5">
      <TabsList className="flex h-auto flex-wrap justify-start">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="receivables" className="space-y-5">
        <AgingKpiStrip value={aging} onChange={setAging} />
        <DlabInvoicesPage agingFilter={aging} onClearAging={() => setAging(null)} />
      </TabsContent>
      <TabsContent value="payments" className="space-y-6">
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={() => setPayOpen(true)}><Banknote className="mr-1 h-4 w-4" />Record & allocate payment</Button>
          <CreditNoteDialog />
        </div>
        <UnappliedCredits />
        <LabRegisterPage kind="client-payments" />
        <LabRegisterPage kind="credit-notes" />
        <PaymentAllocationModal open={payOpen} onOpenChange={setPayOpen} />
      </TabsContent>
    </Tabs>
  );
}

/** Payments with money left over (credit on account) and a one-click apply to open invoices. */
function UnappliedCredits() {
  const payments = useLabRecords("client-payments");
  const { data: invoices = [] } = useLabInvoices();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const rows = useMemo(() => (payments.data || []).filter((p) => Number(p.data?.unallocated || 0) > 0), [payments.data]);
  if (!rows.length) return null;

  const apply = async (p: any) => {
    const open = invoices.filter((i) => clientKey(i.clinic_code) === clientKey(p.title)).map(toAging);
    const r = applyCredit(Number(p.data.unallocated), open);
    if (!r.allocations.length) return toast.info("No open invoices for this client.");
    setBusy(p.id);
    try {
      for (const a of r.allocations) await applyToInvoice(a.invoice_id, a.amount_applied);
      const allocations = [...(p.data.allocations || []), ...r.allocations];
      const { error } = await (supabase as any).from("lab_records").update({
        data: { ...p.data, allocations, unallocated: r.unallocated, applied: Number(p.amount) - r.unallocated },
      }).eq("id", p.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["lab_invoices"] });
      qc.invalidateQueries({ queryKey: ["lab_records"] });
      toast.success(`Applied ${money(Number(p.data.unallocated) - r.unallocated)} of credit to ${r.allocations.length} invoice(s)`);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <Card><CardContent className="space-y-2 p-4">
      <h3 className="text-sm font-medium">Unapplied credit on account</h3>
      {rows.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm">
          <span><b>{p.title}</b> · {p.record_date} · {p.data?.reference || p.data?.method}</span>
          <span className="flex items-center gap-2"><span className="tabular-nums">{money(Number(p.data.unallocated))}</span>
            <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => apply(p)}>Apply to invoices</Button></span>
        </div>
      ))}
    </CardContent></Card>
  );
}
