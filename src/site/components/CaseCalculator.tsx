import { useState } from "react";
import { Plus, X } from "lucide-react";

const DAY = 86400000;

export function countCases(dates: string[]) {
  const sorted = dates.filter(Boolean).map((d) => new Date(d).getTime()).sort((a, b) => a - b);
  const cases: { start: number; visits: number[] }[] = [];
  for (const t of sorted) {
    const cur = cases[cases.length - 1];
    if (cur && t - cur.start < 30 * DAY && cur.visits.length < 3) cur.visits.push(t);
    else cases.push({ start: t, visits: [t] });
  }
  return cases;
}

const fmt = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const CaseCalculator = () => {
  const [dates, setDates] = useState<string[]>(["", ""]);
  const cases = countCases(dates);
  const set = (i: number, v: string) => setDates((d) => d.map((x, j) => (j === i ? v : x)));

  return (
    <div className="rounded-2xl border border-border bg-card p-8 md:col-span-2">
      <h2 className="text-xl font-bold text-foreground">Case calculator (one patient)</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter the visit dates for one patient to see how many cases and credits are used.</p>
      <div className="mt-4 space-y-2">
        {dates.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 text-sm text-muted-foreground">Visit {i + 1}</span>
            <input type="date" value={d} onChange={(e) => set(i, e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-foreground" />
            {dates.length > 1 && (
              <button type="button" aria-label="Remove visit" onClick={() => setDates((x) => x.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setDates((d) => [...d, ""])} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <Plus className="h-4 w-4" /> Add visit
      </button>
      <div className="mt-6 rounded-xl bg-muted p-4">
        <p className="text-lg font-bold text-foreground">
          {cases.length} case{cases.length === 1 ? "" : "s"} = {cases.length} credit{cases.length === 1 ? "" : "s"} (₦{(cases.length * 1000).toLocaleString()})
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {cases.map((c, i) => (
            <li key={i}>Case {i + 1}: opened {fmt(c.start)}, covers {c.visits.length} visit{c.visits.length === 1 ? "" : "s"} until {fmt(c.start + 29 * DAY)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CaseCalculator;
