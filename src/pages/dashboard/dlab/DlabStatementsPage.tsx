import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientOf } from "@/hooks/useDentalLab";
import { normalizeStage } from "@/config/dentalLab";
import { useClientSummaries, money, sameClient } from "./dlabMoney";

type Period = "all" | "this" | "last" | "custom";
const ymd = (d: Date) => format(d, "yyyy-MM-dd");

export default function DlabStatementsPage({ client: fixed }: { client?: string } = {}) {
  const { data, cases, invoices: allInvoices, payments, credits, isLoading } = useClientSummaries();
  const [client, setClient] = useState<string>("");
  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const current = fixed || client || data[0]?.name || "";

  const range = useMemo(() => {
    const now = new Date();
    if (period === "this") return { from: ymd(startOfMonth(now)), to: ymd(endOfMonth(now)) };
    if (period === "last") { const l = subMonths(now, 1); return { from: ymd(startOfMonth(l)), to: ymd(endOfMonth(l)) }; }
    if (period === "custom") return { from, to };
    return { from: "", to: "" };
  }, [period, from, to]);

  const { lines, opening } = useMemo(() => {
    const invoices = allInvoices ?? [];
    const billedCases = cases.filter((c) => sameClient(clientOf(c), current)).flatMap((c) => {
      const inv = invoices.find((i) => i.lab_case_id === c.id);
      if (!inv && normalizeStage(c.status) !== "delivered") return []; // unfinished work is not billed yet
      const date = inv?.invoice_date?.slice(0, 10) || c.completed_date || c.created_at.slice(0, 10);
      const debit = inv ? Number(inv.total_amount || 0) : Number(c.lab_fee || 0) - Number(c.discount || 0);
      return [{ date, text: `${inv ? inv.invoice_number + " · " : ""}${c.case_number} · ${c.work_type}`, debit, credit: 0 }];
    });
    const loose = invoices.filter((i) => !i.lab_case_id && sameClient(i.clinic_code, current))
      .map((i) => ({ date: i.invoice_date.slice(0, 10), text: i.invoice_number, debit: Number(i.total_amount || 0), credit: 0 }));
    const all = [
      ...billedCases, ...loose,
      ...payments.filter((p) => sameClient(p.title, current) && p.status !== "bounced").map((p) => ({ date: p.record_date || p.created_at.slice(0, 10), text: `Payment${p.data?.invoice ? ` · ${p.data.invoice}` : ""}${p.data?.reference ? ` · ${p.data.reference}` : ""}`, debit: 0, credit: Number(p.amount || 0) })),
      ...credits.filter((p) => sameClient(p.title, current) && p.status !== "void").map((p) => ({ date: p.record_date || p.created_at.slice(0, 10), text: `Credit note${p.data?.invoice ? ` · ${p.data.invoice}` : ""}`, debit: 0, credit: Number(p.amount || 0) })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    const opening = all.filter((r) => range.from && r.date < range.from).reduce((s, r) => s + r.debit - r.credit, 0);
    let bal = opening;
    const lines = all.filter((r) => (!range.from || r.date >= range.from) && (!range.to || r.date <= range.to))
      .map((r) => ({ ...r, balance: (bal += r.debit - r.credit) }));
    return { lines, opening };
  }, [cases, allInvoices, payments, credits, current, range]);
  const balance = lines.at(-1)?.balance ?? opening;

  return (
    <div className="space-y-5">
      {fixed ? (
        <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print statement</Button></div>
      ) : (
      <PageHeader title="Statements" description="Running account per client clinic: work billed, payments and credits.">
        <Button variant="outline" onClick={() => window.print()} disabled={!current}><Printer className="mr-1 h-4 w-4" />Print</Button>
      </PageHeader>
      )}
      <div className="flex flex-wrap items-end gap-3">
        {!fixed && <Select value={current} onValueChange={setClient}>
          <SelectTrigger className="w-full max-w-sm"><SelectValue placeholder="Choose a clinic" /></SelectTrigger>
          <SelectContent>{data.map((c) => <SelectItem key={c.name} value={c.name}>{c.name} · {money(c.balance)}</SelectItem>)}</SelectContent>
        </Select>}
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="this">This month</SelectItem>
            <SelectItem value="last">Last month</SelectItem>
            <SelectItem value="custom">Custom dates</SelectItem>
          </SelectContent>
        </Select>
        {period === "custom" && (<>
          <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
          <Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        </>)}
        {current && <p className="text-sm sm:ml-auto">Balance owing: <span className={`text-lg font-bold ${balance > 0 ? "text-destructive" : ""}`}>{money(balance)}</span></p>}
      </div>
      <Card><CardContent className="overflow-x-auto p-0">
        {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> : !lines.length && !opening ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No activity for this client in this period.</p>
        ) : (
          <table className="w-full min-w-[520px] text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <tr><th className="p-3">Date</th><th className="p-3">Details</th><th className="p-3 text-right">Billed</th><th className="p-3 text-right">Paid / credit</th><th className="p-3 text-right">Balance</th></tr>
            </thead>
            <tbody className="divide-y">
              {range.from && (
                <tr className="bg-muted/30"><td className="p-3">{format(new Date(range.from), "d MMM yyyy")}</td><td className="p-3 font-medium">Opening balance</td><td /><td /><td className="p-3 text-right font-medium">{money(opening)}</td></tr>
              )}
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap p-3">{format(new Date(l.date), "d MMM yyyy")}</td>
                  <td className="p-3">{l.text}</td>
                  <td className="p-3 text-right">{l.debit ? money(l.debit) : ""}</td>
                  <td className="p-3 text-right">{l.credit ? money(l.credit) : ""}</td>
                  <td className="p-3 text-right font-medium">{money(l.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent></Card>
      {current && (
        <div className="break-inside-avoid border-t-2 border-dashed pt-4 text-sm">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">✂ Remittance advice — detach and return with payment</p>
          <div className="grid gap-2 sm:grid-cols-4">
            <div><p className="text-xs text-muted-foreground">Client</p><p className="font-medium">{current}</p></div>
            <div><p className="text-xs text-muted-foreground">Period</p><p className="font-medium">{range.from ? `${range.from} – ${range.to}` : "All time"}</p></div>
            <div><p className="text-xs text-muted-foreground">Amount due</p><p className="font-bold">{money(balance)}</p></div>
            <div><p className="text-xs text-muted-foreground">Amount paid / reference</p><p className="border-b pt-4" /></div>
          </div>
        </div>
      )}
    </div>
  );
}
