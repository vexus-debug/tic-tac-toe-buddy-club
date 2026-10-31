import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { usePharmacyDrugs, useDispenses, useCreateDispense, type DispenseItem } from "@/hooks/pharmacy/usePharmacy";
import { Plus, Trash2, Receipt } from "lucide-react";

export default function DispensingPage() {
  const { data: drugs = [] } = usePharmacyDrugs();
  const { data: dispenses = [] } = useDispenses();
  const create = useCreateDispense();

  const [patientName, setPatientName] = useState("");
  const [notes, setNotes] = useState("");
  const [makeInvoice, setMakeInvoice] = useState(true);
  const [items, setItems] = useState<DispenseItem[]>([]);

  const addItem = (drugId: string) => {
    const d = drugs.find((x) => x.id === drugId);
    if (!d) return;
    setItems([...items, { drug_id: d.id, drug_name: d.name, quantity: 1, unit_price: Number(d.unit_price), total: Number(d.unit_price) }]);
  };

  const setQty = (i: number, qty: number) => {
    const next = [...items];
    next[i] = { ...next[i], quantity: qty, total: qty * Number(next[i].unit_price) };
    setItems(next);
  };

  const total = items.reduce((s, i) => s + Number(i.total || 0), 0);

  const submit = async () => {
    if (!patientName.trim() || items.length === 0) return;
    await create.mutateAsync({ patient_name: patientName, notes, items, createInvoice: makeInvoice });
    setPatientName("");
    setNotes("");
    setItems([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dispensing" description="Hand out medicines and bill for them" />

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">New dispense</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Patient name</Label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
            </div>
            <div>
              <Label>Add drug</Label>
              <Select value="" onValueChange={addItem}>
                <SelectTrigger><SelectValue placeholder="Choose a drug…" /></SelectTrigger>
                <SelectContent>
                  {drugs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} {d.strength || ""} · {d.stock_quantity} left
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((i, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-md border border-border/40 px-3 py-2">
                <span className="flex-1 text-sm">{i.drug_name}</span>
                <Input
                  type="number"
                  className="w-20"
                  value={i.quantity}
                  onChange={(e) => setQty(idx, Number(e.target.value || 0))}
                />
                <span className="w-24 text-right text-sm">{Number(i.total).toLocaleString()}</span>
                <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, n) => n !== idx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-muted-foreground">No items added yet.</p>}
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={makeInvoice} onCheckedChange={setMakeInvoice} />
              <span className="text-sm">Create an invoice</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Total {total.toLocaleString()}</span>
              <Button onClick={submit} disabled={create.isPending}>
                <Plus className="mr-2 h-4 w-4" /> Dispense
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Recent dispenses</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {dispenses.map((d: any) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{d.patient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleString()} ·{" "}
                  {(d.pharmacy_dispense_items || []).map((i: any) => `${i.drug_name} x${i.quantity}`).join(", ") || "—"}
                </p>
              </div>
              <Badge variant="outline">{Number(d.total_amount).toLocaleString()}</Badge>
            </div>
          ))}
          {dispenses.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <Receipt className="mx-auto mb-2 h-6 w-6 opacity-40" />
              Nothing dispensed yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
