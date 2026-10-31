import { useMemo, useState } from "react";
import { ActiveVisitBar } from "@/components/dashboard/PatientVisitBar";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTreatmentMaterials, useCreateTreatmentMaterial, useDeleteTreatmentMaterial } from "@/hooks/useTreatmentMaterials";
import { useTreatments } from "@/hooks/useTreatments";
import { useInventory } from "@/hooks/useInventory";
import { useClinicPath, fmtNaira } from "@/hooks/useSupply";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SupplyNav } from "@/components/dashboard/supply/SupplyNav";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Plus, Trash2, Link2, AlertTriangle, Search, Info } from "lucide-react";

type Row = { inventory_id: string; quantity_used: string };

export default function TreatmentMaterialsPage() {
  const { data: materials = [], isLoading } = useTreatmentMaterials();
  const { data: treatments = [] } = useTreatments();
  const { data: inventory = [] } = useInventory();
  const createMaterial = useCreateTreatmentMaterial();
  const deleteMaterial = useDeleteTreatmentMaterial();
  const path = useClinicPath();
  const [addOpen, setAddOpen] = useState(false);
  const [treatmentId, setTreatmentId] = useState("");
  const [rows, setRows] = useState<Row[]>([{ inventory_id: "", quantity_used: "1" }]);
  const [search, setSearch] = useState("");

  const invById = useMemo(() => Object.fromEntries(inventory.map((i) => [i.id, i])), [inventory]);

  const groups = useMemo(() => {
    const g: Record<string, { treatment: any; items: any[]; cost: number; short: number }> = {};
    materials.forEach((m) => {
      const t = treatments.find((x: any) => x.id === m.treatment_id);
      const inv = invById[m.inventory_id];
      const e = (g[m.treatment_id] ||= { treatment: t || { id: m.treatment_id, name: m.treatments?.name || "Treatment", price: 0 }, items: [], cost: 0, short: 0 });
      e.items.push({ ...m, inv });
      e.cost += Number(m.quantity_used) * Number(inv?.unit_cost || 0);
      if (!inv || inv.quantity < Math.ceil(Number(m.quantity_used))) e.short++;
      else if (inv.quantity <= inv.min_stock) e.short += 0;
    });
    return Object.values(g)
      .filter((x) => !search || x.treatment.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.treatment.name.localeCompare(b.treatment.name));
  }, [materials, treatments, invById, search]);

  const openAdd = (tid = "") => {
    setTreatmentId(tid);
    setRows([{ inventory_id: "", quantity_used: "1" }]);
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!treatmentId) return;
    const valid = rows.filter((r) => r.inventory_id && parseFloat(r.quantity_used) > 0);
    for (const r of valid) {
      await createMaterial.mutateAsync({ treatment_id: treatmentId, inventory_id: r.inventory_id, quantity_used: parseFloat(r.quantity_used) });
    }
    setAddOpen(false);
  };

  const totalShort = groups.reduce((s, g) => s + g.short, 0);

  return (
    <div className="space-y-6">
      <ActiveVisitBar />
      <SupplyNav />
      <PageHeader title="Treatment Materials" description="What each treatment uses, what it costs, and automatic stock deduction">
        <Button data-tour="treatment-materials-add" size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => openAdd()}>
          <Plus className="mr-2 h-4 w-4" /> Add Materials
        </Button>
      </PageHeader>

      <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        When an appointment with one of these treatments is marked completed, its materials are taken out of stock automatically and the cost is recorded under Inventory Costs.
      </div>

      {totalShort > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> {totalShort} material{totalShort > 1 ? "s" : ""} don't have enough stock for the next treatment.
          <Link to={path("purchase-orders")} className="ml-auto underline">Reorder</Link>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8 h-9" placeholder="Search treatments…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-0"><TableSkeleton columns={4} rows={5} /></CardContent></Card>
      ) : materials.length === 0 ? (
        <Card><CardContent className="p-0"><EmptyState icon={Link2} title="No material mappings" description="Link treatments to the items they use to track cost and stock automatically." actionLabel="Add Materials" onAction={() => openAdd()} /></CardContent></Card>
      ) : (
        <div data-tour="treatment-materials-table" className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => {
            const price = Number(g.treatment.price || 0);
            const margin = price > 0 ? Math.round(((price - g.cost) / price) * 100) : null;
            return (
              <Card key={g.treatment.id} className="glass-card overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{g.treatment.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Materials {fmtNaira(g.cost)}{price > 0 ? ` · Price ${fmtNaira(price)} · Margin ${margin}%` : ""}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openAdd(g.treatment.id)}><Plus className="mr-1 h-3 w-3" /> Add</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {g.items.map((m) => {
                    const need = Math.ceil(Number(m.quantity_used));
                    const short = !m.inv || m.inv.quantity < need;
                    const low = !short && m.inv && m.inv.quantity <= m.inv.min_stock;
                    return (
                      <div key={m.id} className="group flex items-center justify-between gap-2 border-b border-border/30 px-4 py-2.5 last:border-0 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{m.inv?.name || m.inventory?.name || "Removed item"}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.quantity_used} {m.inv?.unit || ""} per treatment · {fmtNaira(Number(m.quantity_used) * Number(m.inv?.unit_cost || 0))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] ${short ? "bg-destructive/10 text-destructive" : low ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                            {m.inv ? `${m.inv.quantity} in stock` : "missing"}
                          </span>
                          {short && m.inv && <Link to={`${path("purchase-orders")}?item=${m.inv.id}`} className="text-xs text-secondary underline">Order</Link>}
                          <Button data-tour="treatment-materials-delete" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMaterial.mutate(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Materials to a Treatment</DialogTitle>
            <DialogDescription>Add every item one treatment uses.</DialogDescription>
          </DialogHeader>
          <div data-tour="treatment-materials-form" className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Treatment *</Label>
              <Select value={treatmentId} onValueChange={setTreatmentId}>
                <SelectTrigger><SelectValue placeholder="Select treatment" /></SelectTrigger>
                <SelectContent>{treatments.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {rows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_90px_32px] gap-2 items-end">
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Item</Label>}
                  <Select value={r.inventory_id} onValueChange={(v) => setRows((rs) => rs.map((x, i) => (i === idx ? { ...x, inventory_id: v } : x)))}>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>{inventory.map((i) => <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">Qty each</Label>}
                  <Input type="number" min={0} step="0.5" value={r.quantity_used} onChange={(e) => setRows((rs) => rs.map((x, i) => (i === idx ? { ...x, quantity_used: e.target.value } : x)))} />
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-8 text-destructive" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setRows((rs) => [...rs, { inventory_id: "", quantity_used: "1" }])}><Plus className="mr-1 h-3.5 w-3.5" /> Another item</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-secondary hover:bg-secondary/90" disabled={createMaterial.isPending || !treatmentId}>
              {createMaterial.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
