import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { InventoryItem } from "@/hooks/useInventory";
import { useInventoryLedger, downloadCsv } from "@/hooks/useInventoryLedger";
import { LedgerTable, ledgerCsvRows } from "./InventoryHistoryTab";

export function ItemHistoryDialog({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const { data = [], isLoading } = useInventoryLedger({ inventoryId: item?.id });
  const used = data.filter((r) => r.transaction_type === "usage").reduce((s, r) => s + r.quantity, 0);
  const bought = data.filter((r) => r.transaction_type === "purchase").reduce((s, r) => s + r.quantity, 0);
  const sent = data.filter((r) => r.transaction_type === "transfer_out").reduce((s, r) => s + r.quantity, 0);
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-card/95">
        <DialogHeader><DialogTitle>{item?.name} — stock history</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-4 text-sm">
          <span>In stock: <b>{item?.quantity} {item?.unit}</b></span>
          <span>Total restocked: <b>{bought}</b></span>
          <span>Total used: <b>{used}</b></span>
          <span>Sent to branches: <b>{sent}</b></span>
          <Button size="sm" variant="outline" className="ml-auto" disabled={!data.length} onClick={() => downloadCsv(`${item?.name}-history.csv`, ledgerCsvRows(data))}><Download className="mr-2 h-4 w-4" /> Download</Button>
        </div>
        {isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p> : <LedgerTable rows={data} />}
      </DialogContent>
    </Dialog>
  );
}
