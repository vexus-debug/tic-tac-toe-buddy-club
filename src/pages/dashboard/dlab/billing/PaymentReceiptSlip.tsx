import { format } from "date-fns";
import { money } from "../dlabMoney";

export interface ReceiptData {
  reference: string;
  client: string;
  date: string;
  method: string;
  amount: number;
  allocations: { invoice_number: string; amount_applied: number }[];
  unallocated: number;
}

/** Printable receipt for a recorded payment. */
export default function PaymentReceiptSlip({ r, labName }: { r: ReceiptData; labName: string }) {
  return (
    <div className="space-y-4 rounded-md border bg-card p-5 text-sm text-card-foreground print:border-0">
      <div className="flex justify-between border-b pb-3">
        <div><h2 className="text-lg font-bold">{labName}</h2><p className="text-muted-foreground">Payment receipt</p></div>
        <div className="text-right"><p className="font-semibold">{r.reference}</p><p>{format(new Date(r.date + "T00:00:00"), "dd MMM yyyy")}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-xs uppercase text-muted-foreground">Received from</p><p className="font-medium">{r.client}</p></div>
        <div className="text-right"><p className="text-xs uppercase text-muted-foreground">Method</p><p>{r.method}</p></div>
      </div>
      <table className="w-full text-xs">
        <thead className="border-b text-left text-muted-foreground"><tr><th className="py-1">Invoice</th><th className="py-1 text-right">Applied</th></tr></thead>
        <tbody>
          {r.allocations.map((a) => <tr key={a.invoice_number} className="border-b"><td className="py-1">{a.invoice_number}</td><td className="py-1 text-right tabular-nums">{money(a.amount_applied)}</td></tr>)}
          {r.unallocated > 0 && <tr className="border-b"><td className="py-1">Credit on account</td><td className="py-1 text-right tabular-nums">{money(r.unallocated)}</td></tr>}
        </tbody>
      </table>
      <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total received</span><span className="tabular-nums">{money(r.amount)}</span></div>
      <p className="text-center text-xs text-muted-foreground">Thank you for your payment.</p>
    </div>
  );
}
