import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeftRight, Download } from "lucide-react";
import { useOrg } from "@/hooks/useOrg";
import { useInventoryLedger, useBranchOptions, useTransferStock, downloadCsv } from "@/hooks/useInventoryLedger";
import type { InventoryItem } from "@/hooks/useInventory";
import { LedgerTable, ledgerCsvRows } from "./InventoryHistoryTab";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { toast } from "@/hooks/use-toast";

export function TransferDialog({ open, onOpenChange, inventory, initialItemId }: { open: boolean; onOpenChange: (o: boolean) => void; inventory: InventoryItem[]; initialItemId?: string | null }) {
  const { currentOrg } = useOrg();
  const { data: branches = [] } = useBranchOptions();
  const targets = branches.filter((b) => b.id !== currentOrg?.org_id);
  const transfer = useTransferStock();
  const [itemId, setItemId] = useState(initialItemId || "");
  const [target, setTarget] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const item = inventory.find((i) => i.id === (itemId || initialItemId));

  const submit = async () => {
    const q = parseInt(qty);
    if (!item || !target || !q || q <= 0) return toast({ title: "Pick an item, a branch and a quantity", variant: "destructive" });
    if (q > item.quantity) return toast({ title: "Not enough stock", description: `Only ${item.quantity} ${item.unit} available`, variant: "destructive" });
    await transfer.mutateAsync({ inventory_id: item.id, target_org_id: target, quantity: q, notes });
    setQty(""); setNotes(""); setTarget(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-card/95">
        <DialogHeader><DialogTitle>Transfer stock to another branch</DialogTitle></DialogHeader>
        {targets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other branches found. Create a branch first to transfer stock between locations.</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Item</Label>
              <Select value={itemId || initialItemId || ""} onValueChange={setItemId}>
                <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>{inventory.filter((i) => i.quantity > 0).map((i) => <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Send to branch</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{targets.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}{!b.parent_org_id ? " (Main)" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quantity {item ? `(max ${item.quantity} ${item.unit})` : ""}</Label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="bg-muted/30" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason, who is carrying it, etc." className="bg-muted/30" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={transfer.isPending || targets.length === 0}>{transfer.isPending ? "Transferring..." : "Transfer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryTransfersTab({ inventory, canTransfer }: { inventory: InventoryItem[]; canTransfer: boolean }) {
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState("all");
  const { data = [], isLoading } = useInventoryLedger();
  const rows = useMemo(() => data.filter((r) => r.transaction_type.startsWith("transfer") && (dir === "all" || r.transaction_type === dir)), [data, dir]);
  const sent = rows.filter((r) => r.transaction_type === "transfer_out");
  const received = rows.filter((r) => r.transaction_type === "transfer_in");
  const byBranch = useMemo(() => {
    const m: Record<string, { sent: number; received: number; value: number }> = {};
    rows.forEach((r) => {
      const k = r.other_branch || "Other branch";
      m[k] ||= { sent: 0, received: 0, value: 0 };
      if (r.transaction_type === "transfer_out") m[k].sent += r.quantity; else m[k].received += r.quantity;
      m[k].value += Number(r.total_cost || 0);
    });
    return Object.entries(m);
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={dir} onValueChange={setDir}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All transfers</SelectItem>
            <SelectItem value="transfer_out">Sent out</SelectItem>
            <SelectItem value="transfer_in">Received</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" disabled={!rows.length} onClick={() => downloadCsv(`branch-transfers-${new Date().toISOString().slice(0, 10)}.csv`, ledgerCsvRows(rows))}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
        {canTransfer && <Button size="sm" onClick={() => setOpen(true)}><ArrowLeftRight className="mr-2 h-4 w-4" /> New transfer</Button>}
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[["Transfers sent", sent.length], ["Units sent", sent.reduce((s, r) => s + r.quantity, 0)], ["Transfers received", received.length], ["Units received", received.reduce((s, r) => s + r.quantity, 0)]].map(([l, v]) => (
          <Card key={l as string} className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{v}</p></CardContent></Card>
        ))}
      </div>
      {byBranch.length > 0 && (
        <Card className="glass-card"><CardContent className="p-4">
          <p className="text-sm font-medium mb-2">By branch</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {byBranch.map(([b, v]) => (
              <div key={b} className="rounded-lg border border-border/50 p-3 text-sm">
                <p className="font-medium">{b}</p>
                <p className="text-xs text-muted-foreground">Sent {v.sent} · Received {v.received} · ₦{v.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
      <Card className="glass-card overflow-hidden"><CardContent className="p-0">
        {isLoading ? <TableSkeleton columns={8} rows={4} /> : <LedgerTable rows={rows} />}
      </CardContent></Card>
      <TransferDialog open={open} onOpenChange={setOpen} inventory={inventory} />
    </div>
  );
}
