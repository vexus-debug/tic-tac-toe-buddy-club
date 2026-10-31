import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLabRecords } from "@/hooks/useLabRecords";
import {
  STORE_SECTIONS, storeSection, filterStock, stockState, stockSummary, materialSpecs,
  type StoreFilter, type CatalogRecord,
} from "@/lib/labCatalog";
import LabRegisterPage from "./LabRegisterPage";

const today = () => new Date().toISOString().slice(0, 10);
const PILLS: { value: StoreFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "usable", label: "Usable" },
  { value: "low", label: "Low stock" },
  { value: "expiring", label: "Expiring ≤30d" },
  { value: "quarantine", label: "Quarantine / recalled" },
];
const stateTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "in stock": "secondary", low: "default", "used up": "outline", expired: "destructive", recalled: "destructive",
};

function LotTable({ rows, day }: { rows: CatalogRecord[]; day: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">No lots match.</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="p-2">Material</th><th className="p-2">Lot</th><th className="p-2">Spec</th>
            <th className="p-2 text-right">Qty / min</th><th className="p-2">Expiry</th><th className="p-2">State</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = stockState(r, day);
            return (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-medium">{r.title}<div className="text-xs text-muted-foreground">{r.data?.brand}</div></td>
                <td className="p-2 font-mono text-xs">{r.data?.lot || "—"}</td>
                <td className="p-2 text-xs">{materialSpecs(r) || "—"}{r.data?.platform && r.data.platform !== "Not applicable" ? ` · ${r.data.platform}` : ""}</td>
                <td className="p-2 text-right tabular-nums">{Number(r.amount || 0)} / {Number(r.data?.min_stock || 0)} {r.data?.unit || ""}</td>
                <td className="p-2 text-xs">{r.record_date || "—"}</td>
                <td className="p-2"><Badge variant={stateTone[s]}>{s}</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function DlabStorePage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || STORE_SECTIONS[0];
  const filter = (params.get("f") as StoreFilter) || "all";
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); p.set(k, v); setParams(p); };
  const { data = [] } = useLabRecords("materials");
  const day = today();
  const rows = data as unknown as CatalogRecord[];
  const sum = stockSummary(rows, day);
  const bySection = useMemo(() => {
    const m = new Map<string, CatalogRecord[]>(STORE_SECTIONS.map((s) => [s, []]));
    rows.forEach((r) => m.get(storeSection(r.data?.category))!.push(r));
    return m;
  }, [rows]);

  const kpis = [
    { label: "Usable lots", value: sum.usable, f: "usable" as StoreFilter },
    { label: "Low stock", value: sum.low, f: "low" as StoreFilter },
    { label: "Expiring ≤30d", value: sum.expiringSoon, f: "expiring" as StoreFilter },
    { label: "Quarantined", value: sum.recalled + sum.expired, f: "quarantine" as StoreFilter },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <button key={k.label} onClick={() => set("f", k.f)} className="text-left">
            <Card className={filter === k.f ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="text-2xl font-semibold tabular-nums">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {PILLS.map((p) => (
          <Button key={p.value} size="sm" variant={filter === p.value ? "default" : "outline"} onClick={() => set("f", p.value)}>{p.label}</Button>
        ))}
      </div>
      <Tabs value={tab} onValueChange={(v) => set("tab", v)} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {STORE_SECTIONS.map((s) => (
            <TabsTrigger key={s} value={s}>{s} <Badge variant="secondary" className="ml-2">{bySection.get(s)!.length}</Badge></TabsTrigger>
          ))}
          <TabsTrigger value="manage">Manage lots</TabsTrigger>
        </TabsList>
        {STORE_SECTIONS.map((s) => (
          <TabsContent key={s} value={s}><LotTable rows={filterStock(bySection.get(s)!, filter, day)} day={day} /></TabsContent>
        ))}
        <TabsContent value="manage"><LabRegisterPage kind="materials" /></TabsContent>
      </Tabs>
    </div>
  );
}
