import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateInventoryItem, type InventoryItem } from "@/hooks/useInventory";
import { toast } from "@/hooks/use-toast";

const categories = ["Consumables", "Materials", "Medication", "Instruments", "General"];

interface EditInventoryDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInventoryDialog({ item, open, onOpenChange }: EditInventoryDialogProps) {
  const updateItem = useUpdateInventoryItem();
  const [form, setForm] = useState({ name: "", category: "General", unit: "pcs", min_stock: "5", supplier: "", unit_cost: "", expiry_date: "" });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        category: item.category,
        unit: item.unit,
        min_stock: String(item.min_stock),
        supplier: item.supplier || "",
        unit_cost: item.unit_cost != null ? String(item.unit_cost) : "",
        expiry_date: item.expiry_date || "",
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!item || !form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    try {
      await updateItem.mutateAsync({
        id: item.id,
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        min_stock: parseInt(form.min_stock) || 0,
        supplier: form.supplier || null,
        unit_cost: form.unit_cost === "" ? null : parseFloat(form.unit_cost),
        expiry_date: form.expiry_date || null,
      });
      toast({ title: "Item updated" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Could not save", description: err.message, variant: "destructive" });
    }
  };

  const allCats = item && !categories.includes(item.category) ? [...categories, item.category] : categories;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Inventory Item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unit</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Min Stock</Label>
              <Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unit Cost (₦)</Label>
              <Input type="number" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Supplier</Label>
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Expiry Date</Label>
              <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90" disabled={updateItem.isPending}>
            {updateItem.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
