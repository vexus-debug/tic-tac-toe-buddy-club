import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLabCases } from "@/hooks/useLabCases";
import { useSaveLabRecord, type LabRecord } from "@/hooks/useLabRecords";
import { patientOf } from "@/hooks/useDentalLab";
import { OUTSOURCE_SERVICES, QC_CHECKS, addBusinessDays, defaultDaysFor, qcResult, type QcKey, type QcOutcome } from "@/lib/labOutsourcing";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

export function DispatchCaseDialog({ open, onOpenChange, partners }: { open: boolean; onOpenChange: (o: boolean) => void; partners: LabRecord[] }) {
  const { data: cases = [] } = useLabCases();
  const save = useSaveLabRecord("outsourced-dispatches");
  const active = useMemo(() => cases.filter((c) => !["delivered", "cancelled"].includes(c.status)), [cases]);
  const [caseId, setCaseId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [service, setService] = useState(OUTSOURCE_SERVICES[0].name);
  const [sendDate, setSendDate] = useState(today());
  const [expected, setExpected] = useState("");
  const [cost, setCost] = useState("");
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    if (!open) return;
    setCaseId(""); setPartnerId(""); setService(OUTSOURCE_SERVICES[0].name); setSendDate(today()); setCost(""); setTracking("");
  }, [open]);

  useEffect(() => {
    const p = partners.find((x) => x.id === partnerId);
    const days = Number(p?.data?.turnaround_days) || defaultDaysFor(service);
    if (sendDate) setExpected(addBusinessDays(sendDate, days));
  }, [partnerId, service, sendDate, partners]);

  const submit = async () => {
    const c = active.find((x) => x.id === caseId);
    const p = partners.find((x) => x.id === partnerId);
    if (!c || !p) return;
    await save.mutateAsync({
      title: `${c.case_number} → ${p.title}`, status: "dispatched", amount: Number(cost) || 0, record_date: sendDate,
      data: { case_id: c.id, case_number: c.case_number, patient: patientOf(c), partner_id: p.id, partner_name: p.title,
        service_type: service, send_date: sendDate, expected_return_date: expected, tracking_ref: tracking },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Send case to partner lab</DialogTitle>
          <DialogDescription>Expected return is worked out from the partner's turnaround.</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Case</Label>
            <Select value={caseId} onValueChange={setCaseId}><SelectTrigger><SelectValue placeholder="Choose a case" /></SelectTrigger>
              <SelectContent>{active.map((c) => <SelectItem key={c.id} value={c.id}>{c.case_number} · {patientOf(c)} · {c.work_type}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1.5"><Label>Partner lab</Label>
            <Select value={partnerId} onValueChange={setPartnerId}><SelectTrigger><SelectValue placeholder={partners.length ? "Choose a partner" : "Add a partner lab first"} /></SelectTrigger>
              <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1.5"><Label>Service</Label>
            <Select value={service} onValueChange={setService}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{OUTSOURCE_SERVICES.map((s) => <SelectItem key={s.name} value={s.name}>{s.name} ({s.days}d)</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Send date</Label><Input type="date" value={sendDate} onChange={(e) => setSendDate(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Expected back</Label><Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Estimated cost</Label><Input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Tracking ref</Label><Input value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!caseId || !partnerId || save.isPending} onClick={submit}>Send out</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReceivingQcDialog({ dispatch, onOpenChange }: { dispatch: LabRecord | null; onOpenChange: (o: boolean) => void }) {
  const save = useSaveLabRecord("outsourced-dispatches");
  const saveBill = useSaveLabRecord("lab-payments");
  const [checks, setChecks] = useState<Partial<Record<QcKey, boolean>>>({});
  const [notes, setNotes] = useState("");
  const [billNo, setBillNo] = useState("");
  const [billAmt, setBillAmt] = useState("");
  const [failRoute, setFailRoute] = useState<QcOutcome>("rework_vendor");

  useEffect(() => {
    setChecks({}); setNotes(""); setBillNo(""); setFailRoute("rework_vendor");
    setBillAmt(dispatch ? String(dispatch.amount || "") : "");
  }, [dispatch]);

  const result = qcResult(checks);
  const submit = async () => {
    if (!dispatch || result === "incomplete") return;
    const outcome: QcOutcome = result === "passed" ? "passed" : failRoute;
    await save.mutateAsync({
      id: dispatch.id, title: dispatch.title, amount: Number(billAmt) || dispatch.amount, record_date: dispatch.record_date,
      status: outcome === "rework_vendor" ? "rejected" : "received",
      data: { ...dispatch.data, received_date: today(), qc_checks: checks, qc_outcome: outcome, qc_notes: notes, bill_ref: billNo || undefined },
    });
    if (Number(billAmt) > 0 && outcome !== "rework_vendor") {
      await saveBill.mutateAsync({ title: dispatch.data.partner_name, status: "due", amount: Number(billAmt), record_date: today(),
        data: { case_ref: dispatch.data.case_number, invoice_no: billNo, dispatch_id: dispatch.id } });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={!!dispatch} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Receive & inspect</DialogTitle>
          <DialogDescription>{dispatch?.data.case_number} from {dispatch?.data.partner_name} · {dispatch?.data.service_type}</DialogDescription></DialogHeader>
        <div className="grid gap-2">
          {QC_CHECKS.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-3 rounded-md border p-2.5">
              <span className="text-sm">{c.label}</span>
              <div className="flex gap-1.5">
                {[true, false].map((v) => (
                  <Button key={String(v)} size="sm" type="button" variant={checks[c.key] === v ? (v ? "default" : "destructive") : "outline"}
                    onClick={() => setChecks((s) => ({ ...s, [c.key]: v }))}>{v ? "Pass" : "Fail"}</Button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {result === "failed" && (
          <div className="grid gap-1.5"><Label>Who fixes it?</Label>
            <Select value={failRoute} onValueChange={(v) => setFailRoute(v as QcOutcome)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="rework_vendor">Send back to partner (vendor remake)</SelectItem>
                <SelectItem value="rework_internal">Fix in-house</SelectItem></SelectContent></Select></div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5"><Label>Partner invoice #</Label><Input value={billNo} onChange={(e) => setBillNo(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Invoice amount</Label><Input type="number" min="0" value={billAmt} onChange={(e) => setBillAmt(e.target.value)} /></div>
        </div>
        <Textarea placeholder="Inspection notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <DialogFooter>
          <span className={cn("mr-auto self-center text-sm font-medium", result === "passed" ? "text-primary" : result === "failed" ? "text-destructive" : "text-muted-foreground")}>
            {result === "incomplete" ? "Answer all 4 checks" : result === "passed" ? "All checks passed" : "Inspection failed"}</span>
          <Button disabled={result === "incomplete" || save.isPending} onClick={submit}>Save inspection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecordVendorBillDialog({ open, onOpenChange, partners, mode }: { open: boolean; onOpenChange: (o: boolean) => void; partners: LabRecord[]; mode: "due" | "paid" }) {
  const save = useSaveLabRecord("lab-payments");
  const [partner, setPartner] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [ref, setRef] = useState("");
  const [caseRef, setCaseRef] = useState("");
  const [method, setMethod] = useState("Transfer");
  useEffect(() => { if (open) { setPartner(""); setAmount(""); setDate(today()); setRef(""); setCaseRef(""); setMethod("Transfer"); } }, [open]);

  const submit = async () => {
    await save.mutateAsync({ title: partner, status: mode, amount: Number(amount) || 0, record_date: date,
      data: mode === "due" ? { invoice_no: ref, case_ref: caseRef } : { method, reference: ref, case_ref: caseRef } });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{mode === "due" ? "Log partner invoice" : "Record payment to partner"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Partner lab</Label>
            <Select value={partner} onValueChange={setPartner}><SelectTrigger><SelectValue placeholder="Choose a partner" /></SelectTrigger>
              <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Amount</Label><Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>{mode === "due" ? "Invoice #" : "Reference"}</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Case number(s)</Label><Input value={caseRef} onChange={(e) => setCaseRef(e.target.value)} /></div>
          </div>
          {mode === "paid" && (
            <div className="grid gap-1.5"><Label>Method</Label>
              <Select value={method} onValueChange={setMethod}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Transfer", "Cash", "Card"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
          )}
        </div>
        <DialogFooter><Button disabled={!partner || !Number(amount) || save.isPending} onClick={submit}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PartnerDialog({ partner, open, onOpenChange }: { partner: LabRecord | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const save = useSaveLabRecord("external-labs");
  const [f, setF] = useState({ title: "", service: "", contact: "", phone: "", email: "", portal: "", turnaround_days: "" });
  useEffect(() => {
    if (!open) return;
    const d = partner?.data ?? {};
    setF({ title: partner?.title ?? "", service: d.service ?? "", contact: d.contact ?? "", phone: d.phone ?? "", email: d.email ?? "",
      portal: d.portal ?? "", turnaround_days: d.turnaround_days ? String(d.turnaround_days) : "" });
  }, [open, partner]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = async () => {
    const { title, ...rest } = f;
    await save.mutateAsync({ id: partner?.id, title, status: partner?.status ?? "active", amount: 0, record_date: partner?.record_date ?? null,
      data: { ...partner?.data, ...rest, turnaround_days: Number(rest.turnaround_days) || undefined } });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{partner ? "Edit partner lab" : "Add partner lab"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Lab name</Label><Input value={f.title} onChange={set("title")} /></div>
          <div className="grid gap-1.5"><Label>Services offered</Label><Input placeholder="e.g. Zirconia milling, SLM" value={f.service} onChange={set("service")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Contact person</Label><Input value={f.contact} onChange={set("contact")} /></div>
            <div className="grid gap-1.5"><Label>Phone</Label><Input value={f.phone} onChange={set("phone")} /></div>
            <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={f.email} onChange={set("email")} /></div>
            <div className="grid gap-1.5"><Label>Turnaround (days)</Label><Input type="number" min="0" value={f.turnaround_days} onChange={set("turnaround_days")} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Upload portal link</Label><Input value={f.portal} onChange={set("portal")} /></div>
        </div>
        <DialogFooter><Button disabled={!f.title.trim() || save.isPending} onClick={submit}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
