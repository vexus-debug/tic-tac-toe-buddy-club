import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "sonner";
import { SITES, bopPercent, cal, emptyTooth, hasFurcation, type PerioTeeth, type PerioTooth } from "@/lib/perio";

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const ALL = [...UPPER, ...LOWER];

interface ChartRow { id: string; exam_date: string; teeth: PerioTeeth; bop_percent: number | null }

const db = supabase as any;

export function PerioChart({ patientId, canEdit }: { patientId: string; canEdit: boolean }) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  const qc = useQueryClient();
  const key = ["perio_charts", patientId];
  const { data: charts = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db.from("perio_charts").select("id, exam_date, teeth, bop_percent").eq("patient_id", patientId).order("exam_date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data as ChartRow[];
    },
  });

  const [teeth, setTeeth] = useState<PerioTeeth>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string>("");
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (charts[0] && editingId === null && Object.keys(teeth).length === 0) {
      setEditingId(charts[0].id);
      setTeeth(charts[0].teeth || {});
      if (charts[1]) setCompareId(charts[1].id);
    }
  }, [charts]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async () => {
      const payload = { teeth, bop_percent: bopPercent(teeth) };
      if (editingId) {
        const { error } = await db.from("perio_charts").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await db.from("perio_charts").insert({ ...payload, org_id: orgId, patient_id: patientId, created_by: u.user?.id }).select("id").single();
        if (error) throw error;
        setEditingId(data.id);
      }
    },
    onSuccess: () => { toast.success("Gum chart saved"); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: any) => toast.error(e.message),
  });

  const tooth = (t: number): PerioTooth => teeth[t] ?? emptyTooth();
  const patch = (t: number, fn: (x: PerioTooth) => void) =>
    setTeeth((prev) => { const x = structuredClone(prev[t] ?? emptyTooth()); fn(x); return { ...prev, [t]: x }; });

  // Auto-advance order: each tooth's 6 sites, then next tooth.
  const order = useMemo(() => ALL.flatMap((t) => SITES.map((_, i) => `pd-${t}-${i}`)), []);
  const advance = (id: string) => {
    const n = order[order.indexOf(id) + 1];
    if (n) inputs.current[n]?.focus();
  };

  const prev = charts.find((c) => c.id === compareId);
  const bop = bopPercent(teeth);
  const deep = Object.values(teeth).reduce((n, t) => n + t.pd.filter((v) => (v ?? 0) >= 5).length, 0);

  const startNew = () => { if (editingId) setCompareId(editingId); setEditingId(null); setTeeth({}); };
  const load = (id: string) => { const c = charts.find((x) => x.id === id); if (c) { setEditingId(c.id); setTeeth(c.teeth || {}); } };

  const renderArch = (row: number[], upper: boolean) => (
    <div className="overflow-x-auto">
      <table className="text-[11px] border-collapse min-w-max">
        <tbody>
          <tr>
            <td className="pr-2 text-muted-foreground">Tooth</td>
            {row.map((t) => <td key={t} className="text-center font-semibold px-1">{t}</td>)}
          </tr>
          {(upper ? [0, 1] : [1, 0]).map((side) => {
            const idx = side === 0 ? [0, 1, 2] : [3, 4, 5];
            const label = side === 0 ? "Buccal" : upper ? "Palatal" : "Lingual";
            return (
              <tr key={side}>
                <td className="pr-2 text-muted-foreground align-top pt-1">{label}<div className="text-[9px]">PD / Rec / CAL</div></td>
                {row.map((t) => {
                  const x = tooth(t);
                  return (
                    <td key={t} className="px-0.5 py-1 border-l border-border">
                      <div className="flex gap-px">
                        {idx.map((i) => {
                          const id = `pd-${t}-${i}`;
                          const pd = x.pd[i];
                          const c = cal(pd, x.rec[i]);
                          return (
                            <div key={i} className="flex flex-col items-center gap-px">
                              <input
                                ref={(el) => { inputs.current[id] = el; }}
                                aria-label={`${t} ${SITES[i]} probing depth`}
                                disabled={!canEdit}
                                inputMode="numeric"
                                value={pd ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, "").slice(-2);
                                  patch(t, (y) => { y.pd[i] = v === "" ? null : Number(v); });
                                  if (v.length === 1 && Number(v) !== 1) advance(id);
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") advance(id); }}
                                className={`w-6 h-6 text-center rounded border border-input bg-background ${(pd ?? 0) >= 5 ? "text-destructive font-bold" : ""}`}
                              />
                              <input
                                aria-label={`${t} ${SITES[i]} recession`}
                                disabled={!canEdit}
                                value={x.rec[i] ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/[^\d-]/g, "").slice(0, 3);
                                  patch(t, (y) => { y.rec[i] = v === "" || v === "-" ? null : Number(v); });
                                }}
                                className="w-6 h-5 text-center rounded border border-input bg-muted text-[10px]"
                              />
                              <span className="text-[9px] text-muted-foreground h-3">{c ?? ""}</span>
                              <div className="flex gap-px">
                                <button type="button" disabled={!canEdit} aria-label="Bleeding" title="Bleeding on probing"
                                  onClick={() => patch(t, (y) => { y.bop[i] = !y.bop[i]; })}
                                  className={`w-2.5 h-2.5 rounded-full border border-destructive ${x.bop[i] ? "bg-destructive" : ""}`} />
                                <button type="button" disabled={!canEdit} aria-label="Pus" title="Suppuration"
                                  onClick={() => patch(t, (y) => { y.sup[i] = !y.sup[i]; })}
                                  className={`w-2.5 h-2.5 rounded-full border border-warning ${x.sup[i] ? "bg-warning" : ""}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr>
            <td className="pr-2 text-muted-foreground">Mobility</td>
            {row.map((t) => (
              <td key={t} className="text-center">
                <select disabled={!canEdit} aria-label={`${t} mobility`} value={tooth(t).mobility ?? 0}
                  onChange={(e) => patch(t, (y) => { y.mobility = Number(e.target.value) as any; })}
                  className="bg-background border border-input rounded text-[10px]">
                  {[0, 1, 2, 3].map((g) => <option key={g} value={g}>{g ? ["", "I", "II", "III"][g] : "–"}</option>)}
                </select>
              </td>
            ))}
          </tr>
          <tr>
            <td className="pr-2 text-muted-foreground">Furcation</td>
            {row.map((t) => (
              <td key={t} className="text-center">
                {hasFurcation(t) && (
                  <select disabled={!canEdit} aria-label={`${t} furcation`} value={tooth(t).furcation ?? 0}
                    onChange={(e) => patch(t, (y) => { y.furcation = Number(e.target.value) as any; })}
                    className="bg-background border border-input rounded text-[10px]">
                    {[0, 1, 2, 3, 4].map((g) => <option key={g} value={g}>{g ? ["", "I", "II", "III", "IV"][g] : "–"}</option>)}
                  </select>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <Wave row={row} cur={teeth} prev={prev?.teeth} />
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Gum chart (periodontal)</CardTitle>
          <CardDescription>Type depths 1-2-3… the cursor moves on by itself. Red dot = bleeding, yellow = pus.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={bop > 30 ? "destructive" : "secondary"}>BOP {bop}%</Badge>
          <Badge variant="outline">Pockets ≥5mm: {deep}</Badge>
          {charts.length > 0 && (
            <Select value={editingId ?? "new"} onValueChange={(v) => (v === "new" ? startNew() : load(v))}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New exam</SelectItem>
                {charts.map((c) => <SelectItem key={c.id} value={c.id}>{c.exam_date}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {canEdit && <Button size="sm" variant="outline" onClick={startNew}>New exam</Button>}
          {canEdit && <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !orgId}>Save</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {charts.length > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Compare with:</span>
            <Select value={compareId || "none"} onValueChange={(v) => setCompareId(v === "none" ? "" : v)}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {charts.filter((c) => c.id !== editingId).map((c) => <SelectItem key={c.id} value={c.id}>{c.exam_date}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div><div className="text-xs font-medium mb-1">Upper</div>{renderArch(UPPER, true)}</div>
        <div><div className="text-xs font-medium mb-1">Lower</div>{renderArch(LOWER, false)}</div>
      </CardContent>
    </Card>
  );
}

/** Probing-depth wave: current (solid) vs previous (dashed), buccal sites. */
function Wave({ row, cur, prev }: { row: number[]; cur: PerioTeeth; prev?: PerioTeeth }) {
  const W = 16 * 3 * 12, H = 60, step = 12, scale = 6;
  const pts = (src?: PerioTeeth) =>
    row.flatMap((t, ti) => [0, 1, 2].map((i) => {
      const v = src?.[t]?.pd[i];
      return v == null ? null : `${ti * 36 + i * step + 6},${Math.min(H, 4 + v * scale)}`;
    })).filter(Boolean).join(" ");
  const c = pts(cur), p = pts(prev);
  if (!c && !p) return null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[576px] h-14 mt-1" aria-label="Pocket depth wave">
      <line x1="0" x2={W} y1={4 + 4 * scale} y2={4 + 4 * scale} stroke="hsl(var(--destructive))" strokeOpacity="0.3" strokeDasharray="2 3" />
      {p && <polyline points={p} fill="none" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 3" strokeWidth="1.5" />}
      {c && <polyline points={c} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />}
    </svg>
  );
}
