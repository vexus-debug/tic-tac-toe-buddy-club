import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLabInvoices } from "@/hooks/useLabInvoices";
import { useLabRecords } from "@/hooks/useLabRecords";
import { AGING_LABELS, type AgingBucket } from "@/lib/arAging";
import { agingByClient, delinquencyRate, shouldAutoHold } from "@/lib/labAging";
import { clientKey } from "../dlabLinks";
import { money } from "../dlabMoney";
import { PaymentIntakeModal } from "./PaymentIntakeModal";

const BUCKETS: AgingBucket[] = ["current", "31_60", "61_90", "90_plus"];
const riskTone = { current: "secondary", overdue: "outline", high: "destructive" } as const;

export default function BillingAgingView() {
  const { data: invoices = [] } = useLabInvoices();
  const profiles = useLabRecords("client-profiles");
  const [filter, setFilter] = useState<AgingBucket | null>(null);
  const [payFor, setPayFor] = useState<string | null>(null);

  const rows = useMemo(() => agingByClient(invoices.map((i) => ({
    id: i.id, client: i.clinic_code, invoice_date: i.invoice_date, total: Number(i.total_amount || i.total || 0), paid: Number(i.amount_paid || 0), status: i.status,
  })), clientKey), [invoices]);
  const limitOf = (c: string) => Number((profiles.data || []).find((p) => clientKey(p.title) === clientKey(c))?.data?.credit_limit || 0);
  const totals = BUCKETS.map((b) => rows.reduce((s, r) => s + r.buckets[b], 0));
  const shown = filter ? rows.filter((r) => r.buckets[filter] > 0) : rows;

  const exportCsv = () => {
    const head = ["Client", ...BUCKETS.map((b) => AGING_LABELS[b]), "Total", "Oldest days", "Risk"];
    const lines = rows.map((r) => [r.client, ...BUCKETS.map((b) => r.buckets[b]), r.total, r.oldestDays, r.risk].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "ar-aging.csv" }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {BUCKETS.map((b, i) => (
          <button key={b} onClick={() => setFilter(filter === b ? null : b)} className="text-left">
            <Card className={filter === b ? "ring-2 ring-primary" : ""}><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{AGING_LABELS[b]}</p>
              <p className="text-xl font-semibold">{money(totals[i])}</p>
            </CardContent></Card>
          </button>
        ))}
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">30+ day delinquency</p>
          <p className="text-xl font-semibold">{delinquencyRate(rows)}%</p>
        </CardContent></Card>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />Export aging CSV</Button>
        <Button size="sm" onClick={() => setPayFor("")}>Record payment</Button>
      </div>
      <Card><CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr><th className="p-2">Client</th>{BUCKETS.map((b) => <th key={b} className="p-2 text-right">{AGING_LABELS[b]}</th>)}<th className="p-2 text-right">Total</th><th className="p-2">Status</th><th className="p-2" /></tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const hold = shouldAutoHold(r, limitOf(r.client));
              return (
                <tr key={r.client} className="border-b">
                  <td className="p-2 font-medium"><Link to={`../clients?open=${encodeURIComponent(r.client)}`} relative="path" className="hover:underline">{r.client}</Link></td>
                  {BUCKETS.map((b) => <td key={b} className="p-2 text-right tabular-nums">{r.buckets[b] ? money(r.buckets[b]) : "—"}</td>)}
                  <td className="p-2 text-right font-semibold tabular-nums">{money(r.total)}</td>
                  <td className="space-x-1 p-2"><Badge variant={riskTone[r.risk]}>{r.risk}</Badge>{hold && <Badge variant="destructive">Credit hold</Badge>}</td>
                  <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => setPayFor(r.client)}>Pay</Button></td>
                </tr>
              );
            })}
            {!shown.length && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No outstanding receivables.</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>
      <PaymentIntakeModal open={payFor !== null} client={payFor || ""} onOpenChange={(o) => !o && setPayFor(null)} />
    </div>
  );
}
