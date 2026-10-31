import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, Search, Send, Loader2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { useInsuranceClaims, useUpdateClaim, useSettleClaim, CLAIM_STATUSES } from "@/hooks/useBilling";
import { useInvoices, useInvoiceItems } from "@/hooks/useInvoices";
import { invoiceBalance } from "@/lib/arAging";
import { settlementAmount, hasActiveClaim } from "@/lib/claims";
import { InvoiceDetailDialog } from "@/components/dashboard/InvoiceDetailDialog";
import { CreateClaimModal } from "@/components/dashboard/CreateClaimModal";
import { filterClaims } from "@/lib/printDocs";
import { cn } from "@/lib/utils";

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const statusTone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  submitted: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-accent text-accent-foreground border-border",
  paid: "bg-secondary/15 text-secondary border-secondary/30",
  denied: "bg-destructive/10 text-destructive border-destructive/20",
};

/** Insurance claims list. Claims are drafted from an invoice (Invoice → "Insurance claim"). */
export function ClaimsTable() {
  const { data: claims = [], isLoading } = useInsuranceClaims();
  const update = useUpdateClaim();
  const [status, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batching, setBatching] = useState(false);
  const [noteFor, setNoteFor] = useState<{ claim: any; status: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  const settle = useSettleClaim();
  const { data: invoices = [] } = useInvoices();
  const [settleFor, setSettleFor] = useState<any | null>(null);
  const [settleAmt, setSettleAmt] = useState("");
  const [settleRef, setSettleRef] = useState("");
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [invQuery, setInvQuery] = useState("");
  const [claimInvoiceId, setClaimInvoiceId] = useState<string | null>(null);
  const viewInvoice = invoices.find((i: any) => i.id === viewInvoiceId) || null;
  const claimInvoice = invoices.find((i: any) => i.id === claimInvoiceId) || null;
  const { data: claimItems = [] } = useInvoiceItems(claimInvoiceId);
  const claimable = useMemo(() => {
    const q = invQuery.trim().toLowerCase();
    return invoices.filter((i: any) => invoiceBalance(i) > 0
      && !hasActiveClaim(claims.filter((c: any) => c.invoice_id === i.id))
      && (!q || `${i.invoice_number} ${i.patients?.first_name || ""} ${i.patients?.last_name || ""}`.toLowerCase().includes(q))).slice(0, 20);
  }, [invoices, claims, invQuery]);

  const balanceFor = (invoiceId: string) => {
    const inv = invoices.find((i: any) => i.id === invoiceId);
    return inv ? invoiceBalance(inv) : Infinity;
  };

  const confirmSettle = async () => {
    if (!settleFor) return;
    const amt = settlementAmount(Number(settleAmt), balanceFor(settleFor.invoice_id));
    try {
      await settle.mutateAsync({ claim: settleFor, amount: amt, reference: settleRef.trim() || undefined });
      toast({ title: "Claim marked paid", description: amt > 0 ? `${fmt(amt)} applied to the invoice` : undefined });
      setSettleFor(null);
    } catch (e: any) {
      toast({ title: "Could not settle claim", description: e.message, variant: "destructive" });
    }
  };

  const rows = useMemo(() => filterClaims(claims, status, query), [claims, status, query]);
  const drafts = rows.filter((c: any) => c.status === "draft");
  const allDraftsSelected = drafts.length > 0 && drafts.every((c: any) => selected.has(c.id));

  const applyStatus = async (c: any, next: string, notes?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    await update.mutateAsync({
      id: c.id,
      status: next,
      submitted_date: next === "submitted" ? c.submitted_date || today : c.submitted_date,
      paid_date: next === "paid" ? today : next === "denied" ? null : c.paid_date,
      amount_paid: next === "paid" ? Number(c.amount_claimed) : c.amount_paid,
      ...(notes !== undefined ? { notes } : {}),
    });
  };

  const onStatusChange = async (c: any, next: string) => {
    if (next === "paid") {
      setSettleAmt(String(settlementAmount(Number(c.amount_claimed), balanceFor(c.invoice_id))));
      setSettleRef("");
      setSettleFor(c);
      return;
    }
    if (next === "denied" || next === "pending") {
      setNoteText(c.notes || "");
      setNoteFor({ claim: c, status: next });
      return;
    }
    try {
      await applyStatus(c, next);
      toast({ title: `Claim marked ${next}` });
    } catch (e: any) {
      toast({ title: "Could not update claim", description: e.message, variant: "destructive" });
    }
  };

  const saveNote = async () => {
    if (!noteFor) return;
    try {
      await applyStatus(noteFor.claim, noteFor.status, noteText.trim() || null as any);
      toast({ title: `Claim marked ${noteFor.status}` });
      setNoteFor(null);
    } catch (e: any) {
      toast({ title: "Could not update claim", description: e.message, variant: "destructive" });
    }
  };

  const submitSelected = async () => {
    const targets = claims.filter((c: any) => selected.has(c.id) && c.status === "draft");
    setBatching(true);
    const results = await Promise.allSettled(targets.map((c: any) => applyStatus(c, "submitted")));
    setBatching(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    setSelected(new Set());
    toast(failed
      ? { title: `${targets.length - failed} submitted, ${failed} failed`, variant: "destructive" }
      : { title: `${targets.length} claim${targets.length === 1 ? "" : "s"} submitted` });
  };

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(allDraftsSelected ? new Set() : new Set(drafts.map((c: any) => c.id)));

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-[15px] font-semibold">Insurance claims</CardTitle>
            <CardDescription className="text-xs">Draft a claim here or from an invoice.</CardDescription>
          </div>
          <Button size="sm" className="h-8 shrink-0" onClick={() => { setInvQuery(""); setPickerOpen(true); }}>
            <Plus className="mr-1 h-3.5 w-3.5" />New claim
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient, insurer, policy or invoice" className="pl-9 h-9" aria-label="Search claims" />
          </div>
          <div className="flex gap-1 flex-wrap" role="tablist" aria-label="Filter by status">
            {["all", ...CLAIM_STATUSES].map((s) => (
              <Button key={s} size="sm" variant={status === s ? "default" : "outline"} className="h-9 capitalize text-xs" onClick={() => setStatusFilter(s)} aria-pressed={status === s}>
                {s}
              </Button>
            ))}
          </div>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
            <span className="text-xs font-medium">{selected.size} draft claim{selected.size === 1 ? "" : "s"} selected</span>
            <Button size="sm" className="h-8" onClick={submitSelected} disabled={batching}>
              {batching ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
              Submit selected claims
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <TableSkeleton columns={7} rows={4} />
        ) : claims.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No claims yet" description="Claims you draft from invoices will appear here." />
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No claims match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pl-4 w-8">
                    <Checkbox checked={allDraftsSelected} onCheckedChange={toggleAll} disabled={drafts.length === 0} aria-label="Select all draft claims" />
                  </th>
                  <th className="py-3 px-4 text-left font-semibold">Invoice</th>
                  <th className="py-3 px-4 text-left font-semibold">Patient</th>
                  <th className="py-3 px-4 text-left font-semibold hidden md:table-cell">Insurer</th>
                  <th className="py-3 px-4 text-right font-semibold">Claimed</th>
                  <th className="py-3 px-4 text-right font-semibold hidden md:table-cell">Paid</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/30 last:border-0 align-top">
                    <td className="py-3 pl-4">
                      {c.status === "draft" && <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} aria-label={`Select claim ${c.invoices?.invoice_number || ""}`} />}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold">
                      {c.invoices?.invoice_number ? (
                        <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => setViewInvoiceId(c.invoice_id)}>{c.invoices.invoice_number}</button>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {c.patients ? `${c.patients.first_name} ${c.patients.last_name}` : "—"}
                      {c.notes && (c.status === "denied" || c.status === "pending") && (
                        <span className="block text-[11px] font-normal text-muted-foreground max-w-[220px]">Note: {c.notes}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {c.insurer_name}
                      {c.policy_number && <span className="block text-[11px]">Policy {c.policy_number}</span>}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold">{fmt(c.amount_claimed)}</td>
                    <td className="py-3 px-4 text-right tabular-nums hidden md:table-cell text-muted-foreground">{fmt(c.amount_paid)}</td>
                    <td className="py-3 px-4">
                      <Select value={c.status} onValueChange={(v) => onStatusChange(c, v)}>
                        <SelectTrigger className={cn("h-7 w-[120px] text-[11px] font-semibold capitalize border", statusTone[c.status])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLAIM_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!noteFor} onOpenChange={(o) => !o && setNoteFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">Mark claim {noteFor?.status}</DialogTitle>
            <DialogDescription>
              {noteFor?.status === "denied" ? "Record the insurer's denial reason and EOB reference." : "Add a pre-authorisation or follow-up note."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="claim-note" className="text-xs">Note / EOB reference</Label>
            <Textarea id="claim-note" rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="e.g. EOB #48213 — frequency limit exceeded" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteFor(null)}>Cancel</Button>
            <Button onClick={saveNote} disabled={update.isPending || (noteFor?.status === "denied" && !noteText.trim())}>
              {update.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!settleFor} onOpenChange={(o) => !o && setSettleFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark claim paid</DialogTitle>
            <DialogDescription>The settled amount is recorded as an insurance payment on invoice {settleFor?.invoices?.invoice_number}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label htmlFor="settle-amt" className="text-xs">Amount paid by insurer (₦)</Label><Input id="settle-amt" type="number" min={0} value={settleAmt} onChange={(e) => setSettleAmt(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="settle-ref" className="text-xs">Settlement reference / EFT code</Label><Input id="settle-ref" value={settleRef} onChange={(e) => setSettleRef(e.target.value)} placeholder="e.g. EFT-20931" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleFor(null)}>Cancel</Button>
            <Button onClick={confirmSettle} disabled={settle.isPending}>{settle.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New claim</DialogTitle>
            <DialogDescription>Choose an unpaid invoice to claim against.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={invQuery} onChange={(e) => setInvQuery(e.target.value)} placeholder="Invoice number or patient" className="pl-9 h-9" aria-label="Search invoices" autoFocus />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-md border border-border">
            {claimable.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No unpaid invoices without an active claim.</p>
            ) : claimable.map((i: any) => (
              <button key={i.id} type="button" className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-muted/50"
                onClick={() => { setClaimInvoiceId(i.id); setPickerOpen(false); }}>
                <span><span className="font-mono font-semibold text-primary">{i.invoice_number}</span> · {i.patients ? `${i.patients.first_name} ${i.patients.last_name}` : "—"}</span>
                <span className="tabular-nums font-semibold">{fmt(invoiceBalance(i))}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {claimInvoice && (
        <CreateClaimModal
          open={!!claimInvoiceId}
          onOpenChange={(o) => !o && setClaimInvoiceId(null)}
          invoice={{ id: claimInvoice.id, patient_id: claimInvoice.patient_id, invoice_number: claimInvoice.invoice_number, balance: invoiceBalance(claimInvoice) }}
          items={claimItems}
        />
      )}

      <InvoiceDetailDialog open={!!viewInvoice} onOpenChange={(o) => !o && setViewInvoiceId(null)} invoice={viewInvoice} />
    </Card>
  );
}
