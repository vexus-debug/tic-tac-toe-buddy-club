import { useMemo, useState } from "react";
import { format } from "date-fns";
import { FilePlus2, Printer, CheckCircle2, Landmark, Layers, Ban, Banknote, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { AgingBucket } from "@/lib/arAging";
import { AGING_LABELS } from "@/lib/arAging";
import { dueDateOf, invoiceBucket, openBalance, overdueDays } from "@/lib/labAging";
import { toAging } from "./billing/agingRows";
import InvoiceDetailDrawer from "./billing/InvoiceDetailDrawer";
import PaymentAllocationModal from "./billing/PaymentAllocationModal";
import { useLabRecords, type LabRecord } from "@/hooks/useLabRecords";
import { applyToInvoice } from "./dlabLinks";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useLabCases } from "@/hooks/useLabCases";
import { useLabInvoices, type LabInvoiceRow } from "@/hooks/useLabInvoices";
import { clientOf } from "@/hooks/useDentalLab";
import { normalizeStage } from "@/config/dentalLab";
import { toast } from "sonner";
import { money } from "./dlabMoney";
import { caseToLine, groupForBatch, invoiceTotals, lineTotal, type LineItem } from "@/lib/labInvoicing";
import { InvoiceBuilderDialog, type BuilderResult } from "./InvoiceBuilderDialog";

const statusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = { paid: "default", partial: "secondary", unpaid: "destructive", void: "outline" };

export default function DlabInvoicesPage({ agingFilter = null, onClearAging }: { agingFilter?: AgingBucket | null; onClearAging?: () => void } = {}) {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const cases = useLabCases();
  const { data: invoices = [] } = useLabInvoices();
  const settings = useLabRecords("invoice-settings");
  const lineRecs = useLabRecords("invoice-lines");
  const bank = settings.data?.[0];
  const [bankOpen, setBankOpen] = useState(false);
  const [bankForm, setBankForm] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [view, setView] = useState<LabInvoiceRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [build, setBuild] = useState<{ client: string; cases: any[]; lines: LineItem[] } | null>(null);
  const [voiding, setVoiding] = useState<LabInvoiceRow | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<LabInvoiceRow[]>([]);
  const [detail, setDetail] = useState<LabInvoiceRow | null>(null);
  const [collect, setCollect] = useState<LabInvoiceRow | null>(null);

  const linesByInvoice = useMemo(() => {
    const m = new Map<string, LabRecord>();
    (lineRecs.data || []).forEach((r) => r.data?.invoice_id && m.set(r.data.invoice_id, r));
    return m;
  }, [lineRecs.data]);

  // A case counts as invoiced if any non-void invoice references it (single or consolidated).
  const invoicedIds = useMemo(() => {
    const s = new Set<string>();
    invoices.forEach((i) => {
      if (i.status === "void") return;
      if (i.lab_case_id) s.add(i.lab_case_id);
      (linesByInvoice.get(i.id)?.data?.case_ids || []).forEach((id: string) => s.add(id));
    });
    return s;
  }, [invoices, linesByInvoice]);

  const ready = (cases.data || []).filter((c: any) => !invoicedIds.has(c.id) && ["ready", "delivered"].includes(normalizeStage(c.status)));
  const groups = groupForBatch(ready as any[], (c) => clientOf(c), (c: any) => c.delivered_at || c.due_date || c.updated_at, from || undefined, to || undefined);
  const filtered = invoices.filter((i) =>
    (status === "all" || i.status === status) &&
    (!agingFilter || invoiceBucket(toAging(i)) === agingFilter) &&
    `${i.invoice_number} ${i.clinic_code} ${i.clinic_doctor_name} ${i.patient_name}`.toLowerCase().includes(q.toLowerCase()));
  const caseOf = (id: string | null) => (cases.data || []).find((c: any) => c.id === id) as any;

  const openBuilder = (client: string, cs: any[]) => setBuild({ client, cases: cs, lines: cs.map((c) => caseToLine(c)) });

  const createInvoice = async (r: BuilderResult) => {
    if (!currentOrg || !build) return;
    setBusy("build");
    try {
      const { data: num, error: e1 } = await (supabase as any).rpc("next_lab_serial", { _org_id: currentOrg.org_id, _kind: "lab_invoice", _prefix: "INV" });
      if (e1) throw e1;
      const t = invoiceTotals(r.lines, r.discount, r.taxRate);
      const caseIds = r.lines.map((l) => l.case_id).filter(Boolean) as string[];
      const single = build.cases.length === 1 ? build.cases[0] : null;
      const patients = [...new Set(r.lines.map((l) => l.patient_name).filter(Boolean))];
      const { data: inv, error } = await (supabase as any).from("lab_invoices").insert({
        org_id: currentOrg.org_id, invoice_number: num, lab_case_id: single?.id ?? null, clinic_code: build.client,
        clinic_doctor_name: single?.clinic_doctor_name || single?.external_contact_person || "",
        patient_name: patients.length > 1 ? `${patients.length} patients` : patients[0] || "",
        subtotal: t.subtotal, discount: t.discount, total: t.total, amount_paid: 0, status: "unpaid", notes: r.notes,
      }).select().single();
      if (error) throw error;
      const { error: e2 } = await (supabase as any).from("lab_records").insert({
        org_id: currentOrg.org_id, kind: "invoice-lines", title: num, status: "active", amount: t.total,
        record_date: format(new Date(), "yyyy-MM-dd"),
        data: { invoice_id: inv.id, lines: r.lines, tax_rate: r.taxRate, tax: t.tax, case_ids: caseIds },
      });
      if (e2) throw e2;
      qc.invalidateQueries({ queryKey: ["lab_invoices"] });
      qc.invalidateQueries({ queryKey: ["lab_records"] });
      toast.success(`Invoice ${num} issued · ${money(t.total)}`);
      setBuild(null);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  /** Settle the remaining balance and record it as a payment so statements stay in sync. */
  const markPaid = async (i: LabInvoiceRow) => {
    if (!currentOrg) return;
    const due = Number(i.total_amount) - Number(i.amount_paid);
    if (due <= 0) return;
    setBusy(i.id);
    try {
      const { error } = await (supabase as any).from("lab_records").insert({
        org_id: currentOrg.org_id, kind: "client-payments", title: i.clinic_code, status: "received", amount: due,
        record_date: format(new Date(), "yyyy-MM-dd"),
        data: { invoice_id: i.id, invoice: i.invoice_number, applied: due, method: "Transfer", reference: "Marked paid from invoices", allocations: [{ invoice_id: i.id, amount_applied: due }] },
      });
      if (error) throw error;
      await applyToInvoice(i.id, due);
      qc.invalidateQueries({ queryKey: ["lab_invoices"] });
      qc.invalidateQueries({ queryKey: ["lab_records"] });
      toast.success(`${i.invoice_number} paid · payment recorded`);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  /** Void keeps the row for audit; its cases return to "ready to invoice". */
  const doVoid = async () => {
    if (!voiding || !voidReason.trim()) return toast.error("Give a reason for voiding.");
    setBusy(voiding.id);
    const note = [voiding.notes, `VOID ${format(new Date(), "yyyy-MM-dd")}: ${voidReason.trim()}`].filter(Boolean).join("\n");
    const { error } = await (supabase as any).from("lab_invoices").update({ status: "void", notes: note }).eq("id", voiding.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["lab_invoices"] });
    toast.success(`${voiding.invoice_number} voided · cases can be re-billed`);
    setVoiding(null); setVoidReason("");
  };

  const saveBank = async () => {
    if (!currentOrg) return;
    const payload = { title: "Invoice payment details", status: "active", amount: 0, data: bankForm };
    const q = bank
      ? (supabase as any).from("lab_records").update(payload).eq("id", bank.id)
      : (supabase as any).from("lab_records").insert({ ...payload, kind: "invoice-settings", org_id: currentOrg.org_id });
    const { error } = await q;
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["lab_records"] });
    setBankOpen(false);
    toast.success("Payment details saved");
  };

  const live = invoices.filter((i) => i.status !== "void");
  const outstanding = live.reduce((s, i) => s + Math.max(0, Number(i.total_amount) - Number(i.amount_paid)), 0);
  const billed = live.reduce((s, i) => s + Number(i.total_amount), 0);
  const collected = live.reduce((s, i) => s + Math.min(Number(i.amount_paid), Number(i.total_amount)), 0);

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-6">
        <PageHeader title="Invoices" description="Itemised and consolidated invoices, rush fees, add-ons and printable tax invoices.">
          <Button variant="outline" onClick={() => { setBankForm(bank?.data || {}); setBankOpen(true); }}><Landmark className="mr-1 h-4 w-4" />Payment details</Button>
        </PageHeader>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total billed</p><p className="text-xl font-semibold tabular-nums">{money(billed)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Collected</p><p className="text-xl font-semibold tabular-nums text-primary">{money(collected)}</p>{billed > 0 && <p className="text-xs text-muted-foreground">{Math.round((collected / billed) * 100)}% collected</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className={`text-xl font-semibold tabular-nums ${outstanding > 0 ? "text-destructive" : "text-muted-foreground"}`}>{money(outstanding)}</p>{billed > 0 && outstanding <= 0 && <p className="text-xs text-muted-foreground">All settled</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cases ready to bill</p><p className="text-xl font-semibold tabular-nums">{ready.length}</p></CardContent></Card>
        </div>

        {ready.length > 0 && (
          <Card><CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <h3 className="mr-auto font-medium">Ready to invoice</h3>
              <label className="text-xs text-muted-foreground">From<Input type="date" className="h-8" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label className="text-xs text-muted-foreground">To<Input type="date" className="h-8" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            </div>
            {groups.length === 0 && <p className="text-sm text-muted-foreground">No cases in this date range.</p>}
            {groups.map((g) => (
              <div key={g.client} className="rounded-md border">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-3 py-2">
                  <span className="font-medium">{g.client} <span className="text-xs text-muted-foreground">· {g.cases.length} case{g.cases.length > 1 ? "s" : ""} · {money(g.cases.reduce((s, c) => s + lineTotal(caseToLine(c)), 0))}</span></span>
                  {g.cases.length > 1 && <Button size="sm" onClick={() => openBuilder(g.client, g.cases)}><Layers className="mr-1 h-4 w-4" />Batch invoice ({g.cases.length})</Button>}
                </div>
                {g.cases.map((c: any) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-sm">
                    <span><b>{c.case_number}</b> · {c.external_patient_name || "—"} · {c.work_type}{c.is_urgent ? " · Rush" : ""} · {money(lineTotal(caseToLine(c)))}</span>
                    <Button size="sm" variant="outline" onClick={() => openBuilder(g.client, [c])}><FilePlus2 className="mr-1 h-4 w-4" />Invoice</Button>
                  </div>
                ))}
              </div>
            ))}
          </CardContent></Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Input className="max-w-xs" placeholder="Search invoice, clinic, patient…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{["all", "unpaid", "partial", "paid", "void"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {(agingFilter || selected.size > 0) && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {agingFilter && <Badge variant="secondary" className="gap-1">Aging: {AGING_LABELS[agingFilter]}<button aria-label="Clear aging filter" onClick={onClearAging}><X className="h-3 w-3" /></button></Badge>}
            {selected.size > 0 && <>
              <span className="ml-auto">{selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => setBatch(invoices.filter((i) => selected.has(i.id)))}><Printer className="mr-1 h-4 w-4" />Print selected</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </>}
          </div>
        )}

        <Card><CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr>{<th className="w-8 p-3"><Checkbox aria-label="Select all" checked={filtered.length > 0 && filtered.every((i) => selected.has(i.id))} onCheckedChange={(v) => setSelected(v ? new Set(filtered.map((i) => i.id)) : new Set())} /></th>}{["Invoice", "Date", "Due", "Clinic", "Patient", "Lines", "Total", "Balance", "Overdue", "Status", ""].map((h) => <th key={h} className={`p-3 font-medium ${["Total", "Balance", "Overdue"].includes(h) ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={12} className="p-6 text-center text-muted-foreground">No invoices yet.</td></tr>}
              {filtered.map((i) => {
                const a = toAging(i); const bal = openBalance(a); const od = overdueDays(a);
                return (
                <tr key={i.id} onClick={() => setDetail(i)} className={`cursor-pointer border-t hover:bg-muted/40 ${i.status === "void" ? "text-muted-foreground line-through" : ""} ${selected.has(i.id) ? "bg-muted/30" : ""}`}>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Select ${i.invoice_number}`} checked={selected.has(i.id)} onCheckedChange={(v) => setSelected((s) => { const n = new Set(s); v ? n.add(i.id) : n.delete(i.id); return n; })} /></td>
                  <td className="p-3 font-medium">{i.invoice_number}</td>
                  <td className="p-3 whitespace-nowrap">{format(new Date(i.invoice_date), "dd MMM yy")}</td>
                  <td className="p-3 whitespace-nowrap">{format(new Date(dueDateOf(i.invoice_date) + "T00:00:00"), "dd MMM yy")}</td>
                  <td className="p-3">{i.clinic_code}</td>
                  <td className="p-3">{i.patient_name || "—"}</td>
                  <td className="p-3 tabular-nums">{linesByInvoice.get(i.id)?.data?.lines?.length || 1}</td>
                  <td className="p-3 text-right tabular-nums">{money(i.total_amount)}</td>
                  <td className="p-3 text-right font-medium tabular-nums">{bal > 0 ? money(bal) : "—"}</td>
                  <td className={`p-3 text-right tabular-nums ${od > 0 ? "font-medium text-destructive" : "text-muted-foreground"}`}>{od > 0 ? `${od}d` : "—"}</td>
                  <td className="p-3"><Badge variant={statusTone[i.status] || "outline"} className="capitalize">{i.status}</Badge></td>
                  <td className="p-3 flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    {bal > 0 && <Button size="sm" variant="outline" onClick={() => setCollect(i)}><Banknote className="mr-1 h-4 w-4" />Collect</Button>}
                    {!["paid", "void"].includes(i.status) && <Button size="sm" variant="ghost" disabled={busy === i.id} title="Mark paid" onClick={() => markPaid(i)}><CheckCircle2 className="h-4 w-4" /></Button>}
                    {i.status !== "void" && Number(i.amount_paid) === 0 && <Button size="sm" variant="ghost" title="Void invoice" onClick={() => setVoiding(i)}><Ban className="h-4 w-4" /></Button>}
                    <Button size="sm" variant="outline" title="Print tax invoice" onClick={() => setView(i)}><Printer className="h-4 w-4" /></Button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent></Card>
      </div>

      <InvoiceBuilderDialog open={!!build} onOpenChange={(o) => !o && setBuild(null)} client={build?.client || ""} initialLines={build?.lines || []} busy={busy === "build"} onSubmit={createInvoice} />

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto print:max-h-none print:max-w-none print:overflow-visible print:shadow-none print:border-0">
          <DialogHeader className="print:hidden"><DialogTitle>Tax invoice {view?.invoice_number}</DialogTitle></DialogHeader>
          {view && <InvoiceSheet inv={view} labName={currentOrg?.org_name || "Dental Lab"} c={caseOf(view.lab_case_id)} rec={linesByInvoice.get(view.id)} bank={bank?.data} phone={(currentOrg as any)?.phone} />}
          <Button className="print:hidden" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print invoice</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={batch.length > 0} onOpenChange={(o) => !o && setBatch([])}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto print:max-h-none print:max-w-none print:overflow-visible print:shadow-none print:border-0">
          <DialogHeader className="print:hidden"><DialogTitle>Print {batch.length} invoices</DialogTitle></DialogHeader>
          {batch.map((b, k) => (
            <div key={b.id} className={k < batch.length - 1 ? "border-b pb-6 print:break-after-page print:border-0" : ""}>
              <InvoiceSheet inv={b} labName={currentOrg?.org_name || "Dental Lab"} c={caseOf(b.lab_case_id)} rec={linesByInvoice.get(b.id)} bank={bank?.data} phone={(currentOrg as any)?.phone} />
            </div>
          ))}
          <Button className="print:hidden" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print all</Button>
        </DialogContent>
      </Dialog>

      <InvoiceDetailDrawer invoice={detail} cases={cases.data || []} linesRec={detail ? linesByInvoice.get(detail.id) : undefined} onOpenChange={(o) => !o && setDetail(null)}
        onCollect={(i) => { setDetail(null); setCollect(i); }} onPrint={(i) => { setDetail(null); setView(i); }} />
      <PaymentAllocationModal open={!!collect} invoiceId={collect?.id} onOpenChange={(o) => !o && setCollect(null)} />

      <Dialog open={!!voiding} onOpenChange={(o) => { if (!o) { setVoiding(null); setVoidReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Void {voiding?.invoice_number}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">The invoice stays on record as void and its cases go back to "Ready to invoice".</p>
          <Input placeholder="Reason (required)" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          <Button variant="destructive" disabled={busy === voiding?.id} onClick={doVoid}>Void invoice</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={bankOpen} onOpenChange={setBankOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payment details on invoices</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {BANK_FIELDS.map(([k, label]) => (
              <div key={k} className="space-y-1">
                <label className="text-sm font-medium" htmlFor={`bank-${k}`}>{label}</label>
                <Input id={`bank-${k}`} value={bankForm[k] || ""} onChange={(e) => setBankForm({ ...bankForm, [k]: e.target.value })} />
              </div>
            ))}
            <Button className="w-full" onClick={saveBank}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const BANK_FIELDS: [string, string][] = [["bank_name", "Bank name"], ["account_name", "Account name"], ["account_number", "Account number"], ["sort_code", "Sort code / SWIFT"], ["tax_id", "Lab tax ID / TIN"], ["phone", "Contact phone"]];

function InvoiceSheet({ inv, labName, c, rec, bank, phone }: { inv: LabInvoiceRow; labName: string; c: any; rec?: LabRecord; bank?: Record<string, any>; phone?: string }) {
  const balance = Number(inv.total_amount) - Number(inv.amount_paid);
  // Legacy single-case invoices have no stored lines: show the case as one line.
  const lines: LineItem[] = rec?.data?.lines?.length ? rec.data.lines : [{ ...caseToLine(c || {}, 0), units: 1, unit_price: Number(inv.subtotal), add_ons: [], rush_pct: 0, discount: 0 }];
  const tax = Number(rec?.data?.tax || 0);
  return (
    <div className="space-y-5 text-sm">
      <div className="flex justify-between border-b pb-3">
        <div><h2 className="text-xl font-bold">{labName}</h2><p className="text-muted-foreground">Dental Laboratory</p>{bank?.tax_id && <p className="text-xs">TIN {bank.tax_id}</p>}</div>
        <div className="text-right"><p className="text-lg font-semibold">{inv.status === "void" ? "VOID INVOICE" : "TAX INVOICE"}</p><p>{inv.invoice_number}</p><p>{format(new Date(inv.invoice_date), "dd MMM yyyy")}</p></div>
      </div>
      <div><p className="text-xs uppercase text-muted-foreground">Bill to</p><p className="font-medium">{inv.clinic_code}</p>{inv.clinic_doctor_name && inv.clinic_doctor_name !== inv.clinic_code && <p>{inv.clinic_doctor_name}</p>}</div>
      <table className="w-full border text-xs">
        <thead className="bg-muted/50"><tr>{["Case / Patient", "Description", "CDT", "Teeth", "Units", "Price", "Amount"].map((h, k) => <th key={h} className={`p-2 ${k >= 4 ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
        <tbody>
          {lines.map((l, k) => (
            <tr key={k} className="border-t align-top">
              <td className="p-2">{l.case_number || "—"}<br /><span className="text-muted-foreground">{l.patient_name}</span></td>
              <td className="p-2">{l.description}
                {l.add_ons?.map((a) => <div key={a.name} className="text-muted-foreground">+ {a.name} ({money(a.price)})</div>)}
                {!!l.rush_pct && <div className="text-muted-foreground">+ Rush {l.rush_pct}%</div>}
                {!!l.discount && <div className="text-muted-foreground">− Discount {money(l.discount)}</div>}
              </td>
              <td className="p-2">{l.cdt_code || "—"}</td><td className="p-2">{l.teeth || "—"}</td>
              <td className="p-2 text-right tabular-nums">{l.units}</td><td className="p-2 text-right tabular-nums">{money(l.unit_price)}</td>
              <td className="p-2 text-right tabular-nums">{money(lineTotal(l))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto w-64 space-y-1 tabular-nums">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(inv.subtotal)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>-{money(inv.discount)}</span></div>
        {tax > 0 && <div className="flex justify-between"><span>Tax ({rec?.data?.tax_rate}%)</span><span>{money(tax)}</span></div>}
        <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>{money(inv.total_amount)}</span></div>
        <div className="flex justify-between"><span>Paid</span><span>{money(inv.amount_paid)}</span></div>
        <div className="flex justify-between font-bold"><span>Balance due</span><span>{money(balance)}</span></div>
      </div>
      {inv.notes && <p className="whitespace-pre-line text-xs text-muted-foreground">{inv.notes}</p>}
      {bank && (bank.bank_name || bank.account_number) ? (
        <div className="rounded border p-3">
          <p className="mb-1 text-xs uppercase text-muted-foreground">Pay to</p>
          {bank.bank_name && <p>Bank: <b>{bank.bank_name}</b></p>}
          {bank.account_name && <p>Account name: <b>{bank.account_name}</b></p>}
          {bank.account_number && <p>Account number: <b>{bank.account_number}</b></p>}
          {bank.sort_code && <p>Sort code / SWIFT: {bank.sort_code}</p>}
          {(bank.phone || phone) && <p>Enquiries: {bank.phone || phone}</p>}
        </div>
      ) : <p className="text-xs text-muted-foreground print:hidden">Tip: add your bank details with "Payment details" so clinics know where to pay.</p>}
      <div className="break-inside-avoid border-t-2 border-dashed pt-3 text-xs">
        <p className="mb-2 font-semibold uppercase">Remittance advice — detach and return with payment</p>
        <div className="grid grid-cols-2 gap-2">
          <p>From: <b>{inv.clinic_code}</b></p><p>To: <b>{labName}</b></p>
          <p>Invoice: <b>{inv.invoice_number}</b></p><p>Amount due: <b>{money(balance)}</b></p>
          <p>Amount paid: ________________</p><p>Payment ref / cheque #: ________________</p>
        </div>
      </div>
    </div>
  );
}
