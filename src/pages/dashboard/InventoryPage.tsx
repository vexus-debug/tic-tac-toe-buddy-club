import { useMemo, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCreateInventoryTransaction } from "@/hooks/useInventoryCosts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Pencil, Trash2, Package, Minus, Search, Download, History, ArrowLeftRight, FileText, CalendarClock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryHistoryTab } from "@/components/dashboard/inventory/InventoryHistoryTab";
import { InventoryTransfersTab, TransferDialog } from "@/components/dashboard/inventory/InventoryTransfersTab";
import { InventoryReportsTab } from "@/components/dashboard/inventory/InventoryReportsTab";
import { ItemHistoryDialog } from "@/components/dashboard/inventory/ItemHistoryDialog";
import { toast } from "@/hooks/use-toast";
import { useInventory, useAddInventoryItem, useDeleteInventoryItem } from "@/hooks/useInventory";
import { EditInventoryDialog } from "@/components/dashboard/EditInventoryDialog";
import { useOrg } from "@/hooks/useOrg";
import { getClinicTerms } from "@/config/clinicTerminology";
import type { InventoryItem } from "@/hooks/useInventory";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const categories = ["Consumables", "Materials", "Medication", "Instruments", "General"];

export default function InventoryPage() {
  const { data: inventory = [], isLoading } = useInventory();
  const addItem = useAddInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const { currentOrg } = useOrg();
  const orgRole = currentOrg?.role || "";
  const canManageStock = ["owner", "admin", "receptionist", "dentist", "assistant", "hygienist"].includes(orgRole);
  const canDelete = ["owner", "admin", "receptionist"].includes(orgRole);
  const canTransfer = ["owner", "admin"].includes(orgRole);
  const createTx = useCreateInventoryTransaction();
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [transferItemId, setTransferItemId] = useState<string | null>(null);
  const [reduceNotes, setReduceNotes] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out" | "expiring">("all");
  const [catFilter, setCatFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [restockCost, setRestockCost] = useState("");
  const [reduceReason, setReduceReason] = useState("usage");
  const [newUnitCost, setNewUnitCost] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [reduceId, setReduceId] = useState<string | null>(null);
  const [reduceQty, setReduceQty] = useState("");

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newQuantity, setNewQuantity] = useState("");
  const [newMinStock, setNewMinStock] = useState("");
  const [newUnit, setNewUnit] = useState("pcs");
  const [newSupplier, setNewSupplier] = useState("");

  const lowStock = inventory.filter((i) => i.quantity <= i.min_stock);
  const daysToExpiry = (d?: string | null) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;
  const expired = inventory.filter((i) => { const d = daysToExpiry(i.expiry_date); return d !== null && d < 0 && i.quantity > 0; });
  const expiringSoon = inventory.filter((i) => { const d = daysToExpiry(i.expiry_date); return d !== null && d >= 0 && d <= 30 && i.quantity > 0; });
  const allCategories = Array.from(new Set([...categories, ...inventory.map((i) => i.category)]));
  const visible = useMemo(() => inventory.filter((i) => {
    const t = search.toLowerCase();
    if (t && !`${i.name} ${i.supplier || ""} ${i.category}`.toLowerCase().includes(t)) return false;
    if (catFilter !== "all" && i.category !== catFilter) return false;
    if (filter === "low" && i.quantity > i.min_stock) return false;
    if (filter === "out" && i.quantity > 0) return false;
    if (filter === "expiring") { const d = daysToExpiry(i.expiry_date); if (d === null || d > 30) return false; }
    return true;
  }), [inventory, search, filter, catFilter]);
  const stockValue = inventory.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_cost || 0), 0);

  const exportCsv = () => {
    const rows = [["Name", "Category", "Quantity", "Unit", "Min Stock", "Unit Cost", "Supplier", "Expiry", "Last Restocked"],
      ...visible.map((i) => [i.name, i.category, i.quantity, i.unit, i.min_stock, i.unit_cost ?? "", i.supplier ?? "", i.expiry_date ?? "", i.last_restocked ?? ""])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleAddItem = async () => {
    if (!newName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    try {
      await addItem.mutateAsync({
        name: newName,
        category: newCategory,
        quantity: parseInt(newQuantity) || 0,
        min_stock: parseInt(newMinStock) || 5,
        unit: newUnit,
        supplier: newSupplier,
        unit_cost: newUnitCost === "" ? null : parseFloat(newUnitCost),
        expiry_date: newExpiry || null,
        last_restocked: new Date().toISOString().split("T")[0],
      });
      toast({ title: "Item added" });
      setAddOpen(false);
      setNewName(""); setNewQuantity(""); setNewMinStock(""); setNewSupplier(""); setNewUnitCost(""); setNewExpiry("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRestock = async () => {
    if (!restockId || !restockQty) return;
    const item = inventory.find((i) => i.id === restockId);
    if (!item) return;
    try {
      await createTx.mutateAsync({ inventory_id: restockId, transaction_type: "purchase", quantity: parseInt(restockQty), unit_cost: restockCost === "" ? Number(item.unit_cost || 0) : parseFloat(restockCost), reference: "Restock" });
      setRestockId(null);
      setRestockQty("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReduce = async () => {
    if (!reduceId || !reduceQty) return;
    const item = inventory.find((i) => i.id === reduceId);
    if (!item) return;
    const qty = parseInt(reduceQty);
    if (qty > item.quantity) {
      toast({ title: "Cannot reduce", description: "Amount exceeds current stock", variant: "destructive" });
      return;
    }
    try {
      await createTx.mutateAsync({ inventory_id: reduceId, transaction_type: reduceReason === "usage" ? "usage" : "adjustment", quantity: qty, unit_cost: Number(item.unit_cost || 0), reference: reduceReason === "usage" ? "Used" : reduceReason });
      setReduceId(null);
      setReduceQty("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Item deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${inventory.length} items tracked`}
        tutorial={{
          title: "Inventory — How to Use",
          description: getClinicTerms(currentOrg?.clinic_type).inventoryHelp,
          steps: [
            {
              title: "View all inventory items",
              description: "The table shows all tracked items with their current stock level, minimum stock threshold, category, unit, and supplier. Items are sorted by category.",
            },
            {
              title: "Spot low-stock alerts",
              description: "Items with quantity at or below their minimum stock are highlighted with a warning banner at the top. Restock these items before they run out.",
              tip: "Set minimum stock levels conservatively — it's better to reorder too early than to run out mid-procedure.",
            },
            {
              title: "Add a new inventory item",
              description: "Click 'Add Item'. Enter the item name, category (Consumables, Materials, Medication, Instruments, General), starting quantity, unit (pcs, ml, g), minimum stock level, and unit cost.",
            },
            {
              title: "Restock an item",
              description: "Click the + button on any item row to add stock when supplies arrive. Enter the quantity received and confirm. This updates the stock level immediately.",
            },
            {
              title: "Reduce stock manually",
              description: "Click the − button to reduce stock when items are used outside of tracked procedures. This helps keep your records accurate.",
            },
            {
              title: "Edit item details",
              description: "Click the pencil icon to update an item's name, minimum stock level, supplier, or unit cost. Keep supplier info updated so you can quickly reorder.",
            },
          ],
          nextPageHint: {
            label: "Purchase Orders",
            description: "When items need restocking, create a formal Purchase Order to send to your supplier.",
          },
        }}
        badge={lowStock.length > 0 ? (
          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/5">
            {lowStock.length} low stock
          </Badge>
        ) : undefined}
      >
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={!inventory.length}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
        <Button data-tour="inventory-add" size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </PageHeader>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="stock"><Package className="mr-1.5 h-3.5 w-3.5" />Stock</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1.5 h-3.5 w-3.5" />Activity log</TabsTrigger>
          <TabsTrigger value="transfers"><ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />Branch transfers</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="mr-1.5 h-3.5 w-3.5" />Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="space-y-6">

      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card data-tour="inventory-low-stock" className="border-amber-500/20 bg-amber-500/5 glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Low Stock Alert</p>
                <p className="text-xs text-muted-foreground">{lowStock.map((i) => i.name).join(", ")} are running low.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {(expired.length > 0 || expiringSoon.length > 0) && (
        <Card className="border-destructive/30 bg-destructive/5 glass-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium">Expiry Alert</p>
              <Button size="sm" variant="outline" className="ml-auto h-7" onClick={() => setFilter("expiring")}>Show items</Button>
            </div>
            {expired.length > 0 && <p className="text-xs"><span className="font-medium text-destructive">Expired:</span> {expired.map((i) => `${i.name} (${i.expiry_date})`).join(", ")}</p>}
            {expiringSoon.length > 0 && <p className="text-xs"><span className="font-medium">Expiring within 30 days:</span> {expiringSoon.map((i) => `${i.name} (${daysToExpiry(i.expiry_date)}d)`).join(", ")}</p>}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {[["Items", inventory.length], ["Low stock", lowStock.length], ["Out of stock", inventory.filter((i) => i.quantity <= 0).length], ["Expiring / expired", expiringSoon.length + expired.length], ["Stock value", `₦${stockValue.toLocaleString()}`]].map(([l, v]) => (
          <Card key={l as string} className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{v}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name, supplier, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-1">
          {([["all", "All"], ["low", "Low"], ["out", "Out"], ["expiring", "Expiring"]] as const).map(([k, l]) => (
            <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{l}</Button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card data-tour="inventory-table" className="glass-card overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton columns={7} rows={6} />
            ) : inventory.length === 0 ? (
              <EmptyState icon={Package} title="No inventory items" description="Add items to start tracking your inventory." actionLabel="Add Item" onAction={() => setAddOpen(true)} />
            ) : visible.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No items match your search or filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Item</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Category</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Stock</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Min</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Supplier</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item, i) => {
                      const isLow = item.quantity <= item.min_stock;
                      const isOut = item.quantity <= 0;
                      const exp = daysToExpiry(item.expiry_date);
                      return (
                        <motion.tr
                          key={item.id}
                          className="border-b border-border/30 last:border-0 hover:bg-accent/30 transition-all group"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <td className="py-3 px-4 font-medium group-hover:text-secondary transition-colors">
                            {item.name}
                            {exp !== null && exp <= 30 && (
                              <span className={`ml-2 text-[10px] rounded px-1.5 py-0.5 ${exp < 0 ? "bg-destructive/15 text-destructive" : "bg-amber-500/10 text-amber-700"}`}>
                                {exp < 0 ? "Expired" : `Expires in ${exp}d`}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                          <td className="py-3 px-4 font-semibold">{item.quantity} {item.unit}</td>
                          <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{item.min_stock}</td>
                          <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{item.supplier}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${isLow ? "bg-red-500/10 text-red-700 dark:text-red-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isLow ? "bg-red-500" : "bg-emerald-500"}`} />
                              {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              {canManageStock && (
                                <>
                                  <Button data-tour="inventory-restock" variant="outline" size="sm" className="h-7 text-xs border-border/50" onClick={() => { setRestockId(item.id); setRestockQty(""); setRestockCost(item.unit_cost != null ? String(item.unit_cost) : ""); }}>
                                    Restock
                                  </Button>
                                  <Button data-tour="inventory-use" variant="outline" size="sm" className="h-7 text-xs border-destructive/30 text-destructive" onClick={() => { setReduceId(item.id); setReduceQty(""); setReduceReason("usage"); }}>
                                    <Minus className="mr-1 h-3 w-3" /> Use
                                  </Button>
                                </>
                              )}
                              {canTransfer && item.quantity > 0 && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Transfer to branch" onClick={() => setTransferItemId(item.id)}>
                                  <ArrowLeftRight className="h-3.5 w-3.5" /><span className="sr-only">Transfer</span>
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Stock history" onClick={() => setHistoryItem(item)}>
                                <History className="h-3.5 w-3.5" /><span className="sr-only">History</span>
                              </Button>
                              <Button data-tour="inventory-edit" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditItem(item)}>
                                <Pencil className="h-3.5 w-3.5" /><span className="sr-only">Edit</span>
                              </Button>
                              {canDelete && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" aria-label="Delete item" onClick={() => setDeleteTarget(item)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
        </TabsContent>
        <TabsContent value="history"><InventoryHistoryTab /></TabsContent>
        <TabsContent value="transfers"><InventoryTransfersTab inventory={inventory} canTransfer={canTransfer} /></TabsContent>
        <TabsContent value="reports"><InventoryReportsTab inventory={inventory} /></TabsContent>
      </Tabs>

      <ItemHistoryDialog item={historyItem} onClose={() => setHistoryItem(null)} />
      {transferItemId && <TransferDialog open={!!transferItemId} onOpenChange={(o) => !o && setTransferItemId(null)} inventory={inventory} initialItemId={transferItemId} />}

      {/* Add Item Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="backdrop-blur-xl bg-card/95">
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Latex Gloves" className="bg-muted/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit</Label>
                <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="pcs" className="bg-muted/30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input type="number" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} placeholder="0" className="bg-muted/30" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Stock</Label>
                <Input type="number" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} placeholder="5" className="bg-muted/30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Unit Cost (₦)</Label>
                <Input type="number" value={newUnitCost} onChange={(e) => setNewUnitCost(e.target.value)} placeholder="0" className="bg-muted/30" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expiry Date</Label>
                <Input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} className="bg-muted/30" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Supplier</Label>
              <Input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder="Supplier name" className="bg-muted/30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} className="bg-secondary hover:bg-secondary/90" disabled={addItem.isPending}>
              {addItem.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={!!restockId} onOpenChange={(open) => !open && setRestockId(null)}>
        <DialogContent className="backdrop-blur-xl bg-card/95">
          <DialogHeader><DialogTitle>Restock Item</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs">Quantity to Add</Label>
            <Input type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="Enter quantity" className="bg-muted/30" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cost per unit (₦)</Label>
            <Input type="number" value={restockCost} onChange={(e) => setRestockCost(e.target.value)} placeholder="0" className="bg-muted/30" />
            <p className="text-[11px] text-muted-foreground">Recorded in Inventory Costs as a purchase.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockId(null)}>Cancel</Button>
            <Button onClick={handleRestock} className="bg-secondary hover:bg-secondary/90" disabled={createTx.isPending}>
              {createTx.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use/Reduce Stock Dialog */}
      <Dialog open={!!reduceId} onOpenChange={(open) => !open && setReduceId(null)}>
        <DialogContent className="backdrop-blur-xl bg-card/95">
          <DialogHeader><DialogTitle>Use Stock</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Reduce stock for items used, damaged, expired or lost.</p>
          <div className="space-y-1">
            <Label className="text-xs">Reason</Label>
            <Select value={reduceReason} onValueChange={setReduceReason}>
              <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="usage">Used in procedure</SelectItem>
                <SelectItem value="Damaged">Damaged</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Stock count correction">Stock count correction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Quantity Used</Label>
            <Input type="number" min={1} value={reduceQty} onChange={(e) => setReduceQty(e.target.value)} placeholder="Enter quantity used" className="bg-muted/30" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReduceId(null)}>Cancel</Button>
            <Button onClick={handleReduce} variant="destructive" disabled={createTx.isPending}>
              {createTx.isPending ? "Reducing..." : "Reduce Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the item from your inventory. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditInventoryDialog item={editItem} open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)} />
    </div>
  );
}