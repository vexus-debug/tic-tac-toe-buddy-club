import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { useLabInvoices } from "@/hooks/useLabInvoices";
import type { AgingBucket } from "@/lib/arAging";
import { bucketTotals } from "@/lib/labAging";
import { money } from "../dlabMoney";
import { toAging } from "./agingRows";

const CARDS: { b: AgingBucket; label: string; tone: string; bar: string }[] = [
  { b: "current", label: "Current", tone: "text-foreground", bar: "bg-primary" },
  { b: "31_60", label: "31–60d", tone: "text-foreground", bar: "bg-secondary-foreground/50" },
  { b: "61_90", label: "61–90d", tone: "text-destructive", bar: "bg-destructive/60" },
  { b: "90_plus", label: "90d+", tone: "text-destructive", bar: "bg-destructive" },
];

/** Four aging buckets with a proportion bar; clicking a card filters the invoice table. */
export default function AgingKpiStrip({ value, onChange }: { value: AgingBucket | null; onChange: (b: AgingBucket | null) => void }) {
  const { data: invoices = [] } = useLabInvoices();
  const totals = useMemo(() => bucketTotals(invoices.map(toAging)), [invoices]);
  const sum = CARDS.reduce((s, c) => s + totals[c.b].amount, 0);

  return (
    <section aria-label="Receivables aging" className="space-y-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {CARDS.map((c) => {
          const active = value === c.b;
          const has = totals[c.b].amount > 0;
          return (
            <button
              key={c.b}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : c.b)}
              className={`rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50 ${active ? "border-primary ring-2 ring-primary" : "border-border"}`}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${has ? c.bar : "bg-muted-foreground/40"}`} />{c.label}</span>
                {c.b === "90_plus" && totals[c.b].count > 0 && <span className="flex items-center gap-1 font-medium text-destructive"><ShieldAlert className="h-3 w-3" />Hold</span>}
              </div>
              <p className={`mt-1 text-lg font-semibold tabular-nums ${has ? c.tone : "text-muted-foreground"}`}>{money(totals[c.b].amount)}</p>
              <p className="text-xs text-muted-foreground">{totals[c.b].count} invoice{totals[c.b].count === 1 ? "" : "s"}</p>
            </button>
          );
        })}
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
        {sum > 0 && CARDS.map((c) => <div key={c.b} className={c.bar} style={{ width: `${(totals[c.b].amount / sum) * 100}%` }} />)}
      </div>
    </section>
  );
}
