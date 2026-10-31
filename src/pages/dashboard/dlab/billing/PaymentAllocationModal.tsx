import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useLabInvoices } from "@/hooks/useLabInvoices";
import { allocateOldestFirst, openBalance, overdueDays, validateAllocations } from "@/lib/labAging";
import { applyToInvoice, clientKey, useLabClientNames } from "../dlabLinks";
import { money } from "../dlabMoney";
import { toAging } from "./agingRows";
import PaymentReceiptSlip, { type ReceiptData } from "./PaymentReceiptSlip";

const METHODS = ["Transfer", "Cheque", "Card", "Cash"];
const r2 = (n: number) => Math.round(n * 100) / 100;

interface Props { open: boolean; onOpenChange: (o: boolean) => void; client?: string; invoiceId?: string }

/** Record one lump-sum payment and split it across a client's open invoices; ends with a printable receipt. */
export default function PaymentAllocationModal({ open, onOpenChange, client: initialClient = "", invoiceId }: Props) {
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
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const openRows = useMemo(() => invoices
    .filter((i) => client && clientKey(i.clinic_code) === clientKey(client))
    .map(toAging).filter((i) => openBalance(i) > 0)
    .sort((a, b) => a.invoice_date.localeCompare(b.invoice_date)), [invoices, client]);
  const numOf = (id: string) => invoices.find((i) => i.id === id)?.invoice_number || "";

  useEffect(() => {
    if (!open) return;
    const inv = invoiceId ? invoices.find((i) => i.id === invoiceId) : undefined;
    setClient(inv?.clinic_code || initialClient);
    setRef(""); setReceipt(null); setDate(format(new Date(), "yyyy-MM-dd"));
    if (inv) {
      const bal = openBalance(toAging(inv));
      setAmount(bal); setSplit({ [inv.id]: bal });
    } else { setAmount(0); setSplit({}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceId, initialClient]);

  const autoAllocate = () => {
    const r = allocateOldestFirst(amount, openRows);
    setSplit(Object.fromEntries(r.allocations.map((a) => [a.invoice_id, a.amount_applied])));
  };
  const allocs = Object.entries(split).filter(([, v]) => v > 0).map(([invoice_id, amount_applied]) => ({ invoice_id, amount_applied }));
  const applied = r2(allocs.reduce((s, a) => s + a.amount_applied, 0));
  const credit = Math.max(0, r2(amount - applied));
  const outstanding = r2(openRows.reduce((s, i) => s + openBalance(i), 0));

  const save = async () => {
    if (!currentOrg) return;
    if (!client.trim()) return toast.error("Choose a client.");
    const errs = validateAllocations(amount, allocs, openRows);
    if (errs.length) return toast.error(errs[0]);
    setBusy(true);
    try {
      const reference = ref.trim() || `RCPT-${format(new Date(), "yyMMdd-HHmm")}`;
      const { error } = await (supabase as any).from("lab_records").insert({
        org_id: currentOrg.org_id, kind: "client-payments", title: client.trim(), status: "received", amount, record_date: date,
        data: { method, reference, allocations: allocs, unallocated: credit, invoice_id: allocs[0]?.invoice_id || null, invoice: allocs.map((a) => numOf(a.invoice_id)).join(", "), applied },
      });
      if (error) throw error;
      for (const a of allocs) await applyToInvoice(a.invoice_id, a.amount_applied);
      qc.invalidateQueries({ queryKey: ["lab_invoices"] });
      qc.invalidateQueries({ queryKey: ["lab_records"] });
      toast.success(`Payment of ${money(amount)} recorded${credit ? ` · ${money(credit)} credit on account` : ""}`);
      setReceipt({ reference, client: client.trim(), date, method, amount, unallocated: credit, allocations: allocs.map((a) => ({ invoice_number: numOf(a.invoice_id), amount_applied: a.amount_applied })) });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
        <DialogHeader className="print:hidden"><DialogTitle>{receipt ? "Payment recorded" : "Record & allocate payment"}</DialogTitle></DialogHeader>
        {receipt ? (
          <div className="space-y-3">
            <PaymentReceiptSlip r={receipt} labName={currentOrg?.org_name || "Dental Lab"} />
            <div className="flex justify-end gap-2 print:hidden">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
              <Button onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print receipt</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={client} onValueChange={(v) => { setClient(v); setSplit({}); }}>
                <SelectTrigger aria-label="Client"><SelectValue placeholder="Client clinic" /></SelectTrigger>
                <SelectContent>{[...new Set([...(client ? [client] : []), ...names])].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" aria-label="Payment date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger aria-label="Method"><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Cheque / transaction ref #" value={ref} onChange={(e) => setRef(e.target.value)} />
              <Input type="number" min={0} aria-label="Total amount received" placeholder="Total amount received" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
              <Button variant="outline" onClick={autoAllocate} disabled={!amount || !openRows.length}><Wand2 className="mr-1 h-4 w-4" />Auto-allocate oldest first</Button>
            </div>
            {client && <p className="text-xs text-muted-foreground">{openRows.length} open invoice{openRows.length === 1 ? "" : "s"} · {money(outstanding)} outstanding</p>}
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-2">Invoice</th><th className="p-2">Date</th><th className="p-2 text-right">Overdue</th><th className="p-2 text-right">Balance</th><th className="w-32 p-2 text-right">Apply</th></tr></thead>
                <tbody>
                  {openRows.map((i) => {
                    const od = overdueDays(i);
                    return (
                      <tr key={i.id} className="border-t">
                        <td className="p-2 font-medium">{numOf(i.id)}</td><td className="p-2">{i.invoice_date}</td>
                        <td className={`p-2 text-right tabular-nums ${od > 0 ? "text-destructive" : "text-muted-foreground"}`}>{od > 0 ? `${od}d` : "—"}</td>
                        <td className="p-2 text-right tabular-nums">{money(openBalance(i))}</td>
                        <td className="p-2"><Input type="number" min={0} aria-label={`Apply to ${numOf(i.id)}`} className="h-8 text-right" value={split[i.id] || ""} onChange={(e) => setSplit((s) => ({ ...s, [i.id]: Number(e.target.value) || 0 }))} /></td>
                      </tr>
                    );
                  })}
                  {client && !openRows.length && <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">No open invoices — the full amount becomes credit on account.</td></tr>}
                  {!client && <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">Choose a client to see their unpaid invoices.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="tabular-nums">Applied <b>{money(applied)}</b> · Credit on account <b>{money(credit)}</b></span>
              <Button onClick={save} disabled={busy}>Save payment</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
