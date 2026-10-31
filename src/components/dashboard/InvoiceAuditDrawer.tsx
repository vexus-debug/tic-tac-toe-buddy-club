import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { useBillingAudit } from "@/hooks/useBilling";

const ENTITY: Record<string, string> = {
  invoices: "Invoice",
  invoice_items: "Line item",
  payments: "Payment",
  invoice_adjustments: "Adjustment",
};
const ACTION: Record<string, string> = { insert: "added", update: "changed", delete: "removed" };

function describe(r: { entity: string; action: string; details: any }) {
  const d = r.action === "update" ? r.details?.after : r.details;
  if (r.entity === "payments" && d?.amount) return `₦${Number(d.amount).toLocaleString()} · ${d.payment_method || ""}`;
  if (r.entity === "invoice_adjustments" && d?.amount) return `₦${Number(d.amount).toLocaleString()} · ${d.reason || ""}`;
  if (r.entity === "invoice_items" && d?.description) return d.description;
  if (r.entity === "invoices" && r.action === "update") {
    const b = r.details?.before || {}, a = r.details?.after || {};
    const changed = ["status", "total", "discount", "notes"].filter((k) => String(b[k] ?? "") !== String(a[k] ?? ""));
    return changed.map((k) => `${k}: ${b[k] ?? "—"} → ${a[k] ?? "—"}`).join(", ");
  }
  return "";
}

export function InvoiceAuditDrawer({ invoiceId, open, onOpenChange }: { invoiceId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data = [], isLoading } = useBillingAudit(open ? invoiceId : null);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Audit history</SheetTitle>
          <SheetDescription>Every change to this invoice, its lines, payments and adjustments.</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mt-6" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-6">No history yet.</p>
        ) : (
          <ol className="mt-6 relative border-l border-border ml-2 space-y-4">
            {data.map((r) => (
              <li key={r.id} className="pl-4">
                <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm font-medium">{ENTITY[r.entity] || r.entity} {ACTION[r.action] || r.action}</p>
                {describe(r) && <p className="text-xs text-muted-foreground break-words">{describe(r)}</p>}
                <p className="text-[11px] text-muted-foreground mt-0.5">{r.user_name} · {new Date(r.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        )}
      </SheetContent>
    </Sheet>
  );
}
