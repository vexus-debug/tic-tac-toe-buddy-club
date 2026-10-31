import { useMemo, useState } from "react";
import { format } from "date-fns";
import { RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLabCases, type LabCaseRow } from "@/hooks/useLabCases";
import { useLabRecords, useSaveLabRecord } from "@/hooks/useLabRecords";
import { useStaff } from "@/hooks/useStaff";
import { clientOf, patientOf } from "@/hooks/useDentalLab";
import { stageLabel } from "@/config/dentalLab";
import { REMAKE_FAULTS, remakeRateBy, periodRemakeRate, freeRemakeValue } from "@/lib/labRemake";
import { RemakeDialog } from "@/components/dlab/RemakeDialog";

const money = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const STATUSES = ["open", "in remake", "resolved", "rejected"];

export default function DlabWarrantiesPage() {
  const { data: cases = [] } = useLabCases();
  const { data: claims = [] } = useLabRecords("warranties");
  const save = useSaveLabRecord("warranties");
  const { data: staff = [] } = useStaff();
  const [q, setQ] = useState("");
  const [fault, setFault] = useState("all");
  const [remake, setRemake] = useState<LabCaseRow | null>(null);
  const staffName = (id?: string | null) => staff.find((s) => s.id === id)?.full_name || "Unassigned";

  const live = cases.filter((c) => c.status !== "cancelled");
  const originals = live.filter((c) => !(c as any).parent_case_id);
  const children = live.filter((c) => (c as any).parent_case_id);
  const parentOf = (c: LabCaseRow) => cases.find((p) => p.id === (c as any).parent_case_id);
  // Last 90 days: remakes opened ÷ originals delivered in the same window (in-progress work is excluded).
  const periodTo = new Date().toISOString().slice(0, 10);
  const periodFrom = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const rate = periodRemakeRate(cases as any, periodFrom, periodTo).pct;
  const lost = freeRemakeValue(claims as any);
  const byFault = (k: string) => claims.filter((r) => r.data?.fault === k).length;

  const kpis = useMemo(() => {
    const src = children.map((c) => parentOf(c) || c);
    return {
      clinic: remakeRateBy(originals, src, clientOf).slice(0, 5),
      work: remakeRateBy(originals, src, (c) => c.work_type).slice(0, 5),
      tech: remakeRateBy(originals, src, (c) => staffName(c.technician_id)).slice(0, 5),
    };
  }, [cases, staff]); // eslint-disable-line react-hooks/exhaustive-deps

  const found = q.trim().length >= 2 ? originals.concat(children).filter((c) =>
    [c.case_number, clientOf(c), patientOf(c)].join(" ").toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];

  const list = claims.filter((r) => fault === "all" || r.data?.fault === fault || (fault === "none" && !r.data?.fault));
  const childStatus = (id?: string) => cases.find((c) => c.id === id)?.status;

  return (
    <div className="space-y-5">
      <PageHeader title="Remakes & Warranties" description="Start remakes from any case, record who is responsible, and watch remake rates." />

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Remake rate (90 days)" value={`${rate}%`} />
        <Kpi label="Lab fault" value={byFault("lab")} />
        <Kpi label="Clinic fault (billed)" value={byFault("clinic")} />
        <Kpi label="Free remake value" value={money(lost)} sub={`${byFault("material")} material claims`} />
      </div>

      <Card><CardContent className="space-y-2 p-4">
        <p className="text-sm font-semibold">Start a remake</p>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Case number, clinic or patient…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {found.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-md border p-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium"><span className="font-mono text-xs text-muted-foreground">{c.case_number}</span> · {c.work_type}</p>
              <p className="truncate text-xs text-muted-foreground">{clientOf(c)} · {patientOf(c)} · {stageLabel(c.status)}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setRemake(c)}><RotateCcw className="mr-1 h-3.5 w-3.5" />Remake</Button>
          </div>
        ))}
        {q.trim().length >= 2 && !found.length && <p className="text-xs text-muted-foreground">No matching cases.</p>}
      </CardContent></Card>

      <div className="grid gap-3 md:grid-cols-3">
        <RateList title="By clinic" rows={kpis.clinic} />
        <RateList title="By work type" rows={kpis.work} />
        <RateList title="By technician" rows={kpis.tech} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Claims</h2>
          <Select value={fault} onValueChange={setFault}>
            <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All responsibility</SelectItem>
              {REMAKE_FAULTS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
              <SelectItem value="none">Not recorded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card><CardContent className="divide-y p-0">
          {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No remakes yet.</p>}
          {list.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.title}{r.data?.child_number ? <> → <span className="font-mono">{r.data.child_number}</span></> : null} · {r.data?.work_type || ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.record_date ? format(new Date(r.record_date), "d MMM yyyy") : ""}
                  {r.data?.client ? ` · ${r.data.client}` : ""}{r.data?.reason ? ` · ${r.data.reason}` : ""}
                  {r.data?.child_case_id ? ` · remake: ${stageLabel(childStatus(r.data.child_case_id))}` : ""}
                </p>
              </div>
              <Badge variant={r.data?.fault === "clinic" ? "secondary" : "outline"}>
                {REMAKE_FAULTS.find((f) => f.key === r.data?.fault)?.label || "Not recorded"}{r.data?.fault === "clinic" ? ` · ${money(r.amount)}` : ""}
              </Badge>
              <Select value={r.status} onValueChange={(v) => save.mutate({ ...r, status: v } as any)}>
                <SelectTrigger className="h-8 w-32 capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </CardContent></Card>
      </div>

      {remake && <RemakeDialog c={remake} onClose={() => { setRemake(null); setQ(""); }} />}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</CardContent></Card>;
}

function RateList({ title, rows }: { title: string; rows: { name: string; remakes: number; total: number; pct: number }[] }) {
  return (
    <Card><CardContent className="p-4">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{title}</p>
      {!rows.length && <p className="text-xs text-muted-foreground">No remakes yet.</p>}
      {rows.map((r) => (
        <div key={r.name} className="flex justify-between py-0.5 text-sm"><span className="truncate">{r.name}</span><span className="shrink-0 tabular-nums">{r.pct}% <span className="text-xs text-muted-foreground">({r.remakes}/{r.total})</span></span></div>
      ))}
    </CardContent></Card>
  );
}
