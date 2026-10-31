import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLabInvoices } from "@/hooks/useLabInvoices";
import { useSaveLabRecord } from "@/hooks/useLabRecords";
import { CREDIT_REASONS, validateCredit } from "@/lib/labStatements";
import { applyToInvoice, clientKey } from "../dlabLinks";
import { money } from "../dlabMoney";

/** Issue a remake / adjustment credit memo linked to a case and invoice; reduces the invoice balance. */
export default function CreditNoteDialog() {
  const [open, setOpen] = useState(false);
  const { data: invoices = [] } = useLabInvoices();
  const save = useSaveLabRecord("credit-notes");
  const qc = useQueryClient();
  const [invId, setInvId] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [errs, setErrs] = useState<string[]>([]);
  const openInv = invoices.filter((i: any) => i.status !== "void" && Number(i.total_amount || i.total || 0) - Number(i.amount_paid || 0) > 0);
  const inv: any = openInv.find((i: any) => i.id === invId);
  const bal = inv ? Number(inv.total_amount || inv.total || 0) - Number(inv.amount_paid || 0) : null;

  const submit = async () => {
    const amt = Number(amount);
    const e = [...(inv ? [] : ["Choose an invoice."]), ...validateCredit(amt, reason, bal)];
    setErrs(e);
    if (e.length) return;
    await save.mutateAsync({
      title: inv.clinic_code, amount: amt, status: "applied", record_date: new Date().toISOString().slice(0, 10),
      data: { invoice: inv.invoice_number, invoice_id: inv.id, case_number: caseNo || undefined, case_id: inv.lab_case_id || undefined, reason, remake_reason: reason, client_key: clientKey(inv.clinic_code) },
    });
    await applyToInvoice(inv.id, amt);
    qc.invalidateQueries({ queryKey: ["lab_invoices"] });
    setOpen(false); setInvId(""); setCaseNo(""); setReason(""); setAmount("");
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}><FileMinus className="mr-1 h-4 w-4" />Issue credit note</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue credit note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Invoice</Label>
              <Select value={invId} onValueChange={setInvId}>
                <SelectTrigger><SelectValue placeholder="Choose an unpaid invoice" /></SelectTrigger>
                <SelectContent>{openInv.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.invoice_number} · {i.clinic_code} · {money(Number(i.total_amount || i.total || 0) - Number(i.amount_paid || 0))}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Case number (optional)</Label><Input value={caseNo} onChange={(e) => setCaseNo(e.target.value)} /></div>
            <div><Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Choose a reason" /></SelectTrigger>
                <SelectContent>{CREDIT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount{bal !== null ? ` (max ${money(bal)})` : ""}</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            {errs.map((e) => <p key={e} className="text-sm text-destructive">{e}</p>)}
          </div>
          <DialogFooter><Button onClick={submit} disabled={save.isPending}>Issue credit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
