import { Fragment } from "react";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useSaveLabRecord, type LabRecord } from "@/hooks/useLabRecords";
import { normalizeStage } from "@/config/dentalLab";
import { patientOf } from "@/hooks/useDentalLab";
import { buildLedger, termLabel, tierLabel, toProfileRecord } from "@/lib/labClients";
import { money } from "./dlabMoney";
import { fromRecord } from "./ClientFormDialog";
import DlabStatementsPage from "./DlabStatementsPage";
import type { ClientRow } from "./DlabClientsPage";

const d = (s?: string | null) => (s ? format(new Date(s), "d MMM yyyy") : "—");

export function ClientAccount360Drawer({ row, onClose, onEdit }: { row: ClientRow | null; onClose: () => void; onEdit: (r: ClientRow) => void }) {
  const save = useSaveLabRecord("client-profiles");
  if (!row) return null;
  const p = row.profile;
  const ledger = buildLedger([
    ...row.invoices.map((i) => ({ date: i.invoice_date || i.created_at, kind: "invoice" as const, ref: i.invoice_number, amount: Number(i.total_amount || 0) })),
    ...row.payments.map((x) => ({ date: x.record_date || x.created_at, kind: "payment" as const, ref: x.data?.reference || "Payment", amount: Number(x.amount || 0) })),
    ...row.credits.map((x) => ({ date: x.record_date || x.created_at, kind: "credit" as const, ref: x.data?.reason || "Credit note", amount: Number(x.amount || 0) })),
  ]);
  const toggleHold = (v: boolean) => {
    const input = p ? fromRecord(p) : { name: row.name };
    save.mutate({ id: p?.id, ...toProfileRecord({ ...input, on_hold: v }, p?.data?.client_id) });
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">{row.name}{row.onHold && <Badge variant="destructive">Credit hold</Badge>}</SheetTitle>
          <SheetDescription>{p ? `${termLabel(p.data?.terms)} · ${tierLabel(p.data?.tier)}${p.data?.tax_id ? ` · TIN ${p.data.tax_id}` : ""}` : "No account profile yet — create one to set terms and credit limit."}</SheetDescription>
        </SheetHeader>
        <div className="mt-3"><Button size="sm" variant="outline" onClick={() => onEdit(row)}><Pencil className="mr-1 h-3.5 w-3.5" />{p ? "Edit account" : "Create account"}</Button></div>
        <Tabs defaultValue="summary" className="mt-4">
          <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="summary">Summary</TabsTrigger><TabsTrigger value="doctors">Doctors</TabsTrigger><TabsTrigger value="cases">Cases</TabsTrigger><TabsTrigger value="ledger">Statement</TabsTrigger></TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {[["Billed", row.billed], ["Paid", row.paid], ["Credits", row.creditsTotal], ["Balance", row.balance]].map(([l, v]) => (
                <div key={l as string} className="rounded-md bg-muted p-2"><p className="text-xs text-muted-foreground">{l}</p><p className="font-semibold tabular-nums">{money(v as number)}</p></div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm"><span>Credit used</span><span className="tabular-nums">{row.credit.limit ? `${money(row.credit.used)} of ${money(row.credit.limit)}` : "No limit set"}</span></div>
              {row.credit.limit > 0 && <Progress value={row.credit.utilization * 100} />}
              {row.credit.overLimit && <p className="text-xs text-destructive">Over credit limit — new work is held automatically.</p>}
            </div>
            <div className="flex items-center gap-2"><Switch checked={p?.status === "hold"} onCheckedChange={toggleHold} disabled={save.isPending} /><span className="text-sm">Manual credit hold</span></div>
            {p && <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
              {[["Contact", p.data?.contact_name], ["Phone", p.data?.phone], ["Email", p.data?.email], ["Billing address", p.data?.address], ["Delivery", p.data?.delivery_address], ["Courier notes", p.data?.courier_notes]].filter(([, v]) => v).map(([k, v]) => (
                <Fragment key={k as string}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></Fragment>
              ))}
            </dl>}
          </TabsContent>

          <TabsContent value="doctors">
            {!(p?.data?.doctors || []).length ? <p className="py-6 text-center text-sm text-muted-foreground">No doctors on the roster yet.</p> :
              <table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1">Doctor</th><th>Contact</th><th>Shade guide</th><th>Margin</th></tr></thead>
                <tbody>{(p!.data.doctors as any[]).map((doc) => (
                  <tr key={doc.id} className="border-b"><td className="py-1.5"><p className="font-medium">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.license}</p></td>
                    <td className="text-xs">{doc.phone || doc.email || "—"} <Badge variant="outline">{doc.contact_pref || "phone"}</Badge></td><td>{doc.shade_guide || "—"}</td><td>{doc.margin_pref || "—"}</td></tr>
                ))}</tbody></table>}
          </TabsContent>

          <TabsContent value="cases">
            <table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1">Case</th><th>Patient</th><th>Stage</th><th>Due</th><th>Billing</th></tr></thead>
              <tbody>{row.cases.map((c: any) => (
                <tr key={c.id} className="border-b"><td className="py-1.5 font-mono text-xs">{c.case_number || c.id.slice(0, 8)}</td><td>{patientOf(c)}</td><td className="capitalize">{normalizeStage(c.status)}</td><td>{d(c.due_date)}</td>
                  <td>{row.invoices.some((i) => i.lab_case_id === c.id) ? <Badge variant="secondary">Invoiced</Badge> : <Badge variant="outline">Uninvoiced</Badge>}</td></tr>
              ))}</tbody></table>
            {!row.cases.length && <p className="py-6 text-center text-sm text-muted-foreground">No cases.</p>}
          </TabsContent>

          <TabsContent value="ledger">
            <DlabStatementsPage client={row.name} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
