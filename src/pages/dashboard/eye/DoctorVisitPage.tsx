import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PatientPicker } from "@/components/dashboard/eye/PatientPicker";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";
import { useSaveEyeExam, useSaveOpticalPrescription, useSaveOpticalOrder, RX_TYPES } from "@/hooks/eye/useEye";
import { useFrames, useLenses, useCreateBill, useTodayFlow, useMoveFlow, useAdjustStock, todayISO } from "@/hooks/eye/useEyeOps";
import { Plus, Trash2 } from "lucide-react";

const n = (v: string) => (v === "" ? null : Number(v));
const s = (v: string) => (v.trim() === "" ? null : v.trim());
const RX_FIELDS = ["sphere", "cylinder", "axis", "add"] as const;

export default function DoctorVisitPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { basePath } = useOrg();
  const [patientId, setPatientId] = useState(params.get("patient") || "");
  const [exam, setExam] = useState({ chief_complaint: "", va_unaided_od: "", va_unaided_os: "", iop_od: "", iop_os: "", diagnosis: "", plan: "" });
  const [rx, setRx] = useState<Record<string, string>>({ rx_type: "Distance", pd: "" });
  const [giveRx, setGiveRx] = useState(true);
  const [order, setOrder] = useState({ on: false, frame_id: "", lens_id: "", frame_price: "", lens_price: "", promised_date: "" });
  const [items, setItems] = useState([{ description: "Consultation", quantity: 1, unit_price: 0 }]);

  const { data: frames = [] } = useFrames();
  const { data: lenses = [] } = useLenses();
  const { data: flow = [] } = useTodayFlow();
  const saveExam = useSaveEyeExam();
  const saveRx = useSaveOpticalPrescription();
  const saveOrder = useSaveOpticalOrder();
  const createBill = useCreateBill();
  const moveFlow = useMoveFlow();
  const adjFrame = useAdjustStock("eye_frames");
  const adjLens = useAdjustStock("eye_lens_stock");
  const [busy, setBusy] = useState(false);

  const frame = frames.find((f) => f.id === order.frame_id);
  const lens = lenses.find((l) => l.id === order.lens_id);
  const orderLines = order.on ? [
    frame && { description: `Frame: ${frame.brand} ${frame.model || ""}`.trim(), quantity: 1, unit_price: Number(order.frame_price || 0) },
    lens && { description: `Lenses: ${lens.lens_type}${lens.coating ? ` (${lens.coating})` : ""}`, quantity: 1, unit_price: Number(order.lens_price || 0) },
  ].filter(Boolean) as typeof items : [];
  const allLines = [...items, ...orderLines];
  const total = allLines.reduce((t, i) => t + i.quantity * i.unit_price, 0);

  const finish = async () => {
    if (!patientId) return toast({ title: "Choose a patient first", variant: "destructive" });
    setBusy(true);
    try {
      const examId = await saveExam.mutateAsync({
        patient_id: patientId, exam_date: todayISO(), chief_complaint: s(exam.chief_complaint),
        va_unaided_od: s(exam.va_unaided_od), va_unaided_os: s(exam.va_unaided_os),
        iop_od: n(exam.iop_od), iop_os: n(exam.iop_os), diagnosis: s(exam.diagnosis), plan: s(exam.plan),
      });
      let rxId: string | null = null;
      if (giveRx) {
        const exp = new Date(); exp.setFullYear(exp.getFullYear() + 2);
        const payload: any = { patient_id: patientId, eye_exam_id: examId, rx_type: rx.rx_type, issue_date: todayISO(), expiry_date: exp.toISOString().slice(0, 10), pd: n(rx.pd || "") };
        for (const side of ["od", "os"]) for (const f of RX_FIELDS) payload[`${f}_${side}`] = n(rx[`${f}_${side}`] || "");
        rxId = await saveRx.mutateAsync(payload);
      }
      if (order.on && (frame || lens)) {
        await saveOrder.mutateAsync({
          patient_id: patientId, prescription_id: rxId, order_number: `GL-${Date.now().toString().slice(-6)}`,
          frame_brand: frame?.brand || null, frame_model: frame?.model || null, frame_price: Number(order.frame_price || 0),
          lens_type: lens?.lens_type || null, lens_coatings: lens?.coating || null, lens_price: Number(order.lens_price || 0),
          order_date: todayISO(), promised_date: order.promised_date || null, status: "ordered",
          total_amount: Number(order.frame_price || 0) + Number(order.lens_price || 0), amount_paid: 0,
        });
        if (frame) adjFrame.mutate({ id: frame.id, quantity: frame.quantity - 1 });
        if (lens) adjLens.mutate({ id: lens.id, quantity: lens.quantity - 1 });
      }
      if (total > 0) await createBill.mutateAsync({ patient_id: patientId, items: allLines, notes: "Eye clinic visit" });
      const entry = flow.find((f) => f.patient_id === patientId && f.status !== "completed");
      if (entry) moveFlow.mutate({ id: entry.id, stage: order.on ? "optical" : "pay" });
      toast({ title: "Visit saved", description: total > 0 ? "Bill sent to the cashier." : undefined });
      navigate(`${basePath}/eye/flow`);
    } catch {
      /* errors already shown */
    } finally { setBusy(false); }
  };

  const eyeRow = (side: "od" | "os", label: string) => (
    <div className="grid grid-cols-5 items-end gap-2">
      <p className="pb-2 text-sm font-medium">{label}</p>
      {RX_FIELDS.map((f) => (
        <div key={f}>
          <Label className="text-xs capitalize">{f}</Label>
          <Input type="number" step={f === "axis" ? "1" : "0.25"} value={rx[`${f}_${side}`] || ""} onChange={(e) => setRx({ ...rx, [`${f}_${side}`]: e.target.value })} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Visit" description="Exam, glasses prescription, glasses order and bill on one page" />

      <Card><CardContent className="pt-6"><PatientPicker value={patientId} onChange={setPatientId} /></CardContent></Card>

      <Card>
        <CardHeader><CardTitle className="text-base">1. Examination</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Main complaint</Label><Input value={exam.chief_complaint} onChange={(e) => setExam({ ...exam, chief_complaint: e.target.value })} /></div>
          <div><Label>Vision right (e.g. 6/9)</Label><Input value={exam.va_unaided_od} onChange={(e) => setExam({ ...exam, va_unaided_od: e.target.value })} /></div>
          <div><Label>Vision left</Label><Input value={exam.va_unaided_os} onChange={(e) => setExam({ ...exam, va_unaided_os: e.target.value })} /></div>
          <div><Label>Eye pressure right (mmHg)</Label><Input type="number" value={exam.iop_od} onChange={(e) => setExam({ ...exam, iop_od: e.target.value })} /></div>
          <div><Label>Eye pressure left (mmHg)</Label><Input type="number" value={exam.iop_os} onChange={(e) => setExam({ ...exam, iop_os: e.target.value })} /></div>
          <div><Label>Diagnosis</Label><Textarea rows={2} value={exam.diagnosis} onChange={(e) => setExam({ ...exam, diagnosis: e.target.value })} /></div>
          <div><Label>Plan</Label><Textarea rows={2} value={exam.plan} onChange={(e) => setExam({ ...exam, plan: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">2. Glasses prescription</CardTitle>
          <Switch checked={giveRx} onCheckedChange={setGiveRx} />
        </CardHeader>
        {giveRx && (
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div><Label>Type</Label>
                <Select value={rx.rx_type} onValueChange={(v) => setRx({ ...rx, rx_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RX_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>PD (mm)</Label><Input type="number" step="0.5" value={rx.pd} onChange={(e) => setRx({ ...rx, pd: e.target.value })} /></div>
            </div>
            {eyeRow("od", "Right")}
            {eyeRow("os", "Left")}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">3. Glasses order</CardTitle>
          <Switch checked={order.on} onCheckedChange={(v) => setOrder({ ...order, on: v })} />
        </CardHeader>
        {order.on && (
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Frame</Label>
              <Select value={order.frame_id} onValueChange={(v) => { const f = frames.find((x) => x.id === v); setOrder({ ...order, frame_id: v, frame_price: String(f?.sell_price ?? "") }); }}>
                <SelectTrigger><SelectValue placeholder="Choose frame" /></SelectTrigger>
                <SelectContent>{frames.map((f) => <SelectItem key={f.id} value={f.id} disabled={f.quantity <= 0}>{f.brand} {f.model} {f.colour ? `· ${f.colour}` : ""} ({f.quantity} left)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Frame price</Label><Input type="number" value={order.frame_price} onChange={(e) => setOrder({ ...order, frame_price: e.target.value })} /></div>
            <div><Label>Lenses</Label>
              <Select value={order.lens_id} onValueChange={(v) => { const l = lenses.find((x) => x.id === v); setOrder({ ...order, lens_id: v, lens_price: String(l?.sell_price ?? "") }); }}>
                <SelectTrigger><SelectValue placeholder="Choose lenses" /></SelectTrigger>
                <SelectContent>{lenses.map((l) => <SelectItem key={l.id} value={l.id}>{l.lens_type} {l.lens_index || ""} {l.coating ? `· ${l.coating}` : ""} ({l.quantity} left)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Lens price</Label><Input type="number" value={order.lens_price} onChange={(e) => setOrder({ ...order, lens_price: e.target.value })} /></div>
            <div><Label>Ready by</Label><Input type="date" value={order.promised_date} onChange={(e) => setOrder({ ...order, promised_date: e.target.value })} /></div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">4. Bill</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_110px_auto] gap-2">
              <Input value={it.description} placeholder="Item" onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
              <Input type="number" value={it.quantity} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value) } : x))} />
              <Input type="number" value={it.unit_price || ""} placeholder="Price" onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, unit_price: Number(e.target.value) } : x))} />
              <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {orderLines.map((l, i) => <p key={i} className="flex justify-between text-sm text-muted-foreground"><span>{l.description}</span><span>{l.unit_price.toLocaleString()}</span></p>)}
          <Button variant="outline" size="sm" onClick={() => setItems([...items, { description: "", quantity: 1, unit_price: 0 }])}><Plus className="mr-1 h-3 w-3" /> Add item</Button>
          <p className="pt-2 text-right text-lg font-semibold">Total: {total.toLocaleString()}</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={finish} disabled={busy || !patientId}>{busy ? "Saving…" : "Finish visit"}</Button>
      </div>
    </div>
  );
}
