import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  useShopProducts, useCreateShopProduct, useUpdateShopProduct, useDeleteShopProduct,
  useShopOrders, useUpdateShopOrder, useShopRevenue,
  type ShopProduct, type ShopOrder,
} from "@/hooks/useShop";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Plus, Package, ShoppingCart, Pencil, Trash2, DollarSign,
  TrendingUp, Eye, EyeOff, AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { ProductImageUploader } from "@/components/dashboard/ProductImageUploader";
import { useOrg } from "@/hooks/useOrg";
import { getClinicTerms } from "@/config/clinicTerminology";

const productCategories = ["General", "Oral Care", "Whitening", "Orthodontics", "Accessories", "Medication"];
const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  processing: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  shipped: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export default function ShopManagementPage() {
  const { data: products = [], isLoading: productsLoading } = useShopProducts();
  const createProduct = useCreateShopProduct();
  const updateProduct = useUpdateShopProduct();
  const deleteProduct = useDeleteShopProduct();
  const { data: orders = [], isLoading: ordersLoading } = useShopOrders();
  const updateOrder = useUpdateShopOrder();
  const { data: revenue } = useShopRevenue();
  const { currentOrg } = useOrg();

  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ShopProduct | null>(null);
  const [viewOrder, setViewOrder] = useState<ShopOrder | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", compare_at_price: "", category: "General",
    image_url: "", stock: "0", sku: "", is_active: true, features: "",
    images: [] as string[],
  });

  const resetForm = () => setForm({
    name: "", description: "", price: "", compare_at_price: "", category: "General",
    image_url: "", stock: "0", sku: "", is_active: true, features: "",
    images: [] as string[],
  });

  const openEdit = (p: ShopProduct) => {
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "",
      category: p.category,
      image_url: p.image_url || "",
      stock: String(p.stock),
      sku: p.sku || "",
      is_active: p.is_active,
      features: (p.features || []).join("\n"),
      images: p.images || [],
    });
    setEditProduct(p);
  };

  const handleSaveProduct = async () => {
    if (!form.name.trim() || !form.price) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      category: form.category,
      image_url: form.images[0] || form.image_url || null,
      images: form.images,
      stock: parseInt(form.stock) || 0,
      sku: form.sku || null,
      is_active: form.is_active,
      features: form.features.split("\n").filter(Boolean),
    };

    if (editProduct) {
      await updateProduct.mutateAsync({ id: editProduct.id, ...payload });
      toast({ title: "Product updated" });
      setEditProduct(null);
    } else {
      await createProduct.mutateAsync(payload);
      toast({ title: "Product created" });
      setAddOpen(false);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct.mutateAsync(id);
    toast({ title: "Product deleted" });
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    await updateOrder.mutateAsync({ id: orderId, status });
    toast({ title: `Order marked as ${status}` });
  };

  const lowStockProducts = products.filter((p) => p.stock <= 5 && p.is_active);

  return (
    <div className="space-y-6">
      <PageHeader title="Shop Management" description="Manage your online shop products and orders" />

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Shop Revenue</p>
                <p className="text-xl font-bold tabular-nums">₦{(revenue?.total || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                <p className="text-xl font-bold tabular-nums">{revenue?.count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Low Stock Items</p>
                <p className="text-xl font-bold tabular-nums">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="products"><Package className="mr-1.5 h-3.5 w-3.5" />Products ({products.length})</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingCart className="mr-1.5 h-3.5 w-3.5" />Orders ({orders.length})</TabsTrigger>
        </TabsList>

        {/* ── Products Tab ── */}
        <TabsContent value="products" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <p className="text-sm font-medium">{products.length} product{products.length !== 1 ? "s" : ""}</p>
                <Button size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => { resetForm(); setAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </div>
              <CardContent className="p-0">
                {productsLoading ? (
                  <TableSkeleton columns={7} rows={5} />
                ) : products.length === 0 ? (
                  <EmptyState icon={Package} title="No products yet" description="Add your first shop product." actionLabel="Add Product" onAction={() => setAddOpen(true)} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Product</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Category</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Price</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Stock</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, i) => (
                          <motion.tr key={p.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30 transition-all" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{p.name}</p>
                                  {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">{p.category}</td>
                            <td className="py-3 px-4 font-semibold tabular-nums">₦{Number(p.price).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold tabular-nums ${p.stock <= 5 ? "text-amber-600" : ""}`}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {p.is_active ? (
                                <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs"><Eye className="mr-1 h-3 w-3" />Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground text-xs"><EyeOff className="mr-1 h-3 w-3" />Hidden</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Orders Tab ── */}
        <TabsContent value="orders" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-0">
                {ordersLoading ? (
                  <TableSkeleton columns={7} rows={5} />
                ) : orders.length === 0 ? (
                  <EmptyState icon={ShoppingCart} title="No orders yet" description="Orders will appear here when customers buy from your shop." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Order #</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Customer</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Items</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Total</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o, i) => (
                          <motion.tr key={o.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30 transition-all" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                            <td className="py-3 px-4 font-mono font-medium text-xs">{o.order_number}</td>
                            <td className="py-3 px-4">
                              <p className="font-medium">{o.customer_name}</p>
                              {o.customer_phone && <p className="text-xs text-muted-foreground">{o.customer_phone}</p>}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-xs">{format(new Date(o.created_at), "dd MMM yyyy")}</td>
                            <td className="py-3 px-4 text-muted-foreground">{o.items?.length || 0}</td>
                            <td className="py-3 px-4 font-semibold tabular-nums">₦{Number(o.total).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusColors[o.status] || ""}`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setViewOrder(o)}>
                                  View
                                </Button>
                                {o.status === "pending" && (
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(o.id, "confirmed")}>
                                    Confirm
                                  </Button>
                                )}
                                {o.status === "confirmed" && (
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(o.id, "delivered")}>
                                    Mark Delivered
                                  </Button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Dialog */}
      <Dialog open={addOpen || !!editProduct} onOpenChange={(open) => { if (!open) { setAddOpen(false); setEditProduct(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={getClinicTerms(currentOrg?.clinic_type).shopProductNamePlaceholder} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={getClinicTerms(currentOrg?.clinic_type).shopProductDescriptionPlaceholder} className="min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Price (₦) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="5000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Compare-at Price (₦)</Label>
                <Input type="number" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} placeholder="7000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {productCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="TB-001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Stock Quantity</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Product Images</Label>
              <ProductImageUploader
                orgId={currentOrg?.org_id}
                images={form.images}
                onChange={(images) => setForm({ ...form, images })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Or paste an image URL</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Features (one per line)</Label>
              <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Sonic technology&#10;2-minute timer&#10;Waterproof" className="min-h-[60px]" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label className="text-xs">Active (visible in shop)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditProduct(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSaveProduct} className="bg-secondary hover:bg-secondary/90" disabled={createProduct.isPending || updateProduct.isPending}>
              {(createProduct.isPending || updateProduct.isPending) ? "Saving..." : editProduct ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order {viewOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{viewOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewOrder.customer_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{viewOrder.customer_email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Select value={viewOrder.status} onValueChange={(v) => { handleStatusChange(viewOrder.id, v); setViewOrder({ ...viewOrder, status: v }); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {viewOrder.shipping_address && (
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground">Delivery Address</p>
                  <p className="font-medium">{viewOrder.shipping_address}</p>
                </div>
              )}
              <div className="border-t border-border/30 pt-3">
                <p className="text-xs text-muted-foreground mb-2">Items</p>
                {(viewOrder.items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₦{Number(item.unit_price).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold">₦{Number(item.line_total).toLocaleString()}</p>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-bold">
                  <span>Total</span>
                  <span>₦{Number(viewOrder.total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
