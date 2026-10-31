import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { usePharmacyDrugs, useSaveDrug, useDeleteDrug, type PharmacyDrug } from "@/hooks/pharmacy/usePharmacy";
import { Plus, Trash2, Pill, Search } from "lucide-react";

const empty = {
  name: "", generic_name: "", form: "", strength: "", batch_number: "",
  expiry_date: "", unit_price: 0, stock_quantity: 0, reorder_level: 10, is_active: true,
};

export default function DrugStockPage() {
  const { data: drugs = [] } = usePharmacyDrugs();
  const save = useSaveDrug();
  const del = useDeleteDrug();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const filtered = drugs.filter((d) =>
    `${d.name} ${d.generic_name || ""}`.toLowerCase().includes(term.toLowerCase())
  );

  const submit = async () => {
    if (!form.name?.trim()) return;
    await save.mutateAsync({
      ...form,
      unit_price: Number(form.unit_price || 0),
      stock_quantity: Number(form.stock_quantity || 0),
      reorder_level: Number(form.reorder_level || 0),
      expiry_date: form.expiry_date || null,
    });
    setOpen(false);
    setForm(empty);
  };

  const lowStock = (d: PharmacyDrug) => d.stock_quantity <= d.reorder_level;

  return (
    <div className="space-y-6">
      <PageHeader title="Drug Stock" description="Medicines on hand, prices and reorder levels">
        <Button size="sm" onClick={() => { setForm(empty); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Drug
        </Button>
      </PageHeader>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search drugs…" value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map((d) => (
          <Card key={d.id} className="glass-card">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <button className="text-left" onClick={() => { setForm({ ...d, expiry_date: d.expiry_date || "" }); setOpen(true); }}>
                <p className="font-medium">
                  {d.name} {d.strength && <span className="text-xs text-muted-foreground">{d.strength}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.generic_name || "—"} · {d.form || "—"} · Batch {d.batch_number || "—"}
                  {d.expiry_date ? ` · exp ${new Date(d.expiry_date).toLocaleDateString()}` : ""}
                </p>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm">{Number(d.unit_price).toLocaleString()}</span>
                <Badge variant={lowStock(d) ? "destructive" : "outline"}>{d.stock_quantity} in stock</Badge>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Pill className="mx-auto mb-2 h-6 w-6 opacity-40" />
              No drugs on file.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit drug" : "Add drug"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Name</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Generic name</Label>
              <Input value={form.generic_name || ""} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
            </div>
            <div>
              <Label>Form</Label>
              <Input placeholder="Tablet, syrup…" value={form.form || ""} onChange={(e) => setForm({ ...form, form: e.target.value })} />
            </div>
            <div>
              <Label>Strength</Label>
              <Input value={form.strength || ""} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
            </div>
            <div>
              <Label>Batch number</Label>
              <Input value={form.batch_number || ""} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} />
            </div>
            <div>
              <Label>Expiry date</Label>
              <Input type="date" value={form.expiry_date || ""} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
            <div>
              <Label>Unit price</Label>
              <Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
            </div>
            <div>
              <Label>Stock quantity</Label>
              <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
            </div>
            <div>
              <Label>Reorder level</Label>
              <Input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
