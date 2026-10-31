import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PatientPicker } from "@/components/dashboard/eye/PatientPicker";
import {
  useOpticalOrders, useSaveOpticalOrder, useDeleteOpticalOrder,
  LENS_TYPES, LENS_COATINGS, OPTICAL_ORDER_STATUSES, patientName, type OpticalOrder,
} from "@/hooks/eye/useEye";
import { Plus, Trash2, Glasses } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

const blank = {
  id: undefined as string | undefined,
  patient_id: "",
  order_number: "",
  frame_brand: "", frame_model: "", frame_price: "",
  lens_type: "", lens_coatings: "", lens_price: "",
  lab_name: "",
  order_date: today(), promised_date: "", delivered_date: "",
  total_amount: "", amount_paid: "",
  status: "ordered", notes: "",
};

type Form = typeof blank;
const num = (v: string) => (v === "" ? null : Number(v));
const str = (v: string) => (v.trim() === "" ? null : v.trim());

export default function OpticalOrdersPage() {
  const { data: orders = [], isLoading } = useOpticalOrders();
  const save = useSaveOpticalOrder();
  const remove = useDeleteOpticalOrder();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);
  const set = (k: keyof Form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const startNew = () => { setForm({ ...blank }); setOpen(true); };

  const startEdit = (o: OpticalOrder) => {
    setForm({
      id: o.id,
      patient_id: o.patient_id,
      order_number: o.order_number || "",
      frame_brand: o.frame_brand || "", frame_model: o.frame_model || "",
      frame_price: o.frame_price?.toString() || "",
      lens_type: o.lens_type || "", lens_coatings: o.lens_coatings || "",
      lens_price: o.lens_price?.toString() || "",
      lab_name: o.lab_name || "",
      order_date: o.order_date?.slice(0, 10) || today(),
      promised_date: o.promised_date?.slice(0, 10) || "",
      delivered_date: o.delivered_date?.slice(0, 10) || "",
      total_amount: o.total_amount?.toString() || "",
      amount_paid: o.amount_paid?.toString() || "",
      status: o.status || "ordered", notes: o.notes || "",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.patient_id) return;
    await save.mutateAsync({
      id: form.id,
      patient_id: form.patient_id,
      order_number: str(form.order_number),
      frame_brand: str(form.frame_brand), frame_model: str(form.frame_model),
      frame_price: num(form.frame_price),
      lens_type: str(form.lens_type), lens_coatings: str(form.lens_coatings),
      lens_price: num(form.lens_price),
      lab_name: str(form.lab_name),
      order_date: form.order_date,
      promised_date: form.promised_date || null,
      delivered_date: form.delivered_date || null,
      total_amount: num(form.total_amount),
      amount_paid: num(form.amount_paid),
      status: form.status,
      notes: str(form.notes),
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Optical Orders" description="Frames, lenses, lab jobs and collection status">
        <Button size="sm" onClick={startNew}><Plus className="mr-2 h-4 w-4" /> New Order</Button>
      </PageHeader>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Orders</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && orders.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No optical orders yet.</p>
          )}
          {orders.map((o) => {
            const balance = Number(o.total_amount || 0) - Number(o.amount_paid || 0);
            return (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2">
                <button className="flex-1 text-left" onClick={() => startEdit(o)}>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Glasses className="h-3.5 w-3.5 text-muted-foreground" /> {patientName(o)}
                    {o.order_number && <span className="text-xs text-muted-foreground">#{o.order_number}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.frame_brand || "—"} {o.frame_model || ""} · {o.lens_type || "—"} · {o.lab_name || "in-house"}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  {o.promised_date && (
                    <span className="text-xs text-muted-foreground">promised {new Date(o.promised_date).toLocaleDateString()}</span>
                  )}
                  {balance > 0 && <Badge variant="destructive">balance {balance.toLocaleString()}</Badge>}
                  <Badge variant="outline">{o.status.replace("_", " ")}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(o.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit order" : "New optical order"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!form.id && <PatientPicker value={form.patient_id} onChange={(id) => set("patient_id", id)} />}
            <div className="grid gap-2 sm:grid-cols-2">
              <div><Label>Order number</Label><Input value={form.order_number} onChange={(e) => set("order_number", e.target.value)} /></div>
              <div><Label>Order date</Label><Input type="date" value={form.order_date} onChange={(e) => set("order_date", e.target.value)} /></div>
              <div><Label>Frame brand</Label><Input value={form.frame_brand} onChange={(e) => set("frame_brand", e.target.value)} /></div>
              <div><Label>Frame model</Label><Input value={form.frame_model} onChange={(e) => set("frame_model", e.target.value)} /></div>
              <div><Label>Frame price</Label><Input type="number" step="0.01" value={form.frame_price} onChange={(e) => set("frame_price", e.target.value)} /></div>
              <div>
                <Label>Lens type</Label>
                <Select value={form.lens_type} onValueChange={(v) => set("lens_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>{LENS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lens coating</Label>
                <Select value={form.lens_coatings} onValueChange={(v) => set("lens_coatings", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>{LENS_COATINGS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Lens price</Label><Input type="number" step="0.01" value={form.lens_price} onChange={(e) => set("lens_price", e.target.value)} /></div>
              <div><Label>Lab / supplier</Label><Input value={form.lab_name} onChange={(e) => set("lab_name", e.target.value)} /></div>
              <div><Label>Promised date</Label><Input type="date" value={form.promised_date} onChange={(e) => set("promised_date", e.target.value)} /></div>
              <div><Label>Delivered date</Label><Input type="date" value={form.delivered_date} onChange={(e) => set("delivered_date", e.target.value)} /></div>
              <div><Label>Total amount</Label><Input type="number" step="0.01" value={form.total_amount} onChange={(e) => set("total_amount", e.target.value)} /></div>
              <div><Label>Amount paid</Label><Input type="number" step="0.01" value={form.amount_paid} onChange={(e) => set("amount_paid", e.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OPTICAL_ORDER_STATUSES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending || !form.patient_id}>Save order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
