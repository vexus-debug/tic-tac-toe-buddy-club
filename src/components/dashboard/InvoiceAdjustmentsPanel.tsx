import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";
import { useInvoiceAdjustments, useAddAdjustment } from "@/hooks/useBilling";
import { ADJUSTMENT_KINDS, canAdjustInvoices } from "@/lib/arAging";
import { MinusCircle } from "lucide-react";

const fmt = (n: number) => `₦${Number(n).toLocaleString()}`;
const kindLabel = (k: string) => ADJUSTMENT_KINDS.find((x) => x.value === k)?.label || k;

export function InvoiceAdjustmentsPanel({ invoiceId, balance }: { invoiceId: string; balance: number }) {
  const { currentOrg } = useOrg();
  const allowed = canAdjustInvoices(currentOrg?.role);
  const { data: rows = [] } = useInvoiceAdjustments(invoiceId);
  const add = useAddAdjustment();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>("courtesy");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  if (!rows.length && !allowed) return null;

  const submit = async () => {
    const amt = Number(amount);
    if (!(amt > 0) || amt > balance) return toast({ title: "Amount must be between 1 and the balance due", variant: "destructive" });
    if (reason.trim().length < 5) return toast({ title: "Add a reason (at least 5 characters)", variant: "destructive" });
    try {
      await add.mutateAsync({ invoice_id: invoiceId, kind, amount: amt, reason: reason.trim() });
      toast({ title: "Adjustment recorded", description: `${kindLabel(kind)} · ${fmt(amt)}` });
      setOpen(false); setAmount(""); setReason("");
    } catch (e: any) {
      toast({ title: "Could not record adjustment", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-foreground">Adjustments</h4>
        {allowed && balance > 0 && !open && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>
            <MinusCircle className="mr-1 h-3.5 w-3.5" />Write off / adjust
          </Button>
        )}
      </div>
      {rows.length > 0 ? (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.id} className="flex justify-between gap-3 text-xs bg-muted/30 rounded-lg p-2.5">
              <span className="text-muted-foreground min-w-0">
                <span className="font-medium text-foreground">{kindLabel(r.kind)}</span> · {r.created_at.slice(0, 10)} · {r.reason}
              </span>
              <span className="font-semibold text-amber-700 dark:text-amber-400 shrink-0">−{fmt(r.amount)}</span>
            </div>
          ))}
        </div>
      ) : !open && (
        <p className="text-xs text-muted-foreground">No adjustments.</p>
      )}
      {open && (
        <div className="mt-2 space-y-2 rounded-lg border p-3 bg-muted/20">
          <div className="grid grid-cols-2 gap-2">
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{ADJUSTMENT_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" min={1} max={balance} placeholder={`Max ${fmt(balance)}`} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-xs" />
          </div>
          <Textarea rows={2} className="text-xs" placeholder="Reason (required, kept in the audit trail)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={add.isPending}>{add.isPending ? "Saving…" : "Record adjustment"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
