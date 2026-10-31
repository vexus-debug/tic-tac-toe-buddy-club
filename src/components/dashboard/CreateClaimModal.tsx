import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useCreateClaim } from "@/hooks/useBilling";
import type { InvoiceItem } from "@/hooks/useInvoices";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  invoice: { id: string; patient_id: string | null; invoice_number: string; balance: number };
  items: InvoiceItem[];
}

/** "Generate claim from invoice": pre-fills procedures (with CDT codes) and the open balance. */
export function CreateClaimModal({ open, onOpenChange, invoice, items }: Props) {
  const create = useCreateClaim();
  const [insurer, setInsurer] = useState("");
  const [policy, setPolicy] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount(String(invoice.balance));
    setNotes(items.map((i) => [i.cdt_code, i.tooth_number && `#${i.tooth_number}`, i.surfaces, i.description, `₦${Number(i.line_total).toLocaleString()}`].filter(Boolean).join(" · ")).join("\n"));
  }, [open, invoice.balance, items]);

  const submit = async () => {
    if (!insurer.trim()) return toast({ title: "Enter the insurer name", variant: "destructive" });
    const amt = Number(amount);
    if (!(amt > 0)) return toast({ title: "Enter the amount to claim", variant: "destructive" });
    try {
      await create.mutateAsync({ invoice_id: invoice.id, patient_id: invoice.patient_id, insurer_name: insurer.trim(), policy_number: policy.trim() || undefined, amount_claimed: amt, notes });
      toast({ title: "Claim drafted", description: `${insurer} · ₦${amt.toLocaleString()}` });
      onOpenChange(false); setInsurer(""); setPolicy("");
    } catch (e: any) {
      toast({ title: "Could not create claim", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Insurance claim</DialogTitle>
          <DialogDescription>For invoice {invoice.invoice_number}. Track it under Billing → Claims.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Insurer *</Label><Input value={insurer} onChange={(e) => setInsurer(e.target.value)} placeholder="e.g. AXA Mansard" /></div>
            <div className="space-y-1"><Label className="text-xs">Policy number</Label><Input value={policy} onChange={(e) => setPolicy(e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label className="text-xs">Amount to claim (₦) *</Label><Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Procedures</Label><Textarea rows={5} className="text-xs font-mono" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>{create.isPending ? "Saving…" : "Save draft claim"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
