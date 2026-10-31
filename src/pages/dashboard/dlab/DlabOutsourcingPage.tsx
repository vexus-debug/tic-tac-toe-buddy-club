import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, CreditCard, Factory, Mail, PackageCheck, Pencil, Phone, Plus, Receipt, Search, Send, Truck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLabRecords, useSaveLabRecord, type LabRecord } from "@/hooks/useLabRecords";
import { money } from "./dlabMoney";
import {
  DISPATCH_STATUS_LABEL, NEXT_STATUSES, OPEN_STATUSES, daysUntilDue, dueLabel, isOverdue, outstandingTotal, partnerPerformance, payablesByPartner,
  type DispatchStatus,
} from "@/lib/labOutsourcing";
import { DispatchCaseDialog, PartnerDialog, ReceivingQcDialog, RecordVendorBillDialog } from "@/components/dlab/OutsourcingDialogs";
import { cn } from "@/lib/utils";

type Tab = "dispatches" | "receiving" | "directory" | "payables";
const today = () => new Date().toISOString().slice(0, 10);

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground"><Icon className="h-8 w-8 opacity-40" />{text}</div>;
}

function DueBadge({ n }: { n: number | null }) {
  if (n === null) return null;
  return <Badge variant={n < 0 ? "destructive" : n <= 1 ? "default" : "secondary"} className="whitespace-nowrap">{dueLabel(n)}</Badge>;
}

export default function DlabOutsourcingPage({ defaultTab = "dispatches" }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const { data: partners = [], isLoading: lp } = useLabRecords("external-labs");
  const { data: dispatches = [], isLoading: ld } = useLabRecords("outsourced-dispatches");
  const { data: payments = [], isLoading: lpay } = useLabRecords("lab-payments");
  const saveDispatch = useSaveLabRecord("outsourced-dispatches");

  const [q, setQ] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [receiving, setReceiving] = useState<LabRecord | null>(null);
  const [billMode, setBillMode] = useState<"due" | "paid" | null>(null);
  const [editPartner, setEditPartner] = useState<{ p: LabRecord | null } | null>(null);
  const t = today();

  const open = useMemo(() => dispatches.filter((d) => OPEN_STATUSES.includes(d.status as DispatchStatus)), [dispatches]);
  const kpi = useMemo(() => ({
    active: open.length,
    activeValue: open.reduce((s, d) => s + Number(d.amount || 0), 0),
    overdue: open.filter((d) => isOverdue(d, t)).length,
    awaiting: open.filter((d) => d.status === "at_vendor" && (daysUntilDue(d, t) ?? 1) <= 0).length + open.filter((d) => d.status === "in_transit").length,
    ap: outstandingTotal(payments),
  }), [open, payments, t]);

  const filtered = useMemo(() => open.filter((d) =>
    (partnerFilter === "all" || d.data.partner_id === partnerFilter) &&
    (!q || [d.data.case_number, d.data.partner_name, d.data.service_type, d.data.patient, d.data.tracking_ref].join(" ").toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (daysUntilDue(a, t) ?? 999) - (daysUntilDue(b, t) ?? 999)), [open, q, partnerFilter, t]);

  const receivingQueue = useMemo(() => open.filter((d) => d.status === "in_transit" || (daysUntilDue(d, t) ?? 1) <= 1)
    .sort((a, b) => (daysUntilDue(a, t) ?? 0) - (daysUntilDue(b, t) ?? 0)), [open, t]);
  const recentInspections = useMemo(() => dispatches.filter((d) => d.data.qc_outcome).slice(0, 8), [dispatches]);

  const partnerStats = useMemo(() => partners.map((p) => ({
    p, perf: partnerPerformance(dispatches, p.id, t), caseload: open.filter((d) => d.data.partner_id === p.id).length,
  })), [partners, dispatches, open, t]);
  const ledger = useMemo(() => payablesByPartner(payments), [payments]);

  const move = (d: LabRecord, status: DispatchStatus) =>
    saveDispatch.mutate({ id: d.id, title: d.title, amount: d.amount, record_date: d.record_date, status, data: d.data });

  const kpis = [
    { label: "Active at vendors", value: kpi.active, sub: money(kpi.activeValue), icon: Factory, go: "dispatches" as Tab },
    { label: "Overdue / delayed", value: kpi.overdue, sub: kpi.overdue ? "Chase these today" : "All on schedule", icon: AlertTriangle, go: "dispatches" as Tab, alert: kpi.overdue > 0 },
    { label: "Awaiting receiving QC", value: kpi.awaiting, sub: "Arriving / due back", icon: ClipboardCheck, go: "receiving" as Tab },
    { label: "Outstanding payables", value: money(kpi.ap), sub: `${ledger.filter((r) => r.balance > 0).length} partners owed`, icon: Wallet, go: "payables" as Tab },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Outsourcing" description="Send work to partner labs, track it back, inspect it on arrival and settle their bills.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditPartner({ p: null })}><Plus className="mr-1.5 h-4 w-4" />Partner lab</Button>
          <Button onClick={() => setDispatchOpen(true)}><Send className="mr-1.5 h-4 w-4" />Send case out</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <button key={k.label} onClick={() => setTab(k.go)} className="text-left">
            <Card className={cn("h-full transition-colors hover:border-primary/50", k.alert && "border-destructive/50")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">{k.label}<k.icon className={cn("h-4 w-4", k.alert && "text-destructive")} /></div>
                <div className={cn("mt-1 text-2xl font-semibold tabular-nums", k.alert && "text-destructive")}>{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.sub}</div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="dispatches">Active dispatches</TabsTrigger>
          <TabsTrigger value="receiving">Receiving & QC</TabsTrigger>
          <TabsTrigger value="directory">Partner directory</TabsTrigger>
          <TabsTrigger value="payables">Bills & payables</TabsTrigger>
        </TabsList>

        <TabsContent value="dispatches" className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search case, partner, service, tracking…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Select value={partnerFilter} onValueChange={setPartnerFilter}><SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All partners</SelectItem>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select>
          </div>
          <Card><CardContent className="p-0">
            {ld ? <Empty icon={Truck} text="Loading…" /> : !filtered.length ? <Empty icon={Truck} text="Nothing out at partner labs right now." /> : (
              <div className="divide-y">
                {filtered.map((d) => {
                  const n = daysUntilDue(d, t);
                  return (
                    <div key={d.id} className="grid gap-2 p-3 md:grid-cols-[1.2fr_1fr_1fr_auto_auto] md:items-center">
                      <div><div className="font-medium">{d.data.case_number}</div><div className="text-xs text-muted-foreground">{d.data.patient}</div></div>
                      <div className="text-sm"><div>{d.data.partner_name}</div><div className="text-xs text-muted-foreground">{d.data.service_type}</div></div>
                      <div className="text-xs text-muted-foreground">Out {d.data.send_date} · Back {d.data.expected_return_date}{d.data.tracking_ref && <> · #{d.data.tracking_ref}</>}</div>
                      <div className="flex gap-1.5"><Badge variant="outline">{DISPATCH_STATUS_LABEL[d.status as DispatchStatus]}</Badge><DueBadge n={n} /></div>
                      <div className="flex gap-1.5 md:justify-end">
                        <Button size="sm" onClick={() => setReceiving(d)}><PackageCheck className="mr-1 h-4 w-4" />Receive</Button>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline">Update</Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">{NEXT_STATUSES[d.status as DispatchStatus].map((s) =>
                            <DropdownMenuItem key={s} onClick={() => move(d, s)}>Mark {DISPATCH_STATUS_LABEL[s].toLowerCase()}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="receiving" className="space-y-4">
          <Card><CardContent className="p-0">
            <div className="border-b px-3 py-2 text-sm font-medium">Arriving now or due back</div>
            {!receivingQueue.length ? <Empty icon={PackageCheck} text="No parcels waiting for check-in." /> : (
              <div className="divide-y">{receivingQueue.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-40 flex-1"><div className="font-medium">{d.data.case_number} · {d.data.service_type}</div>
                    <div className="text-xs text-muted-foreground">{d.data.partner_name} · {d.data.patient}</div></div>
                  <DueBadge n={daysUntilDue(d, t)} />
                  <Button size="sm" onClick={() => setReceiving(d)}><ClipboardCheck className="mr-1 h-4 w-4" />Inspect</Button>
                </div>))}</div>
            )}
          </CardContent></Card>
          <Card><CardContent className="p-0">
            <div className="border-b px-3 py-2 text-sm font-medium">Recent inspections</div>
            {!recentInspections.length ? <Empty icon={ClipboardCheck} text="No inspections yet." /> : (
              <div className="divide-y">{recentInspections.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <div className="flex-1">{d.data.case_number} · {d.data.partner_name}<div className="text-xs text-muted-foreground">{d.data.received_date} {d.data.qc_notes && `· ${d.data.qc_notes}`}</div></div>
                  <Badge variant={d.data.qc_outcome === "passed" ? "default" : d.data.qc_outcome === "rework_vendor" ? "destructive" : "secondary"}>
                    {d.data.qc_outcome === "passed" ? "Passed" : d.data.qc_outcome === "rework_vendor" ? "Vendor remake" : "Fix in-house"}</Badge>
                  {d.status === "rejected" && <Button size="sm" variant="outline" onClick={() => move(d, "dispatched")}>Re-send</Button>}
                </div>))}</div>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="directory">
          {lp ? <Empty icon={Factory} text="Loading…" /> : !partners.length ? (
            <Card><CardContent><Empty icon={Factory} text="No partner labs yet. Add the labs you outsource to." /></CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {partnerStats.map(({ p, perf, caseload }) => (
                <Card key={p.id}><CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><div className="font-semibold">{p.title}</div><div className="text-xs text-muted-foreground">{p.data.service || "Services not set"}</div></div>
                    <Button size="icon" variant="ghost" aria-label="Edit partner" onClick={() => setEditPartner({ p })}><Pencil className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted p-2"><div className="text-lg font-semibold tabular-nums">{perf.otd ?? "—"}{perf.otd !== null && "%"}</div><div className="text-[11px] text-muted-foreground">On-time (90d)</div></div>
                    <div className="rounded-md bg-muted p-2"><div className={cn("text-lg font-semibold tabular-nums", (perf.remakeRate ?? 0) > 10 && "text-destructive")}>{perf.remakeRate ?? "—"}{perf.remakeRate !== null && "%"}</div><div className="text-[11px] text-muted-foreground">Remake rate</div></div>
                    <div className="rounded-md bg-muted p-2"><div className="text-lg font-semibold tabular-nums">{caseload}</div><div className="text-[11px] text-muted-foreground">Out now</div></div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {p.data.turnaround_days && <div>Turnaround: {p.data.turnaround_days} days</div>}
                    {p.data.contact && <div>{p.data.contact}</div>}
                    {p.data.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.data.phone}</div>}
                    {p.data.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.data.email}</div>}
                    {p.data.portal && <a className="text-primary underline" href={p.data.portal} target="_blank" rel="noreferrer">Upload portal</a>}
                  </div>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setBillMode("due")}><Receipt className="mr-1.5 h-4 w-4" />Log invoice</Button>
            <Button onClick={() => setBillMode("paid")}><CreditCard className="mr-1.5 h-4 w-4" />Record payment</Button>
          </div>
          <Card><CardContent className="p-0">
            <div className="border-b px-3 py-2 text-sm font-medium">Balance by partner</div>
            {!ledger.length ? <Empty icon={Wallet} text="No partner bills yet." /> : (
              <div className="divide-y">{ledger.map((r) => (
                <div key={r.partner} className="grid grid-cols-2 gap-2 p-3 text-sm md:grid-cols-4">
                  <div className="font-medium">{r.partner}</div>
                  <div className="text-muted-foreground">Billed {money(r.billed)}</div>
                  <div className="text-muted-foreground">Paid {money(r.paid)}</div>
                  <div className={cn("font-semibold tabular-nums md:text-right", r.balance > 0 && "text-destructive")}>Owed {money(r.balance)}</div>
                </div>))}</div>
            )}
          </CardContent></Card>
          <Card><CardContent className="p-0">
            <div className="border-b px-3 py-2 text-sm font-medium">Ledger</div>
            {lpay ? <Empty icon={Receipt} text="Loading…" /> : !payments.length ? <Empty icon={Receipt} text="Nothing recorded yet." /> : (
              <div className="divide-y">{payments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status === "paid" ? "Payment" : "Invoice"}</Badge>
                  <div className="flex-1">{p.title}<div className="text-xs text-muted-foreground">
                    {p.record_date} {p.data.invoice_no && `· Inv ${p.data.invoice_no}`} {p.data.case_ref && `· ${p.data.case_ref}`} {p.data.method && `· ${p.data.method}`}</div></div>
                  <div className="font-medium tabular-nums">{money(p.amount)}</div>
                </div>))}</div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <DispatchCaseDialog open={dispatchOpen} onOpenChange={setDispatchOpen} partners={partners.filter((p) => p.status !== "inactive")} />
      <ReceivingQcDialog dispatch={receiving} onOpenChange={(o) => !o && setReceiving(null)} />
      <RecordVendorBillDialog open={!!billMode} mode={billMode ?? "due"} onOpenChange={(o) => !o && setBillMode(null)} partners={partners} />
      <PartnerDialog open={!!editPartner} partner={editPartner?.p ?? null} onOpenChange={(o) => !o && setEditPartner(null)} />
    </div>
  );
}
