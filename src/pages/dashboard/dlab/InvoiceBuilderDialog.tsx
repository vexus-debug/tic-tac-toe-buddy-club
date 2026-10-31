import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ADD_ON_PRESETS, invoiceTotals, lineTotal, validateLines, type LineItem } from "@/lib/labInvoicing";
import { money } from "./dlabMoney";

export interface BuilderResult { lines: LineItem[]; discount: number; taxRate: number; notes: string }

export function InvoiceBuilderDialog({ open, onOpenChange, client, initialLines, busy, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void; client: string; initialLines: LineItem[]; busy?: boolean;
  onSubmit: (r: BuilderResult) => void;
}) {
  const [lines, setLines] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [errs, setErrs] = useState<string[]>([]);

  useEffect(() => { if (open) { setLines(initialLines); setDiscount(0); setTaxRate(0); setNotes(""); setErrs([]); } }, [open, initialLines]);

  const set = (i: number, p: Partial<LineItem>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const toggleAddOn = (i: number, name: string, price: number) => {
    const l = lines[i];
    const has = l.add_ons.some((a) => a.name === name);
    set(i, { add_ons: has ? l.add_ons.filter((a) => a.name !== name) : [...l.add_ons, { name, price }] });
  };
  const t = invoiceTotals(lines, discount, taxRate);
  const submit = () => {
    const e = validateLines(lines);
    setErrs(e);
    if (!e.length) onSubmit({ lines, discount, taxRate, notes });
  };
  const n = (v: string) => Number(v) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lines.length > 1 ? "Consolidated invoice" : "New invoice"} · {client}</DialogTitle>
          <DialogDescription>Units × price, add-ons and rush fees per line. Totals update as you type.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="space-y-2 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {l.case_number && <Badge variant="outline">{l.case_number}</Badge>}
                {l.patient_name && <span>{l.patient_name}</span>}
                <span className="ml-auto font-semibold text-foreground tabular-nums">{money(lineTotal(l))}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Remove line" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-12">
                <Input className="col-span-2 sm:col-span-5" placeholder="Description" value={l.description} onChange={(e) => set(i, { description: e.target.value })} />
                <Input className="sm:col-span-2" placeholder="CDT e.g. D2740" value={l.cdt_code || ""} onChange={(e) => set(i, { cdt_code: e.target.value })} />
                <Input className="sm:col-span-2" placeholder="Teeth" value={l.teeth || ""} onChange={(e) => set(i, { teeth: e.target.value })} />
                <Input className="sm:col-span-1" type="number" min={1} aria-label="Units" value={l.units} onChange={(e) => set(i, { units: n(e.target.value) })} />
                <Input className="sm:col-span-2" type="number" min={0} step="0.01" aria-label="Unit price" value={l.unit_price} onChange={(e) => set(i, { unit_price: n(e.target.value) })} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {ADD_ON_PRESETS.map((a) => {
                  const on = l.add_ons.some((x) => x.name === a.name);
                  return <Button key={a.name} type="button" size="sm" variant={on ? "default" : "outline"} className="h-7" onClick={() => toggleAddOn(i, a.name, a.price)}>+ {a.name} {money(a.price)}</Button>;
                })}
                <label className="ml-auto flex items-center gap-1">Rush %<Input className="h-7 w-16" type="number" min={0} value={l.rush_pct || 0} onChange={(e) => set(i, { rush_pct: n(e.target.value) })} /></label>
                <label className="flex items-center gap-1">Discount<Input className="h-7 w-20" type="number" min={0} value={l.discount || 0} onChange={(e) => set(i, { discount: n(e.target.value) })} /></label>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { description: "", units: 1, unit_price: 0, add_ons: [] }])}><Plus className="mr-1 h-4 w-4" />Add line</Button>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm">Notes on invoice<Input value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
              <div className="flex gap-2">
                <label className="text-sm">Invoice discount<Input type="number" min={0} value={discount} onChange={(e) => setDiscount(n(e.target.value))} /></label>
                <label className="text-sm">Tax %<Input type="number" min={0} value={taxRate} onChange={(e) => setTaxRate(n(e.target.value))} /></label>
              </div>
            </div>
            <dl className="space-y-1 text-sm tabular-nums">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(t.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Discount</dt><dd>-{money(t.discount)}</dd></div>
              <div className="flex justify-between"><dt>Tax</dt><dd>{money(t.tax)}</dd></div>
              <div className="flex justify-between border-t pt-1 text-base font-bold"><dt>Total</dt><dd>{money(t.total)}</dd></div>
            </dl>
          </div>
          {errs.length > 0 && <ul className="text-sm text-destructive">{errs.map((e) => <li key={e}>{e}</li>)}</ul>}
          <Button className="w-full" disabled={busy} onClick={submit}>Issue invoice</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
