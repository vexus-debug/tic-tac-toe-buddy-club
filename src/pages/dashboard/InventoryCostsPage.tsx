import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { useInventoryCostAnalytics, useInventoryTransactions, useCreateInventoryTransaction, useDeleteInventoryTransaction } from "@/hooks/useInventoryCosts";
import { useInventory } from "@/hooks/useInventory";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Package, Plus, DollarSign, TrendingDown, Warehouse, Trash2, Download } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["hsl(174, 60%, 40%)", "hsl(220, 60%, 20%)", "hsl(174, 50%, 50%)", "hsl(220, 50%, 30%)", "hsl(165, 40%, 50%)", "hsl(210, 30%, 60%)"];

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border) / 0.5)",
  borderRadius: "12px",
  fontSize: "12px",
};

const txTypeStyles: Record<string, string> = {
  purchase: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  usage: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  adjustment: "bg-muted text-muted-foreground",
  return: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export default function InventoryCostsPage() {
  const { data: analytics } = useInventoryCostAnalytics();
  const { data: transactions = [] } = useInventoryTransactions();
  const { data: inventory = [] } = useInventory();
  const createTx = useCreateInventoryTransaction();
  const deleteTx = useDeleteInventoryTransaction();
  const [txOpen, setTxOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [range, setRange] = useState("all");
  const [txSearch, setTxSearch] = useState("");
  const filteredTx = transactions.filter((tx) => {
    if (typeFilter !== "all" && tx.transaction_type !== typeFilter) return false;
    if (range !== "all" && Date.now() - new Date(tx.created_at).getTime() > Number(range) * 86400000) return false;
    if (txSearch && !`${tx.item_name} ${tx.reference || ""} ${tx.notes || ""}`.toLowerCase().includes(txSearch.toLowerCase())) return false;
    return true;
  });
  const filteredSpend = filteredTx.filter((t) => t.transaction_type === "purchase").reduce((s, t) => s + Number(t.total_cost), 0);
  const exportTx = () => {
    const rows = [["Date", "Item", "Type", "Quantity", "Unit Cost", "Total", "Reference", "Notes"], ...filteredTx.map((t) => [t.created_at.split("T")[0], t.item_name, t.transaction_type, t.quantity, t.unit_cost, t.total_cost, t.reference || "", t.notes || ""])];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `inventory-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };
  const [form, setForm] = useState({ inventory_id: "", transaction_type: "purchase", quantity: "", unit_cost: "", reference: "", notes: "" });

  const handleSubmit = () => {
    if (!form.inventory_id || !form.quantity) return;
    createTx.mutate({
      inventory_id: form.inventory_id,
      transaction_type: form.transaction_type,
      quantity: parseInt(form.quantity) || 0,
      unit_cost: parseFloat(form.unit_cost) || 0,
      reference: form.reference,
      notes: form.notes,
    }, { onSuccess: () => { setTxOpen(false); setForm({ inventory_id: "", transaction_type: "purchase", quantity: "", unit_cost: "", reference: "", notes: "" }); } });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Costs" description="Track cost per item and total spend analytics">
        <Button size="sm" className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={() => setTxOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record Transaction
        </Button>
      </PageHeader>

      <motion.div className="grid gap-4 sm:grid-cols-3" variants={stagger.container} initial="hidden" animate="visible">
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center"><TrendingDown className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Spend</p>
                <p className="text-xl font-bold"><AnimatedCounter value={analytics?.totalSpend || 0} formatter={formatCurrency} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Warehouse className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Stock Value</p>
                <p className="text-xl font-bold"><AnimatedCounter value={analytics?.stockValue || 0} formatter={formatCurrency} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={stagger.item}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center"><Package className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold"><AnimatedCounter value={transactions.length} /></p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Spend by Category */}
        <Card className="glass-card">
          <CardHeader className="pb-2 border-b border-border/30">
            <CardTitle className="text-base">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!analytics?.byCategory?.length ? (
              <p className="text-sm text-muted-foreground text-center py-12">No purchase data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={analytics.byCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {analytics.byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Transactions</CardTitle>
                <CardDescription>{filteredTx.length} shown · purchases {formatCurrency(filteredSpend)}</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={exportTx} disabled={!filteredTx.length}><Download className="mr-1 h-4 w-4" /> Export</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Input className="h-8 flex-1 min-w-[140px]" placeholder="Search…" value={txSearch} onChange={(e) => setTxSearch(e.target.value)} />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTx.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">{transactions.length ? "No transactions match these filters." : "No transactions yet."}</p>
            ) : (
              <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
                {filteredTx.map((tx) => (
                  <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-accent/20 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{tx.item_name}</p>
                      <p className="text-xs text-muted-foreground">{tx.quantity} × {formatCurrency(tx.unit_cost)} · {tx.created_at.split("T")[0]}{tx.reference ? ` · ${tx.reference}` : ""}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatCurrency(tx.total_cost)}</span>
                      <Badge className={`text-[10px] ${txTypeStyles[tx.transaction_type] || ""}`}>{tx.transaction_type}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label="Remove transaction" onClick={() => { if (confirm("Remove this transaction record? Stock levels will not change.")) deleteTx.mutate(tx.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Dialog */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="backdrop-blur-xl bg-card/95">
          <DialogHeader><DialogTitle>Record Inventory Transaction</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Item *</Label>
              <Select value={form.inventory_id} onValueChange={(v) => { const it = inventory.find((i) => i.id === v); setForm((f) => ({ ...f, inventory_id: v, unit_cost: f.unit_cost || (it?.unit_cost != null ? String(it.unit_cost) : "") })); }}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.transaction_type} onValueChange={(v) => setForm((f) => ({ ...f, transaction_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="usage">Usage</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity *</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Unit Cost (₦)</Label>
                <Input type="number" value={form.unit_cost} onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reference</Label>
                <Input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-secondary hover:bg-secondary/90" disabled={createTx.isPending || !form.inventory_id}>
              {createTx.isPending ? "Saving..." : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
