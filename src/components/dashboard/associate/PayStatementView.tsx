import { Badge } from "@/components/ui/badge";
import type { AssociateKpis, PayLine, PayStatement } from "@/lib/associatePay";

export const naira = (n: number) =>
  `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const TYPE_LABEL: Record<string, string> = {
  procedure: "Procedure",
  lab_deduction: "Lab fee",
  guarantee_topup: "Guarantee",
};

export function StatementSummary({ s }: { s: PayStatement }) {
  const cells = [
    ["Gross production", naira(s.grossProduction)],
    ["Net (after discounts / unpaid)", naira(s.netProduction)],
    ["Commission earned", naira(s.commissionEarned)],
    ["Lab fee deductions", `− ${naira(s.labDeductions)}`],
    ["Guarantee top-up", naira(s.guaranteeTopUp)],
    ["Days worked", String(s.daysWorked)],
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-[11px] text-muted-foreground">{k}</p>
            <p className="text-sm font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3">
        <span className="text-sm font-medium">Total payable</span>
        <span className="text-lg font-bold text-primary">{naira(s.totalPayable)}</span>
      </div>
    </div>
  );
}

export function StatementLines({ lines }: { lines: (Pick<PayLine, "item_type" | "item_date" | "description" | "gross_amount" | "net_amount" | "earned_amount"> & { attribution?: number | null })[] }) {
  if (!lines.length) return <p className="py-6 text-center text-sm text-muted-foreground">No billed work in this period.</p>;
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border border-border/50">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/60">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Date</th>
            <th className="px-3 py-2 text-left font-medium">Item</th>
            <th className="px-3 py-2 text-right font-medium">Split</th>
            <th className="px-3 py-2 text-right font-medium">Fee</th>
            <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">Net</th>
            <th className="px-3 py-2 text-right font-medium">Earned</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-t border-border/30">
              <td className="px-3 py-2 font-mono text-muted-foreground">{l.item_date || "—"}</td>
              <td className="px-3 py-2">
                <Badge variant="outline" className="mr-2 text-[10px]">{TYPE_LABEL[l.item_type] || l.item_type}</Badge>
                {l.description}
              </td>
              <td className="px-3 py-2 text-right text-muted-foreground">{l.item_type !== "procedure" ? "—" : l.attribution == null ? <span title="Recorded before split tracking — share not captured">Not recorded</span> : `${l.attribution}%`}</td>
              <td className="px-3 py-2 text-right">{naira(l.gross_amount)}</td>
              <td className="px-3 py-2 text-right hidden sm:table-cell">{l.item_type === "procedure" ? naira(l.net_amount) : "—"}</td>
              <td className={`px-3 py-2 text-right font-semibold ${Number(l.earned_amount) < 0 ? "text-destructive" : ""}`}>{naira(l.earned_amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KpiCards({ k }: { k: AssociateKpis }) {
  const cells: [string, string, boolean][] = [
    ["Net production", naira(k.netProduction), false],
    ["Collections ratio", `${k.collectionsRatio}%`, false],
    ["Lab deductions", `− ${naira(k.labDeductions)}`, false],
    ["Draw balance", `${k.drawBalance < 0 ? "− " : ""}${naira(Math.abs(k.drawBalance))}`, k.drawBalance < 0],
  ];
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {cells.map(([label, value, negative]) => (
        <div key={label} className="rounded-lg border border-border/50 bg-card p-3">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className={`text-base font-bold ${negative ? "text-destructive" : "text-foreground"}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

/** Opens a printable pay stub; the browser's print dialog also saves it as PDF. */
export function printPayStub(opts: { title: string; staffName: string; lines: any[]; total: number; paid?: number }) {
  const rows = opts.lines.map((l) => `<tr><td>${esc(l.item_date || "—")}</td><td>${esc(TYPE_LABEL[l.item_type] || l.item_type)}: ${esc(l.description)}</td><td class="r">${l.item_type !== "procedure" ? "—" : l.attribution == null ? "Not recorded" : `${esc(l.attribution)}%`}</td><td class="r">${esc(naira(l.gross_amount))}</td><td class="r">${esc(naira(l.earned_amount))}</td></tr>`).join("");
  const html = `<!doctype html><html><head><title>${esc(opts.title)}</title><style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}h1{font-size:18px;margin:0}p{margin:4px 0 16px;color:#555;font-size:13px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left}.r{text-align:right}tfoot td{font-weight:700}</style></head><body><h1>Pay statement — ${esc(opts.staffName)}</h1><p>${esc(opts.title)}</p><table><thead><tr><th>Date</th><th>Item</th><th class="r">Split</th><th class="r">Fee</th><th class="r">Earned</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="4">Total payable</td><td class="r">${esc(naira(opts.total))}</td></tr>${opts.paid != null ? `<tr><td colspan="4">Paid</td><td class="r">${esc(naira(opts.paid))}</td></tr>` : ""}</tfoot></table><script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
