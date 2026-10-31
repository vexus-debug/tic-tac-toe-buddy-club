import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePurchaseOrders, useUpdatePurchaseOrder, type PurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInventory } from "@/hooks/useInventory";
import { useOrg } from "@/hooks/useOrg";
import {
  usePurchaseOrderItems, useSavePurchaseOrder, useReceivePurchaseOrder, useCreateReorderDrafts,
  useClinicPath, makeOrderNumber, fmtNaira, type POLine,
} from "@/hooks/useSupply";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SupplyNav } from "@/components/dashboard/supply/SupplyNav";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Plus, ShoppingCart, PackageCheck, Send, Printer, Pencil, XCircle, Trash2, Wand2, Search } from "lucide-react";
import { format } from "date-fns";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ordered: "bg-secondary/15 text-secondary",
  partial: "bg-accent text-accent-foreground",
  received: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};
const statusLabel: Record<string, string> = { draft: "Draft", ordered: "Sent", partial: "Partly received", received: "Received", cancelled: "Cancelled" };
const today = () => new Date().toISOString().split("T")[0];
const emptyLine = (): POLine => ({ inventory_id: null, item_name: "", quantity: 1, unit_cost: 0 });

export default function PurchaseOrdersPage() {
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const { data: inventory = [] } = useInventory();
  const { currentOrg } = useOrg();
  const canManage = ["owner", "admin", "receptionist"].includes(currentOrg?.role || "");
  const updateOrder = useUpdatePurchaseOrder();
  const saveOrder = useSavePurchaseOrder();
  const receive = useReceivePurchaseOrder();
  const reorder = useCreateReorderDrafts();
  const path = useClinicPath();
  const [params, setParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState(params.get("supplier") || "all");

  // Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ order_number: "", supplier_id: "", expected_date: "", tax: "0", notes: "" });
  const [lines, setLines] = useState<POLine[]>([emptyLine()]);
  const { data: editingItems } = usePurchaseOrderItems(editingId);

  // Receive
  const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
  const { data: receiveItems = [] } = usePurchaseOrderItems(receivePo?.id);
  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({});

  const lowStock = inventory.filter((i) => i.quantity <= i.min_stock);

  const lastCost = (inventoryId: string) => Number(inventory.find((i) => i.id === inventoryId)?.unit_cost || 0);

  const openNew = (prefill?: POLine[], supplierId?: string) => {
    setEditingId(null);
    setForm({ order_number: makeOrderNumber(), supplier_id: supplierId || "", expected_date: "", tax: "0", notes: "" });
    setLines(prefill?.length ? prefill : [emptyLine()]);
    setEditorOpen(true);
  };

  const openEdit = (po: PurchaseOrder) => {
    setEditingId(po.id);
    setForm({ order_number: po.order_number, supplier_id: po.supplier_id || "", expected_date: po.expected_date || "", tax: String(po.tax || 0), notes: po.notes || "" });
    setLines([]);
    setEditorOpen(true);
  };

  useEffect(() => {
    if (editingId && editingItems) setLines(editingItems.length ? editingItems.map((i) => ({ inventory_id: i.inventory_id, item_name: i.item_name, quantity: i.quantity, unit_cost: Number(i.unit_cost) })) : [emptyLine()]);
  }, [editingId, editingItems]);

  // Deep link: ?item=<inventoryId> opens a new order for that item
  useEffect(() => {
    const itemId = params.get("item");
    if (!itemId || !inventory.length) return;
    const it = inventory.find((i) => i.id === itemId);
    if (it) {
      const qty = Math.max(1, Number(it.reorder_qty) || Math.max(it.min_stock * 2 - it.quantity, 1));
      openNew([{ inventory_id: it.id, item_name: it.name, quantity: qty, unit_cost: Number(it.unit_cost || 0) }], it.preferred_supplier_id || "");
    }
    params.delete("item");
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory.length]);

  useEffect(() => {
    if (receivePo) setReceiveQty(Object.fromEntries(receiveItems.map((i) => [i.id, String(Math.max(0, i.quantity - i.received_qty))])));
  }, [receivePo, receiveItems]);

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);
  const tax = parseFloat(form.tax) || 0;

  const setLine = (idx: number, patch: Partial<POLine>) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const handleSave = async (status?: string) => {
    await saveOrder.mutateAsync({
      id: editingId || undefined,
      order_number: form.order_number.trim() || makeOrderNumber(),
      supplier_id: form.supplier_id || null,
      expected_date: form.expected_date || null,
      notes: form.notes || null,
      tax,
      status,
      lines,
    });
    setEditorOpen(false);
  };

  const handleReceive = async () => {
    if (!receivePo) return;
    const payload = Object.entries(receiveQty).map(([item_id, q]) => ({ item_id, qty: parseInt(q) || 0 })).filter((l) => l.qty > 0);
    if (!payload.length) return;
    await receive.mutateAsync({ poId: receivePo.id, lines: payload });
    setReceivePo(null);
  };

  const printOrder = async (po: PurchaseOrder) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: items = [] } = await (supabase as any).from("purchase_order_items").select("*").eq("po_id", po.id);
    const sup = suppliers.find((s) => s.id === po.supplier_id);
    const esc = (s: any) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${esc(po.order_number)}</title><style>body{font-family:system-ui;padding:32px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{font-size:12px;text-transform:uppercase;color:#555}.r{text-align:right}</style></head><body>
      <h2>Purchase Order ${esc(po.order_number)}</h2>
      <p><b>${esc(currentOrg?.org_name || (currentOrg as any)?.name || "")}</b></p>
      <p>Supplier: ${esc(sup?.name || "—")}<br/>${esc(sup?.contact_person || "")} ${esc(sup?.phone || "")} ${esc(sup?.email || "")}<br/>${esc(sup?.address || "")}</p>
      <p>Order date: ${esc(po.order_date)}${po.expected_date ? ` · Expected: ${esc(po.expected_date)}` : ""}</p>
      <table><tr><th>Item</th><th class="r">Qty</th><th class="r">Unit cost</th><th class="r">Total</th></tr>
      ${(items as any[]).map((i) => `<tr><td>${esc(i.item_name)}</td><td class="r">${i.quantity}</td><td class="r">${fmtNaira(i.unit_cost)}</td><td class="r">${fmtNaira(i.total)}</td></tr>`).join("")}
      <tr><td colspan="3" class="r">Subtotal</td><td class="r">${fmtNaira(po.subtotal)}</td></tr>
      <tr><td colspan="3" class="r">Tax</td><td class="r">${fmtNaira(po.tax)}</td></tr>
      <tr><td colspan="3" class="r"><b>Total</b></td><td class="r"><b>${fmtNaira(po.total)}</b></td></tr></table>
      ${po.notes ? `<p>Notes: ${esc(po.notes)}</p>` : ""}
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const isOverdue = (po: PurchaseOrder) => ["ordered", "partial"].includes(po.status) && !!po.expected_date && po.expected_date < today();

  const visible = useMemo(() => orders.filter((po) => {
    if (statusFilter === "open" && !["draft", "ordered", "partial"].includes(po.status)) return false;
    if (statusFilter === "overdue" && !isOverdue(po)) return false;
    if (!["all", "open", "overdue"].includes(statusFilter) && po.status !== statusFilter) return false;
    if (supplierFilter !== "all" && po.supplier_id !== supplierFilter) return false;
    if (search && !`${po.order_number} ${po.suppliers?.name || ""} ${po.notes || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [orders, statusFilter, supplierFilter, search]);

  const openValue = orders.filter((o) => ["ordered", "partial"].includes(o.status)).reduce((s, o) => s + Number(o.total), 0);
  const overdueCount = orders.filter(isOverdue).length;

  return (
    <div className="space-y-6">
      <SupplyNav />
      <PageHeader title="Purchase Orders" description={`${orders.length} orders · ${fmtNaira(openValue)} awaiting delivery`}>
        {canManage && lowStock.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => reorder.mutate(lowStock)} disabled={reorder.isPending}>
            <Wand2 className="mr-2 h-4 w-4" /> Reorder {lowStock.length} low-stock items
          </Button>
        )}
        {canManage && (
          <Button data-tour="purchase-orders-add" size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => openNew()}>
            <Plus className="mr-2 h-4 w-4" /> New PO
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Drafts", value: orders.filter((o) => o.status === "draft").length, f: "draft" },
          { label: "Sent to supplier", value: orders.filter((o) => ["ordered", "partial"].includes(o.status)).length, f: "open" },
          { label: "Overdue", value: overdueCount, f: "overdue" },
          { label: "Received", value: orders.filter((o) => o.status === "received").length, f: "received" },
        ].map((s) => (
          <button key={s.label} onClick={() => setStatusFilter(s.f)} className={`rounded-xl border p-4 text-left transition-colors ${statusFilter === s.f ? "border-secondary bg-secondary/5" : "border-border/50 bg-card hover:bg-accent/30"}`}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.f === "overdue" && s.value > 0 ? "text-destructive" : ""}`}>{s.value}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 h-9" placeholder="Search PO number, supplier, notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            {Object.entries(statusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All suppliers</SelectItem>
            {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card data-tour="purchase-orders-table" className="glass-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : orders.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No purchase orders" description="Create an order, or reorder your low-stock items in one click." actionLabel="New PO" onAction={() => openNew()} />
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No orders match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 text-left font-medium">PO #</th>
                    <th className="py-3 px-4 text-left font-medium">Supplier</th>
                    <th className="py-3 px-4 text-left font-medium">Ordered</th>
                    <th className="py-3 px-4 text-left font-medium">Expected</th>
                    <th className="py-3 px-4 text-left font-medium">Total</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((po) => (
                    <tr key={po.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30">
                      <td className="py-3 px-4 font-mono font-medium">{po.order_number}</td>
                      <td className="py-3 px-4">
                        {po.supplier_id ? <Link to={`${path("suppliers")}?open=${po.supplier_id}`} className="text-secondary hover:underline">{po.suppliers?.name || "Supplier"}</Link> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{format(new Date(po.order_date), "dd MMM yyyy")}</td>
                      <td className="py-3 px-4">
                        {po.expected_date ? <span className={isOverdue(po) ? "font-medium text-destructive" : "text-muted-foreground"}>{format(new Date(po.expected_date), "dd MMM")}{isOverdue(po) ? " · overdue" : ""}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 px-4 font-semibold">{fmtNaira(po.total)}</td>
                      <td className="py-3 px-4">
                        <span data-tour="purchase-orders-status" className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[po.status] || ""}`}>{statusLabel[po.status] || po.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {canManage && po.status === "draft" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(po)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button data-tour="purchase-orders-mark-ordered" variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateOrder.mutate({ id: po.id, status: "ordered", order_date: today() })}>
                                <Send className="mr-1 h-3 w-3" /> Mark sent
                              </Button>
                            </>
                          )}
                          {canManage && ["ordered", "partial"].includes(po.status) && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setReceivePo(po)}>
                              <PackageCheck className="mr-1 h-3 w-3" /> Receive
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Print" onClick={() => printOrder(po)}><Printer className="h-3.5 w-3.5" /></Button>
                          {canManage && ["draft", "ordered"].includes(po.status) && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Cancel order" onClick={() => confirm("Cancel this order?") && updateOrder.mutate({ id: po.id, status: "cancelled" })}><XCircle className="h-3.5 w-3.5" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">PO Number</Label>
                <Input value={form.order_number} onChange={(e) => setForm({ ...form, order_number: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Supplier</Label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>{suppliers.filter((s) => s.status !== "inactive").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expected delivery</Label>
                <Input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
              </div>
            </div>

            <div className="rounded-lg border border-border/50">
              <div className="grid grid-cols-[1fr_80px_110px_100px_32px] gap-2 border-b bg-muted/20 px-3 py-2 text-[11px] uppercase text-muted-foreground">
                <span>Item</span><span>Qty</span><span>Unit cost</span><span className="text-right">Total</span><span />
              </div>
              {lines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_110px_100px_32px] items-center gap-2 px-3 py-2 border-b border-border/30 last:border-0">
                  <Select
                    value={l.inventory_id || (l.item_name ? "__custom" : "")}
                    onValueChange={(v) => {
                      if (v === "__custom") return setLine(idx, { inventory_id: null });
                      const it = inventory.find((i) => i.id === v);
                      setLine(idx, { inventory_id: v, item_name: it?.name || "", unit_cost: lastCost(v) });
                    }}
                  >
                    <SelectTrigger className="h-8"><SelectValue placeholder="Pick item">{l.item_name || undefined}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {inventory.map((i) => <SelectItem key={i.id} value={i.id}>{i.name} · {i.quantity} {i.unit} in stock</SelectItem>)}
                      <SelectItem value="__custom">Other (not in inventory)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="h-8" type="number" min={1} value={l.quantity} onChange={(e) => setLine(idx, { quantity: parseInt(e.target.value) || 0 })} />
                  <Input className="h-8" type="number" min={0} value={l.unit_cost} onChange={(e) => setLine(idx, { unit_cost: parseFloat(e.target.value) || 0 })} />
                  <span className="text-right text-sm font-medium">{fmtNaira(l.quantity * l.unit_cost)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  {!l.inventory_id && (
                    <Input className="h-8 col-span-5" placeholder="Item name" value={l.item_name} onChange={(e) => setLine(idx, { item_name: e.target.value })} />
                  )}
                </div>
              ))}
              <div className="px-3 py-2">
                <Button variant="ghost" size="sm" onClick={() => setLines((ls) => [...ls, emptyLine()])}><Plus className="mr-1 h-3.5 w-3.5" /> Add line</Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="space-y-2 rounded-lg bg-muted/30 p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmtNaira(subtotal)}</span></div>
                <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">Tax (₦)</span><Input className="h-7 w-24 text-right" type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></div>
                <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{fmtNaira(subtotal + tax)}</span></div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={saveOrder.isPending}>Save draft</Button>
            <Button className="bg-secondary hover:bg-secondary/90" onClick={() => handleSave("ordered")} disabled={saveOrder.isPending}>
              <Send className="mr-1 h-4 w-4" /> Save & mark sent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive */}
      <Dialog open={!!receivePo} onOpenChange={(o) => !o && setReceivePo(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Receive {receivePo?.order_number}</DialogTitle>
            <DialogDescription>Enter what arrived. Stock and cost records update automatically. Part deliveries are fine.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {receiveItems.map((i) => {
              const remaining = i.quantity - i.received_qty;
              return (
                <div key={i.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{i.item_name}</p>
                    <p className="text-xs text-muted-foreground">Ordered {i.quantity} · received {i.received_qty} · {fmtNaira(i.unit_cost)} each{!i.inventory_id ? " · not linked to inventory" : ""}</p>
                  </div>
                  <Input className="h-8 w-20" type="number" min={0} max={remaining} disabled={remaining <= 0} value={receiveQty[i.id] ?? ""} onChange={(e) => setReceiveQty((q) => ({ ...q, [i.id]: e.target.value }))} />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceivePo(null)}>Cancel</Button>
            <Button className="bg-secondary hover:bg-secondary/90" onClick={handleReceive} disabled={receive.isPending}>
              <PackageCheck className="mr-1 h-4 w-4" /> {receive.isPending ? "Saving…" : "Confirm delivery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
