import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useOrg } from "@/hooks/useOrg";
import { usePickupOrders, useUpdateOrder, whatsappLink, smsLink, todayISO } from "@/hooks/eye/useEyeOps";
import { MessageCircle, MessageSquare, PackageCheck, Truck, CheckCircle2 } from "lucide-react";

export function pickupMessage(o: any, clinic: string) {
  const name = o.patients?.first_name || "there";
  const bal = Number(o.total_amount || 0) - Number(o.amount_paid || 0);
  return `Hello ${name}, your glasses${o.order_number ? ` (order ${o.order_number})` : ""} are ready for pickup at ${clinic}.${bal > 0 ? ` Balance to pay: ₦${bal.toLocaleString()}.` : ""} Thank you!`;
}

export function PickupRow({ o, compact = false }: { o: any; compact?: boolean }) {
  const { currentOrg } = useOrg();
  const update = useUpdateOrder();
  const clinic = currentOrg?.org_name || "our clinic";
  const phone = o.patients?.phone;
  const msg = pickupMessage(o, clinic);
  const notify = (href: string) => {
    window.open(href, "_blank");
    update.mutate({ id: o.id, notified_at: new Date().toISOString() });
  };
  const bal = Number(o.total_amount || 0) - Number(o.amount_paid || 0);
  const days = o.delivered_date ? Math.floor((Date.now() - new Date(o.delivered_date).getTime()) / 86400000) : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{o.patients ? `${o.patients.first_name} ${o.patients.last_name}` : "Patient"}
          {o.order_number && <span className="ml-2 text-xs text-muted-foreground">#{o.order_number}</span>}</p>
        <p className="text-xs text-muted-foreground">
          {[o.frame_brand, o.lens_type].filter(Boolean).join(" · ")}
          {o.status === "ready" && days > 0 && ` · waiting ${days} day${days > 1 ? "s" : ""}`}
          {bal > 0 && ` · owes ₦${bal.toLocaleString()}`}
          {o.notified_at && ` · told ${new Date(o.notified_at).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {o.status !== "ready" && (
          <Button size="sm" variant="outline" className="h-8" onClick={() => update.mutate({ id: o.id, status: "ready", delivered_date: todayISO() })}>
            <PackageCheck className="mr-1 h-3.5 w-3.5" /> Arrived
          </Button>
        )}
        {o.status === "ready" && (
          <>
            <Button size="sm" variant="outline" className="h-8" disabled={!phone} onClick={() => notify(whatsappLink(phone, msg))} title={phone ? "" : "No phone number on file"}>
              <MessageCircle className="mr-1 h-3.5 w-3.5" /> WhatsApp
            </Button>
            {!compact && (
              <Button size="sm" variant="outline" className="h-8" disabled={!phone} onClick={() => notify(smsLink(phone, msg))}>
                <MessageSquare className="mr-1 h-3.5 w-3.5" /> SMS
              </Button>
            )}
            <Button size="sm" className="h-8" onClick={() => update.mutate({ id: o.id, status: "collected", amount_paid: o.total_amount ?? o.amount_paid })}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Collected
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function GlassesPickupPage() {
  const { data: orders = [], isLoading } = usePickupOrders();
  const ready = orders.filter((o) => o.status === "ready");
  const waiting = orders.filter((o) => o.status !== "ready");
  const notNotified = ready.filter((o) => !o.notified_at);

  return (
    <div className="space-y-6">
      <PageHeader title="Glasses Pickup" description="Orders that have arrived, alerts to patients, and glasses not yet collected" />
      <div className="flex flex-wrap gap-2">
        <Badge>Ready, not collected: {ready.length}</Badge>
        <Badge variant={notNotified.length ? "destructive" : "outline"}>Patient not told yet: {notNotified.length}</Badge>
        <Badge variant="outline">Still at lab: {waiting.length}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PackageCheck className="h-4 w-4" /> Ready for pickup</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && ready.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No glasses waiting to be collected.</p>}
          {ready.map((o) => <PickupRow key={o.id} o={o} />)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4" /> On order / at the lab</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {waiting.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nothing on order.</p>}
          {waiting.map((o) => <PickupRow key={o.id} o={o} />)}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">WhatsApp and SMS open on this device with the message ready to send.</p>
    </div>
  );
}
