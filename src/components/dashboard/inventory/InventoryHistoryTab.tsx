import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useInventoryLedger, MOVEMENT_LABELS, isInbound, downloadCsv, type LedgerEntry } from "@/hooks/useInventoryLedger";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";

export function ledgerCsvRows(rows: LedgerEntry[]) {
  return [["Date", "Time", "Item", "Category", "Movement", "Qty", "Unit", "Balance before", "Balance after", "Unit cost", "Total value", "Branch", "Reference", "Notes", "Done by"],
    ...rows.map((r) => {
      const d = new Date(r.created_at);
      return [d.toLocaleDateString(), d.toLocaleTimeString(), r.item_name, r.item_category, MOVEMENT_LABELS[r.transaction_type] || r.transaction_type,
        (isInbound(r.transaction_type) ? "+" : "-") + r.quantity, r.item_unit, r.balance_before ?? "", r.balance_after ?? "", r.unit_cost, r.total_cost, r.other_branch ?? "", r.reference ?? "", r.notes ?? "", r.user_name];
    })];
}

export function MovementBadge({ type }: { type: string }) {
  const inb = isInbound(type);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${inb ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : type.startsWith("transfer") ? "bg-sky-500/10 text-sky-700 dark:text-sky-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
      {inb ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
      {MOVEMENT_LABELS[type] || type}
    </span>
  );
}

export function LedgerTable({ rows }: { rows: LedgerEntry[] }) {
  if (!rows.length) return <p className="py-12 text-center text-sm text-muted-foreground">No stock movements recorded for this selection.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
          {["When", "Item", "Movement", "Qty", "Balance", "Value", "Branch / Ref", "By"].map((h) => <th key={h} className="py-3 px-3 text-left font-medium">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30">
              <td className="py-2.5 px-3 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleDateString()}<div className="text-muted-foreground">{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></td>
              <td className="py-2.5 px-3 font-medium">{r.item_name}<div className="text-xs text-muted-foreground font-normal">{r.item_category}</div></td>
              <td className="py-2.5 px-3"><MovementBadge type={r.transaction_type} /></td>
              <td className={`py-2.5 px-3 font-semibold whitespace-nowrap ${isInbound(r.transaction_type) ? "text-emerald-600" : "text-red-600"}`}>{isInbound(r.transaction_type) ? "+" : "−"}{r.quantity} {r.item_unit}</td>
              <td className="py-2.5 px-3 text-xs whitespace-nowrap text-muted-foreground">{r.balance_before ?? "?"} → <span className="text-foreground font-medium">{r.balance_after ?? "?"}</span></td>
              <td className="py-2.5 px-3 whitespace-nowrap">₦{Number(r.total_cost || 0).toLocaleString()}</td>
              <td className="py-2.5 px-3 text-xs">{r.other_branch && <div className="font-medium">{r.transaction_type === "transfer_out" ? "To: " : "From: "}{r.other_branch}</div>}<div className="text-muted-foreground">{[r.reference, r.notes].filter(Boolean).join(" · ")}</div></td>
              <td className="py-2.5 px-3 text-xs">{r.user_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InventoryHistoryTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useInventoryLedger({ from: from || undefined, to: to || undefined });
  const rows = useMemo(() => data.filter((r) => {
    if (type !== "all" && r.transaction_type !== type) return false;
    const t = search.toLowerCase();
    if (t && !`${r.item_name} ${r.user_name} ${r.reference || ""} ${r.notes || ""} ${r.other_branch || ""}`.toLowerCase().includes(t)) return false;
    return true;
  }), [data, type, search]);
  const totals = useMemo(() => {
    const t = { in: 0, out: 0, used: 0, transferred: 0 };
    rows.forEach((r) => {
      if (isInbound(r.transaction_type)) t.in += r.quantity; else t.out += r.quantity;
      if (r.transaction_type === "usage") t.used += r.quantity;
      if (r.transaction_type === "transfer_out") t.transferred += r.quantity;
    });
    return t;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {[["Movements", rows.length], ["Units in", totals.in], ["Units out", totals.out], ["Used", totals.used], ["Sent to branches", totals.transferred]].map(([l, v]) => (
          <Card key={l as string} className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{v}</p></CardContent></Card>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search item, staff, reference, branch…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All movements</SelectItem>
            {Object.entries(MOVEMENT_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" className="w-[150px]" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" className="w-[150px]" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        <Button variant="outline" size="sm" disabled={!rows.length} onClick={() => downloadCsv(`stock-movements-${new Date().toISOString().slice(0, 10)}.csv`, ledgerCsvRows(rows))}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>
      <Card className="glass-card overflow-hidden"><CardContent className="p-0">
        {isLoading ? <TableSkeleton columns={8} rows={6} /> : <LedgerTable rows={rows} />}
      </CardContent></Card>
    </div>
  );
}
