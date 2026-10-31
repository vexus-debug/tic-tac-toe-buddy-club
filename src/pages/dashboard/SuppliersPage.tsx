import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, type Supplier } from "@/hooks/useSuppliers";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useInventory } from "@/hooks/useInventory";
import { useSupplierStats, useClinicPath, fmtNaira } from "@/hooks/useSupply";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SupplyNav } from "@/components/dashboard/supply/SupplyNav";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Plus, Trash2, Truck, Pencil, Star, Search, Phone, Mail, ShoppingCart } from "lucide-react";

type S = Supplier & { payment_terms?: string | null; rating?: number | null; tax_id?: string | null; categories?: string[] | null };
const blank = { name: "", contact_person: "", email: "", phone: "", address: "", notes: "", payment_terms: "", rating: "", tax_id: "", categories: "", status: "active" };

function Stars({ n }: { n?: number | null }) {
  if (!n) return <span className="text-muted-foreground">—</span>;
  return <span className="inline-flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-3 w-3 ${i < n ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`} />)}</span>;
}

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: stats = {} } = useSupplierStats();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: inventory = [] } = useInventory();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const path = useClinicPath();
  const [params, setParams] = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<S | null>(null);
  const [form, setForm] = useState(blank);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [profile, setProfile] = useState<S | null>(null);

  useEffect(() => {
    const id = params.get("open");
    if (id && suppliers.length) {
      const s = suppliers.find((x) => x.id === id);
      if (s) setProfile(s as S);
      params.delete("open");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliers.length]);

  const openForm = (s?: S) => {
    setEditing(s || null);
    setForm(s ? {
      name: s.name, contact_person: s.contact_person || "", email: s.email || "", phone: s.phone || "", address: s.address || "", notes: s.notes || "",
      payment_terms: s.payment_terms || "", rating: s.rating ? String(s.rating) : "", tax_id: s.tax_id || "", categories: (s.categories || []).join(", "), status: s.status || "active",
    } : blank);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload: any = {
      ...form,
      name: form.name.trim(),
      rating: form.rating ? parseInt(form.rating) : null,
      categories: form.categories ? form.categories.split(",").map((c) => c.trim()).filter(Boolean) : null,
    };
    if (editing) await updateSupplier.mutateAsync({ id: editing.id, ...payload });
    else await createSupplier.mutateAsync(payload);
    setFormOpen(false);
  };

  const visible = useMemo(() => (suppliers as S[]).filter((s) => {
    if (statusFilter !== "all" && (s.status || "active") !== statusFilter) return false;
    const t = search.toLowerCase();
    if (t && !`${s.name} ${s.contact_person || ""} ${s.email || ""} ${(s.categories || []).join(" ")}`.toLowerCase().includes(t)) return false;
    return true;
  }), [suppliers, search, statusFilter]);

  const totalSpend = Object.values(stats).reduce((s, x) => s + x.totalSpend, 0);
  const profileStats = profile ? stats[profile.id] : undefined;
  const profileOrders = profile ? orders.filter((o) => o.supplier_id === profile.id) : [];
  const profileItems = profile ? inventory.filter((i) => i.preferred_supplier_id === profile.id) : [];

  return (
    <div className="space-y-6">
      <SupplyNav />
      <PageHeader title="Suppliers" description={`${suppliers.length} suppliers · ${fmtNaira(totalSpend)} spent`}>
        <Button data-tour="suppliers-add" size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => openForm()}>
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 h-9" placeholder="Search name, contact, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card data-tour="suppliers-table" className="glass-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : suppliers.length === 0 ? (
            <EmptyState icon={Truck} title="No suppliers" description="Add suppliers so you can link items and send purchase orders." actionLabel="Add Supplier" onAction={() => openForm()} />
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No suppliers match.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 text-left font-medium">Supplier</th>
                    <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Contact</th>
                    <th className="py-3 px-4 text-left font-medium">Items</th>
                    <th className="py-3 px-4 text-left font-medium">Orders</th>
                    <th className="py-3 px-4 text-left font-medium">Spend</th>
                    <th className="py-3 px-4 text-left font-medium hidden md:table-cell">On time</th>
                    <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Rating</th>
                    <th className="py-3 px-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => {
                    const st = stats[s.id];
                    return (
                      <tr key={s.id} className="border-b border-border/30 last:border-0 hover:bg-accent/30 cursor-pointer" onClick={() => setProfile(s)}>
                        <td className="py-3 px-4">
                          <p className="font-medium">{s.name}</p>
                          {s.categories?.length ? <p className="text-xs text-muted-foreground">{s.categories.join(", ")}</p> : null}
                          {s.status === "inactive" && <Badge variant="outline" className="mt-1 text-[10px]">Inactive</Badge>}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{s.contact_person || "—"}<br /><span className="text-xs">{s.phone || s.email || ""}</span></td>
                        <td className="py-3 px-4">{st?.itemCount || 0}</td>
                        <td className="py-3 px-4">{st?.orders || 0}{st?.openOrders ? <span className="text-xs text-muted-foreground"> ({st.openOrders} open)</span> : null}</td>
                        <td className="py-3 px-4 font-semibold">{fmtNaira(st?.totalSpend || 0)}</td>
                        <td className="py-3 px-4 hidden md:table-cell">{st?.onTimeRate != null ? `${st.onTimeRate}%` : "—"}</td>
                        <td className="py-3 px-4 hidden md:table-cell"><Stars n={s.rating} /></td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openForm(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button data-tour="suppliers-delete" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => confirm(`Delete ${s.name}?`) && deleteSupplier.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile */}
      <Sheet open={!!profile} onOpenChange={(o) => !o && setProfile(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {profile && (
            <>
              <SheetHeader>
                <SheetTitle>{profile.name}</SheetTitle>
                <SheetDescription>{profile.contact_person || "No contact person"}{profile.payment_terms ? ` · ${profile.payment_terms}` : ""}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                <div className="flex flex-wrap gap-3 text-muted-foreground">
                  {profile.phone && <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="h-3.5 w-3.5" />{profile.phone}</a>}
                  {profile.email && <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1 hover:text-foreground"><Mail className="h-3.5 w-3.5" />{profile.email}</a>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Total spend", fmtNaira(profileStats?.totalSpend || 0)],
                    ["Orders", String(profileStats?.orders || 0)],
                    ["On-time delivery", profileStats?.onTimeRate != null ? `${profileStats.onTimeRate}%` : "—"],
                    ["Avg. lead time", profileStats?.avgLeadDays != null ? `${profileStats.avgLeadDays} days` : "—"],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-lg bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="font-semibold">{v}</p></div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-secondary hover:bg-secondary/90" asChild>
                    <Link to={`${path("purchase-orders")}?supplier=${profile.id}`}><ShoppingCart className="mr-1 h-4 w-4" /> View orders</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openForm(profile)}><Pencil className="mr-1 h-4 w-4" /> Edit</Button>
                </div>
                <div>
                  <p className="mb-2 font-medium">Items they supply ({profileItems.length})</p>
                  {profileItems.length === 0 ? <p className="text-muted-foreground text-xs">No items linked yet. Set this supplier on items in Inventory.</p> : (
                    <div className="divide-y divide-border/40 rounded-lg border border-border/50">
                      {profileItems.map((i) => (
                        <div key={i.id} className="flex justify-between px-3 py-2">
                          <span>{i.name}</span>
                          <span className={i.quantity <= i.min_stock ? "text-destructive" : "text-muted-foreground"}>{i.quantity} {i.unit} · {fmtNaira(i.unit_cost || 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-2 font-medium">Recent orders</p>
                  {profileOrders.length === 0 ? <p className="text-muted-foreground text-xs">No orders yet.</p> : (
                    <div className="divide-y divide-border/40 rounded-lg border border-border/50">
                      {profileOrders.slice(0, 10).map((o) => (
                        <div key={o.id} className="flex justify-between px-3 py-2">
                          <span className="font-mono">{o.order_number}</span>
                          <span className="text-muted-foreground">{o.status} · {fmtNaira(o.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {(profile.address || profile.tax_id || profile.notes) && (
                  <div className="space-y-1 text-muted-foreground">
                    {profile.address && <p>{profile.address}</p>}
                    {profile.tax_id && <p>Tax ID: {profile.tax_id}</p>}
                    {profile.notes && <p>{profile.notes}</p>}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
          <div data-tour="suppliers-form" className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Contact person</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Tax ID</Label><Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Payment terms</Label><Input placeholder="e.g. Net 30, cash on delivery" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} /></div>
              <div className="space-y-1">
                <Label className="text-xs">Rating</Label>
                <Select value={form.rating || "none"} onValueChange={(v) => setForm({ ...form, rating: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Not rated</SelectItem>{[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} star{n > 1 ? "s" : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Categories (comma separated)</Label><Input placeholder="Consumables, Medication" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} /></div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90" disabled={createSupplier.isPending || updateSupplier.isPending}>{editing ? "Save" : "Add Supplier"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
