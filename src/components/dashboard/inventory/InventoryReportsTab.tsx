import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Printer, Package, AlertTriangle, CalendarClock, ArrowLeftRight, TrendingDown, Wallet, History, ShoppingCart } from "lucide-react";
import type { InventoryItem } from "@/hooks/useInventory";
import { useInventoryLedger, downloadCsv, printReport, MOVEMENT_LABELS, isInbound } from "@/hooks/useInventoryLedger";
import { useOrg } from "@/hooks/useOrg";

type Row = (string | number | null | undefined)[];
interface Report { key: string; title: string; description: string; icon: any; build: () => { headers: string[]; rows: Row[]; summary?: [string, string][] } }

const money = (n: number) => `₦${Math.round(n).toLocaleString()}`;
const daysTo = (d?: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null);

export function InventoryReportsTab({ inventory }: { inventory: InventoryItem[] }) {
  const { currentOrg } = useOrg();
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const { data: ledger = [] } = useInventoryLedger({ from, to });
  const period = `${from} to ${to}`;

  // usage per item in period → used for consumption & reorder
  const usage = useMemo(() => {
    const m: Record<string, { used: number; wasted: number; bought: number; spent: number; sentOut: number; received: number }> = {};
    ledger.forEach((r) => {
      const e = (m[r.inventory_id] ||= { used: 0, wasted: 0, bought: 0, spent: 0, sentOut: 0, received: 0 });
      if (r.transaction_type === "usage") e.used += r.quantity;
      if (r.transaction_type === "adjustment") e.wasted += r.quantity;
      if (r.transaction_type === "purchase") { e.bought += r.quantity; e.spent += Number(r.total_cost || 0); }
      if (r.transaction_type === "transfer_out") e.sentOut += r.quantity;
      if (r.transaction_type === "transfer_in") e.received += r.quantity;
    });
    return m;
  }, [ledger]);
  const periodDays = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);

  const status = (i: InventoryItem) => (i.quantity <= 0 ? "Out of stock" : i.quantity <= i.min_stock ? "Low" : "OK");
  const totalValue = inventory.reduce((s, i) => s + i.quantity * Number(i.unit_cost || 0), 0);

  const reports: Report[] = [
    { key: "stock", title: "Current stock report", description: "Every item with quantity, minimum level, status, supplier and expiry.", icon: Package,
      build: () => ({ headers: ["Item", "Category", "Qty", "Unit", "Min", "Status", "Unit cost", "Value", "Supplier", "Expiry", "Last restocked"],
        rows: inventory.map((i) => [i.name, i.category, i.quantity, i.unit, i.min_stock, status(i), i.unit_cost ?? "", money(i.quantity * Number(i.unit_cost || 0)), i.supplier ?? "", i.expiry_date ?? "", i.last_restocked ?? ""]),
        summary: [["Items", String(inventory.length)], ["Stock value", money(totalValue)], ["Low / out", String(inventory.filter((i) => i.quantity <= i.min_stock).length)]] }) },
    { key: "valuation", title: "Stock valuation by category", description: "How much money is sitting on your shelves, grouped by category.", icon: Wallet,
      build: () => {
        const m: Record<string, { items: number; units: number; value: number }> = {};
        inventory.forEach((i) => { const e = (m[i.category] ||= { items: 0, units: 0, value: 0 }); e.items++; e.units += i.quantity; e.value += i.quantity * Number(i.unit_cost || 0); });
        const rows = Object.entries(m).sort((a, b) => b[1].value - a[1].value).map(([c, v]) => [c, v.items, v.units, money(v.value), totalValue ? `${((v.value / totalValue) * 100).toFixed(1)}%` : "0%"]);
        return { headers: ["Category", "Items", "Units", "Value", "% of total"], rows, summary: [["Total value", money(totalValue)]] };
      } },
    { key: "reorder", title: "Reorder list", description: "Low and out-of-stock items with suggested order quantity based on recent usage.", icon: ShoppingCart,
      build: () => {
        const rows = inventory.filter((i) => i.quantity <= i.min_stock).map((i) => {
          const daily = (usage[i.id]?.used || 0) / periodDays;
          const suggest = Math.max(i.min_stock * 2 - i.quantity, Math.ceil(daily * 30) - i.quantity, 1);
          return [i.name, i.category, i.quantity, i.min_stock, daily.toFixed(2), suggest, i.unit, i.supplier ?? "", money(suggest * Number(i.unit_cost || 0))];
        });
        return { headers: ["Item", "Category", "In stock", "Min", "Avg daily use", "Suggested order", "Unit", "Supplier", "Est. cost"], rows };
      } },
    { key: "expiry", title: "Expiry report", description: "Expired items and items expiring within 90 days, with value at risk.", icon: CalendarClock,
      build: () => {
        const list = inventory.filter((i) => { const d = daysTo(i.expiry_date); return d !== null && d <= 90; }).sort((a, b) => (daysTo(a.expiry_date)! - daysTo(b.expiry_date)!));
        return { headers: ["Item", "Qty", "Unit", "Expiry", "Days left", "Value at risk"],
          rows: list.map((i) => { const d = daysTo(i.expiry_date)!; return [i.name, i.quantity, i.unit, i.expiry_date, d < 0 ? "EXPIRED" : d, money(i.quantity * Number(i.unit_cost || 0))]; }),
          summary: [["Value at risk", money(list.reduce((s, i) => s + i.quantity * Number(i.unit_cost || 0), 0))]] };
      } },
    { key: "consumption", title: "Usage & consumption report", description: "What was used, written off, bought and transferred per item for the period.", icon: TrendingDown,
      build: () => {
        const rows = inventory.map((i) => { const u = usage[i.id] || { used: 0, wasted: 0, bought: 0, spent: 0, sentOut: 0, received: 0 };
          return [i.name, i.category, u.bought, u.received, u.used, u.wasted, u.sentOut, (u.used / periodDays).toFixed(2), money(u.used * Number(i.unit_cost || 0)), i.quantity]; })
          .filter((r) => r.slice(2, 7).some((v) => Number(v) > 0));
        return { headers: ["Item", "Category", "Bought", "Received", "Used", "Written off", "Sent out", "Avg/day", "Cost of use", "Now in stock"], rows,
          summary: [["Period", period], ["Items moved", String(rows.length)]] };
      } },
    { key: "movements", title: "Full stock movement log", description: "Every stock change with date, balance before/after and who did it.", icon: History,
      build: () => ({ headers: ["Date", "Item", "Movement", "Qty", "Before", "After", "Value", "Branch", "Reference", "By"],
        rows: ledger.map((r) => [new Date(r.created_at).toLocaleString(), r.item_name, MOVEMENT_LABELS[r.transaction_type] || r.transaction_type, (isInbound(r.transaction_type) ? "+" : "-") + r.quantity, r.balance_before ?? "", r.balance_after ?? "", money(Number(r.total_cost || 0)), r.other_branch ?? "", [r.reference, r.notes].filter(Boolean).join(" · "), r.user_name]),
        summary: [["Period", period], ["Movements", String(ledger.length)]] }) },
    { key: "transfers", title: "Branch transfer report", description: "Stock sent to and received from other branches.", icon: ArrowLeftRight,
      build: () => { const t = ledger.filter((r) => r.transaction_type.startsWith("transfer"));
        return { headers: ["Date", "Item", "Direction", "Branch", "Qty", "Value", "Notes", "By"],
          rows: t.map((r) => [new Date(r.created_at).toLocaleString(), r.item_name, r.transaction_type === "transfer_out" ? "Sent" : "Received", r.other_branch ?? "", r.quantity, money(Number(r.total_cost || 0)), r.notes ?? "", r.user_name]),
          summary: [["Period", period], ["Transfers", String(t.length)]] }; } },
    { key: "purchases", title: "Purchases & spend report", description: "All restocks in the period with cost, grouped totals by supplier.", icon: FileSpreadsheet,
      build: () => { const p = ledger.filter((r) => r.transaction_type === "purchase");
        return { headers: ["Date", "Item", "Qty", "Unit cost", "Total", "Reference", "By"],
          rows: p.map((r) => [new Date(r.created_at).toLocaleDateString(), r.item_name, r.quantity, money(Number(r.unit_cost || 0)), money(Number(r.total_cost || 0)), r.reference ?? "", r.user_name]),
          summary: [["Period", period], ["Total spend", money(p.reduce((s, r) => s + Number(r.total_cost || 0), 0))]] }; } },
    { key: "deadstock", title: "Slow-moving / dead stock", description: "Items in stock with no usage during the selected period.", icon: AlertTriangle,
      build: () => ({ headers: ["Item", "Category", "Qty", "Unit", "Value tied up", "Last restocked"],
        rows: inventory.filter((i) => i.quantity > 0 && !(usage[i.id]?.used)).map((i) => [i.name, i.category, i.quantity, i.unit, money(i.quantity * Number(i.unit_cost || 0)), i.last_restocked ?? ""]) }) },
  ];

  const run = (r: Report, mode: "csv" | "pdf") => {
    const { headers, rows, summary } = r.build();
    if (mode === "csv") downloadCsv(`${r.key}-report-${today}.csv`, [headers, ...rows]);
    else printReport(r.title, `${currentOrg?.org_name || "Clinic"} · ${period}`, headers, rows, summary);
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card"><CardContent className="p-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" /></div>
        <p className="text-xs text-muted-foreground flex-1 min-w-[200px]">The date range applies to usage, movement, transfer and purchase reports. Stock and valuation reports always show today's figures.</p>
      </CardContent></Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.key} className="glass-card"><CardContent className="p-4 flex flex-col h-full gap-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-secondary/10 flex items-center justify-center"><r.icon className="h-5 w-5 text-secondary" /></div>
              <div><p className="text-sm font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.description}</p></div>
            </div>
            <div className="mt-auto flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => run(r, "csv")}><FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel (CSV)</Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => run(r, "pdf")}><Printer className="mr-1.5 h-3.5 w-3.5" /> PDF / Print</Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
