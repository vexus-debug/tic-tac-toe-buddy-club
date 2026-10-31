import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLabRecords, useSaveLabRecord } from "@/hooks/useLabRecords";
import { tierPrice } from "@/lib/labStatements";
import { money } from "../dlabMoney";

/** Spreadsheet-style list price per work type with computed tier columns. */
export default function PriceMatrixEditor() {
  const { data: works = [] } = useLabRecords("work-types");
  const { data: tierRecs = [] } = useLabRecords("price-tiers");
  const save = useSaveLabRecord("work-types");
  const [q, setQ] = useState("");
  const tiers = tierRecs.filter((t) => t.status === "active" && t.title?.toLowerCase() !== "standard");
  const rows = works.filter((w) => w.status !== "retired" && w.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <Card><CardContent className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Price matrix</h3>
          <p className="text-xs text-muted-foreground">Edit a list price; tier prices update from the discounts in Price Schedules.</p>
        </div>
        <Input placeholder="Search work type" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <tr><th className="p-2">Work type</th><th className="p-2 text-right">List price</th>
              {tiers.map((t) => <th key={t.id} className="p-2 text-right">{t.title} (−{Number(t.amount)}%)</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((w) => (
              <tr key={w.id}>
                <td className="p-2 font-medium">{w.title}{w.data?.cdt ? <span className="ml-1 text-xs text-muted-foreground">{w.data.cdt}</span> : null}</td>
                <td className="p-2 text-right">
                  <Input type="number" defaultValue={Number(w.amount || 0)} className="ml-auto h-8 w-28 text-right"
                    onBlur={(e) => { const v = Number(e.target.value); if (v !== Number(w.amount)) save.mutate({ ...w, amount: v }); }} />
                </td>
                {tiers.map((t) => <td key={t.id} className="p-2 text-right">{money(tierPrice(Number(w.amount), Number(t.amount)))}</td>)}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={2 + tiers.length} className="p-6 text-center text-muted-foreground">No work types in the catalogue yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </CardContent></Card>
  );
}
