import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LAB_REGISTERS, type RegisterConfig } from "@/config/dentalLab";
import { useLabRecords, useSaveLabRecord, useDeleteLabRecord, type LabRecord } from "@/hooks/useLabRecords";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLabInvoices } from "@/hooks/useLabInvoices";
import { useLabClientNames, canonicalClient, clientKey, applyToInvoice } from "./dlabLinks";
import { GenerateRecurringButton } from "@/components/dlab/GenerateRecurringButton";
import { stockState, stockSummary, expiringSoon } from "@/lib/labCatalog";

const money = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

export default function LabRegisterPage({ kind: kindProp }: { kind?: string }) {
  const params = useParams();
  const kind = kindProp || params.kind || "";
  const config = LAB_REGISTERS[kind];
  if (!config) return <p className="py-10 text-center text-muted-foreground">This page does not exist.</p>;
  return <Register key={kind} config={config} />;
}

function Register({ config }: { config: RegisterConfig }) {
  const { data: rows = [], isLoading } = useLabRecords(config.kind);
  const save = useSaveLabRecord(config.kind);
  const del = useDeleteLabRecord();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<LabRecord> | null>(null);
  const qc = useQueryClient();
  const names = useLabClientNames();
  const { data: invoices = [] } = useLabInvoices();
  const isClient = config.titleLabel === "Client clinic";
  const linksInvoice = config.kind === "client-payments" || config.kind === "credit-notes";
  const counts = (r: Partial<LabRecord>) => r.status !== "bounced" && r.status !== "void";
  const clientInvoices = editing && linksInvoice
    ? invoices.filter((i) => clientKey(i.clinic_code) === clientKey(editing.title || "") &&
        (i.status !== "paid" || i.id === editing.data?.invoice_id))
    : [];

  const saveRecord = async () => {
    if (!editing) return;
    const rec: Partial<LabRecord> = { ...editing, title: isClient ? canonicalClient(editing.title || "", names) : editing.title };
    const prev = editing.id ? rows.find((r) => r.id === editing.id) : undefined;
    const inv = invoices.find((i) => i.id === rec.data?.invoice_id);
    if (linksInvoice && inv) rec.data = { ...rec.data, invoice: inv.invoice_number };
    try {
      if (linksInvoice) {
        const oldId = prev && counts(prev) ? prev.data?.invoice_id : null;
        const oldAmt = oldId ? Number(prev!.data?.applied || 0) : 0;
        const newId = counts(rec) ? rec.data?.invoice_id : null;
        let applied = 0;
        if (newId && inv) {
          const room = Number(inv.total_amount) - Number(inv.amount_paid) + (oldId === newId ? oldAmt : 0);
          applied = Math.max(0, Math.min(Number(rec.amount || 0), room));
        }
        if (oldId && oldId === newId) await applyToInvoice(newId, applied - oldAmt);
        else { if (oldId) await applyToInvoice(oldId, -oldAmt); if (newId) await applyToInvoice(newId, applied); }
        rec.data = { ...rec.data, applied };
        if (config.kind === "credit-notes" && applied > 0 && rec.status === "issued") rec.status = "applied";
        qc.invalidateQueries({ queryKey: ["lab_invoices"] });
      }
      save.mutate(rec, { onSuccess: () => setEditing(null) });
    } catch (e: any) { toast.error(e.message || "Could not update the invoice"); }
  };

  const removeRecord = async (r: LabRecord) => {
    if (!confirm("Remove this entry?")) return;
    try {
      if (linksInvoice && counts(r) && r.data?.invoice_id && Number(r.data?.applied || 0) > 0) {
        await applyToInvoice(r.data.invoice_id, -Number(r.data.applied));
        qc.invalidateQueries({ queryKey: ["lab_invoices"] });
      }
      del.mutate(r.id);
    } catch (e: any) { toast.error(e.message || "Could not update the invoice"); }
  };

  const visible = useMemo(() => rows.filter((r) =>
    (filter === "all" || r.status === filter) &&
    (!q || JSON.stringify([r.title, r.data]).toLowerCase().includes(q.toLowerCase()))), [rows, q, filter]);
  const total = visible.reduce((s, r) => s + Number(r.amount || 0), 0);
  const isStock = config.kind === "materials";
  const today = new Date().toISOString().slice(0, 10);
  const fmtAmount = (r: Partial<LabRecord>) => config.amountFormat === "units"
    ? `${Number(r.amount || 0).toLocaleString()} ${r.data?.unit || "units"} left`
    : money(Number(r.amount || 0));
  const summary = isStock ? stockSummary(rows as any, today) : null;
  const soonIds = isStock ? new Set(expiringSoon(rows as any, today).map((r: any) => r.id)) : new Set<string>();

  const openNew = () => setEditing({ title: "", status: config.statuses[0], amount: 0, record_date: "", data: {} });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">{config.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.kind === "recurring" && <GenerateRecurringButton orders={rows} />}
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add {config.itemName}</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {["all", ...config.statuses].map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} className="capitalize" onClick={() => setFilter(s)}>
            {s} <span className="ml-1.5 opacity-70">{s === "all" ? rows.length : rows.filter((r) => r.status === s).length}</span>
          </Button>
        ))}
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([["Usable lots", summary.usable], ["Low stock", summary.low], ["Expiring in 30 days", summary.expiringSoon], ["Expired", summary.expired], ["Recalled", summary.recalled]] as const).map(([l, n]) => (
            <Card key={l}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{n}</p></CardContent></Card>
          ))}
        </div>
      )}

      {config.amountLabel && config.showTotal !== false && visible.length > 0 && (
        <p className="text-sm text-muted-foreground">Total shown: <span className="font-semibold text-foreground">{money(total)}</span></p>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <p className="font-medium">No {config.itemName}s yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first one to start tracking.</p>
          <Button className="mt-4" variant="outline" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add {config.itemName}</Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <Card key={r.id} className="transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.title || "Untitled"}</p>
                    {r.record_date && <p className="text-xs text-muted-foreground">{config.dateLabel}: {format(new Date(r.record_date), "d MMM yyyy")}</p>}
                  </div>
                  {isStock ? (() => {
                    const st = stockState(r as any, today);
                    const bad = st !== "in stock";
                    return <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={bad ? "destructive" : "secondary"} className="capitalize">{st}</Badge>
                      {soonIds.has(r.id) && <Badge variant="outline" className="text-[10px]">Expires soon</Badge>}
                    </div>;
                  })() : <Badge variant="secondary" className="capitalize shrink-0">{r.status}</Badge>}
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {config.fields.filter((f) => r.data?.[f.key]).map((f) => (
                    <div key={f.key} className={f.type === "textarea" ? "col-span-2" : ""}>
                      <dt className="text-muted-foreground">{f.label}</dt>
                      <dd className="truncate font-medium">{String(r.data[f.key])}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-semibold">{config.amountLabel ? fmtAmount(r) : ""}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => removeRecord(r)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "Add"} {config.itemName}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div><Label>{config.titleLabel}</Label>
                <Input list={isClient ? "register-client-names" : undefined} value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  onBlur={() => isClient && setEditing({ ...editing, title: canonicalClient(editing.title || "", names) })} />
                {isClient && <datalist id="register-client-names">{names.map((n) => <option key={n} value={n} />)}</datalist>}
              </div>
              {linksInvoice && (
                <div><Label>Apply to invoice</Label>
                  <Select value={editing.data?.invoice_id || "none"} onValueChange={(id) => {
                    const inv = invoices.find((i) => i.id === id);
                    const data = { ...(editing.data || {}), invoice_id: id === "none" ? "" : id, invoice: inv?.invoice_number || "" };
                    const due = inv ? Number(inv.total_amount) - Number(inv.amount_paid) : 0;
                    setEditing({ ...editing, data, amount: inv && !editing.amount ? due : editing.amount });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not linked — reduce overall balance only</SelectItem>
                      {clientInvoices.map((i) => <SelectItem key={i.id} value={i.id}>{i.invoice_number} · {money(Number(i.total_amount) - Number(i.amount_paid))} due</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!clientInvoices.length && <p className="mt-1 text-xs text-muted-foreground">{editing.title ? "No open invoices for this clinic." : "Pick the clinic first to see its open invoices."}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>{config.statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {config.dateLabel && <div><Label>{config.dateLabel}</Label><Input type="date" value={editing.record_date || ""} onChange={(e) => setEditing({ ...editing, record_date: e.target.value })} /></div>}
                {config.amountLabel && <div><Label>{config.amountLabel}</Label><Input type="number" min={0} value={editing.amount ?? 0} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} /></div>}
              </div>
              {config.fields.filter((f) => !(linksInvoice && f.key === "invoice")).map((f) => {
                const val = editing.data?.[f.key] ?? "";
                const set = (v: string) => setEditing({ ...editing, data: { ...(editing.data || {}), [f.key]: v } });
                return (
                  <div key={f.key}><Label>{f.label}</Label>
                    {f.type === "textarea" ? <Textarea value={val} onChange={(e) => set(e.target.value)} />
                      : f.type === "select" ? (
                        <Select value={val} onValueChange={set}>
                          <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                          <SelectContent>{f.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <Input type={f.type === "number" ? "number" : "text"} value={val} onChange={(e) => set(e.target.value)} />}
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={!editing?.title?.trim() || save.isPending} onClick={saveRecord}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
