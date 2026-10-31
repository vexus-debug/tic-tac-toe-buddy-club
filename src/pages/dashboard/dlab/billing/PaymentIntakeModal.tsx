import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useLabInvoices } from "@/hooks/useLabInvoices";
import { allocateOldestFirst, openBalance, validateAllocations, type AgingInvoice } from "@/lib/labAging";
import { applyToInvoice, clientKey, useLabClientNames } from "../dlabLinks";
import { money } from "../dlabMoney";

const METHODS = ["Transfer", "Cheque", "Card", "Cash"];

export function PaymentIntakeModal({ open, client: initial, onOpenChange }: { open: boolean; client: string; onOpenChange: (o: boolean) => void }) {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const names = useLabClientNames();
  const { data: invoices = [] } = useLabInvoices();
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [method, setMethod] = useState("Transfer");
  const [ref, setRef] = useState("");
  const [split, setSplit] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setClient(initial); setAmount(0); setRef(""); setSplit({}); } }, [open, initial]);

  const open_: AgingInvoice[] = useMemo(() => invoices
    .filter((i) => client && clientKey(i.clinic_code) === clientKey(client))
    .map((i) => ({ id: i.id, client: i.clinic_code, invoice_date: i.invoice_date, total: Number(i.total_amount || i.total || 0), paid: Number(i.amount_paid || 0), status: i.status }))
    .filter((i) => openBalance(i) > 0)
    .sort((a, b) => a.invoice_date.localeCompare(b.invoice_date)), [invoices, client]);
  const numOf = (id: string) => invoices.find((i) => i.id === id)?.invoice_number || "";

  const waterfall = () => {
    const r = allocateOldestFirst(amount, open_);
    setSplit(Object.fromEntries(r.allocations.map((a) => [a.invoice_id, a.amount_applied])));
  };
  const allocs = Object.entries(split).filter(([, v]) => v > 0).map(([invoice_id, amount_applied]) => ({ invoice_id, amount_applied }));
  const applied = allocs.reduce((s, a) => s + a.amount_applied, 0);
  const credit = Math.max(0, Math.round((amount - applied) * 100) / 100);

  const save = async () => {
    if (!currentOrg) return;
    if (!client.trim()) return toast.error("Choose a client.");
    const errs = validateAllocations(amount, allocs, open_);
    if (errs.length) return toast.error(errs[0]);
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("lab_records").insert({
        org_id: currentOrg.org_id, kind: "client-payments", title: client.trim(), status: "received", amount, record_date: date,
        data: { method, reference: ref, allocations: allocs, unallocated: credit, invoice_id: allocs[0]?.invoice_id || null, invoice: allocs.map((a) => numOf(a.invoice_id)).join(", "), applied },
      });
      if (error) throw error;
      for (const a of allocs) await applyToInvoice(a.invoice_id, a.amount_applied);
      qc.invalidateQueries({ queryKey: ["lab_invoices"] });
      qc.invalidateQueries({ queryKey: ["lab_records"] });
      toast.success(`Payment of ${money(amount)} recorded${credit ? ` · ${money(credit)} credit on account` : ""}`);
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={client} onValueChange={(v) => { setClient(v); setSplit({}); }}>
            <SelectTrigger><SelectValue placeholder="Client clinic" /></SelectTrigger>
            <SelectContent>{names.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Cheque / transaction ref #" value={ref} onChange={(e) => setRef(e.target.value)} />
          <Input type="number" min={0} placeholder="Total amount received" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          <Button variant="outline" onClick={waterfall} disabled={!amount || !open_.length}>Apply oldest first</Button>
        </div>
        <table className="mt-2 w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="p-1">Invoice</th><th className="p-1">Date</th><th className="p-1 text-right">Open</th><th className="p-1 text-right">Apply</th></tr></thead>
          <tbody>
            {open_.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-1">{numOf(i.id)}</td><td className="p-1">{i.invoice_date}</td>
                <td className="p-1 text-right tabular-nums">{money(openBalance(i))}</td>
                <td className="p-1"><Input type="number" min={0} className="h-8 text-right" value={split[i.id] || ""} onChange={(e) => setSplit((s) => ({ ...s, [i.id]: Number(e.target.value) || 0 }))} /></td>
              </tr>
            ))}
            {client && !open_.length && <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">No open invoices — full amount becomes credit on account.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between text-sm">
          <span>Applied {money(applied)} · Credit on account {money(credit)}</span>
          <Button onClick={save} disabled={busy}>Save payment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
