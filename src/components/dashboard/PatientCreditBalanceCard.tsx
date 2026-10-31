import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Wallet } from "lucide-react";
import { usePatientCredits, useAddDeposit, useApplyCredit } from "@/hooks/useBilling";

const fmt = (n: number) => `₦${Number(n).toLocaleString()}`;

/**
 * Patient deposit balance. With `invoiceId` + `balanceDue` it offers "Apply from credit";
 * otherwise it only records new deposits.
 */
export function PatientCreditBalanceCard({ patientId, invoiceId, balanceDue = 0 }: { patientId: string; invoiceId?: string; balanceDue?: number }) {
  const { data } = usePatientCredits(patientId);
  const deposit = useAddDeposit();
  const apply = useApplyCredit();
  const [mode, setMode] = useState<"none" | "deposit" | "apply">("none");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const credit = Math.max(0, data?.balance || 0);
  const maxApply = Math.min(credit, balanceDue);

  const run = async () => {
    const amt = Number(amount);
    try {
      if (mode === "deposit") {
        await deposit.mutateAsync({ patient_id: patientId, amount: amt, payment_method: method });
        toast({ title: "Deposit recorded", description: fmt(amt) });
      } else {
        if (amt > maxApply) throw new Error(`You can apply at most ${fmt(maxApply)}`);
        await apply.mutateAsync({ patient_id: patientId, invoice_id: invoiceId!, amount: amt });
        toast({ title: "Credit applied", description: fmt(amt) });
      }
      setMode("none"); setAmount("");
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Patient credit</span>
        <span className="font-semibold text-sm tabular-nums">{fmt(credit)}</span>
        <div className="ml-auto flex gap-1.5">
          {invoiceId && maxApply > 0 && (
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => { setMode("apply"); setAmount(String(maxApply)); }}>Apply to this bill</Button>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setMode("deposit"); setAmount(""); }}>Add deposit</Button>
        </div>
      </div>
      {mode !== "none" && (
        <div className="flex gap-2 items-center">
          <Input type="number" min={1} className="h-8 text-xs" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {mode === "deposit" && (
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="transfer">Bank transfer</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button size="sm" className="h-8 text-xs" onClick={run} disabled={deposit.isPending || apply.isPending}>Save</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setMode("none")}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
