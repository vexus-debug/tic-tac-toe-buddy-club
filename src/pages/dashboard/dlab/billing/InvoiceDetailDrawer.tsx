import { format } from "date-fns";
import { Banknote, Printer } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLabRecords, type LabRecord } from "@/hooks/useLabRecords";
import type { LabInvoiceRow } from "@/hooks/useLabInvoices";
import { caseToLine, lineTotal, type LineItem } from "@/lib/labInvoicing";
import { dueDateOf, openBalance, overdueDays } from "@/lib/labAging";
import { money } from "../dlabMoney";
import { toAging } from "./agingRows";

interface Props {
  invoice: LabInvoiceRow | null;
  cases: any[];
  linesRec?: LabRecord;
  onOpenChange: (o: boolean) => void;
  onCollect: (inv: LabInvoiceRow) => void;
  onPrint: (inv: LabInvoiceRow) => void;
}

/** Slide-over with the invoice's cases, line items and every payment / credit applied to it. */
export default function InvoiceDetailDrawer({ invoice, cases, linesRec, onOpenChange, onCollect, onPrint }: Props) {
  const payments = useLabRecords("client-payments");
  const credits = useLabRecords("credit-notes");
  const inv = invoice;
  const a = inv ? toAging(inv) : null;
  const bal = a ? openBalance(a) : 0;
  const od = a ? overdueDays(a) : 0;

  const caseIds: string[] = inv ? [...new Set([inv.lab_case_id, ...(linesRec?.data?.case_ids || [])].filter(Boolean) as string[])] : [];
  const attached = cases.filter((c) => caseIds.includes(c.id));
  const lines: LineItem[] = linesRec?.data?.lines?.length ? linesRec.data.lines : attached.map((c) => caseToLine(c));

  const history = inv ? [
    ...(payments.data || []).flatMap((p) => {
      const amt = (p.data?.allocations || []).filter((x: any) => x.invoice_id === inv.id).reduce((s: number, x: any) => s + Number(x.amount_applied || 0), 0)
        || (p.data?.invoice_id === inv.id && !p.data?.allocations ? Number(p.amount || 0) : 0);
      return amt ? [{ id: p.id, date: p.record_date, kind: "Payment", note: [p.data?.method, p.data?.reference].filter(Boolean).join(" · "), amount: amt }] : [];
    }),
    ...(credits.data || []).filter((c) => c.data?.invoice_id === inv.id).map((c) => ({ id: c.id, date: c.record_date, kind: "Credit note", note: c.data?.reason || "", amount: Number(c.amount || 0) })),
  ].sort((x, y) => String(x.date).localeCompare(String(y.date))) : [];

  return (
    <Sheet open={!!inv} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {inv && (
          <div className="space-y-5 text-sm">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">{inv.invoice_number}<Badge variant={inv.status === "paid" ? "default" : inv.status === "void" ? "outline" : "destructive"} className="capitalize">{inv.status}</Badge></SheetTitle>
              <SheetDescription>{inv.clinic_code}{inv.clinic_doctor_name && inv.clinic_doctor_name !== inv.clinic_code ? ` · ${inv.clinic_doctor_name}` : ""}</SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/30 p-3 sm:grid-cols-4">
              <Stat label="Issued" value={format(new Date(inv.invoice_date), "dd MMM yy")} />
              <Stat label="Due" value={format(new Date(dueDateOf(inv.invoice_date) + "T00:00:00"), "dd MMM yy")} />
              <Stat label="Balance" value={money(bal)} strong />
              <Stat label="Overdue" value={od > 0 ? `${od} days` : "—"} danger={od > 0} />
            </div>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Lab cases ({attached.length})</h3>
              {attached.length === 0 && <p className="text-muted-foreground">No linked case records.</p>}
              {attached.map((c) => (
                <div key={c.id} className="grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-md border p-2 text-xs">
                  <span className="col-span-2 text-sm font-medium">{c.case_number}</span>
                  <span className="text-muted-foreground">Patient</span><span>{c.external_patient_name || "—"}</span>
                  <span className="text-muted-foreground">Doctor</span><span>{c.clinic_doctor_name || c.external_contact_person || "—"}</span>
                  <span className="text-muted-foreground">Restoration</span><span>{[c.work_type, c.material].filter(Boolean).join(" · ") || "—"}</span>
                  <span className="text-muted-foreground">Shade</span><span>{c.shade || "—"}</span>
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Line items</h3>
              <table className="w-full text-xs">
                <tbody>
                  {lines.map((l, k) => (
                    <tr key={k} className="border-b">
                      <td className="py-1.5">{l.description}<div className="text-muted-foreground">{[l.case_number, l.patient_name, l.teeth].filter(Boolean).join(" · ")}</div></td>
                      <td className="py-1.5 text-right tabular-nums">{l.units} × {money(l.unit_price)}</td>
                      <td className="py-1.5 text-right font-medium tabular-nums">{money(lineTotal(l))}</td>
                    </tr>
                  ))}
                  <tr><td className="pt-2 font-semibold" colSpan={2}>Total</td><td className="pt-2 text-right font-semibold tabular-nums">{money(Number(inv.total_amount))}</td></tr>
                </tbody>
              </table>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Payments & credits</h3>
              {history.length === 0 && <p className="text-muted-foreground">Nothing received yet.</p>}
              {history.map((h) => (
                <div key={h.id + h.kind} className="flex items-center justify-between border-b py-1.5 text-xs">
                  <span><b>{h.kind}</b> · {h.date}{h.note ? ` · ${h.note}` : ""}</span>
                  <span className="tabular-nums">−{money(h.amount)}</span>
                </div>
              ))}
            </section>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onPrint(inv)}><Printer className="mr-1 h-4 w-4" />Print</Button>
              {bal > 0 && <Button onClick={() => onCollect(inv)}><Banknote className="mr-1 h-4 w-4" />Collect</Button>}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div><p className="text-xs text-muted-foreground">{label}</p><p className={`tabular-nums ${strong ? "font-semibold" : ""} ${danger ? "text-destructive font-medium" : ""}`}>{value}</p></div>
  );
}
