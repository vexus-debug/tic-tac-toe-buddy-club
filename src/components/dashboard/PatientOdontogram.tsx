import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ClipboardPlus, Stamp, X } from "lucide-react";
import { useDentalChartEntries, useCreateDentalChartEntry, useUpdateDentalChartEntry } from "@/hooks/useDentalCharts";
import { useTreatments } from "@/hooks/useTreatments";
import { conditionProcedure, matchCatalogTreatment, useAddChartItemToPlan } from "@/hooks/useVisitFlow";
import { toothLabel, isPrimaryTooth, successorOf, type Notation } from "@/lib/dentalPhases";

type Dentition = "permanent" | "mixed" | "primary";

/** Conditions: `surface` = painted per surface; otherwise whole-tooth graphic. */
const CONDITIONS: { value: string; label: string; token: string; surface?: boolean; group: string }[] = [
  { value: "healthy", label: "Healthy", token: "--chart-enamel", group: "Status" },
  { value: "decayed", label: "Caries", token: "--chart-caries", surface: true, group: "Findings" },
  { value: "fractured", label: "Fractured", token: "--chart-fracture", surface: true, group: "Findings" },
  { value: "amalgam", label: "Amalgam", token: "--chart-amalgam", surface: true, group: "Restorations" },
  { value: "composite", label: "Composite", token: "--chart-composite", surface: true, group: "Restorations" },
  { value: "treated", label: "Restored (other)", token: "--chart-amalgam", surface: true, group: "Restorations" },
  { value: "crowned", label: "Crown", token: "--chart-crown", group: "Restorations" },
  { value: "veneer", label: "Veneer", token: "--chart-veneer", group: "Restorations" },
  { value: "root_canal", label: "Root canal", token: "--chart-endo", group: "Restorations" },
  { value: "implant", label: "Implant", token: "--chart-implant", group: "Prosthetic" },
  { value: "bridged", label: "Pontic / bridge", token: "--chart-crown", group: "Prosthetic" },
  { value: "missing", label: "Missing", token: "--chart-outline", group: "Status" },
  { value: "extracted", label: "Extracted", token: "--chart-caries", group: "Status" },
  { value: "congenitally_missing", label: "Congenitally missing", token: "--chart-outline", group: "Status" },
  { value: "unerupted", label: "Unerupted", token: "--chart-outline", group: "Status" },
  { value: "impacted", label: "Impacted", token: "--chart-planned", group: "Status" },
];
const GROUPS = ["Findings", "Restorations", "Prosthetic", "Status"];
const SURFACES = ["M", "O", "D", "B", "L"];
const PRESETS = ["O", "MO", "DO", "MOD", "B", "L", "MODBL"];
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const UPPER_PRIMARY = UPPER.map((t) => (t % 10 <= 5 ? t + 40 : null));
const LOWER_PRIMARY = LOWER.map((t) => (t % 10 <= 5 ? t + 40 : null));

const cond = (c: string) => CONDITIONS.find((x) => x.value === c) || CONDITIONS[0];
const label = (c: string) => CONDITIONS.find((x) => x.value === c)?.label || c;
const fill = (token: string) => `hsl(var(${token}))`;
const ABSENT = ["missing", "extracted", "congenitally_missing"];

type ToothData = { condition: string; surface: string | null; id: string };

export function PatientOdontogram({ patientId, canEdit }: { patientId: string; canEdit: boolean }) {
  const [notation, setNotation] = useState<Notation>("fdi");
  const [dentition, setDentition] = useState<Dentition>("permanent");
  const [stamp, setStamp] = useState<{ condition: string; surface: string } | null>(null);
  const { data: entries = [] } = useDentalChartEntries(patientId);
  const { data: treatments = [] } = useTreatments();
  const addToPlan = useAddChartItemToPlan();
  const createEntry = useCreateDentalChartEntry();
  const updateEntry = useUpdateDentalChartEntry();

  const teeth = useMemo(() => {
    const map: Record<number, ToothData> = {};
    (entries as any[]).forEach((e) => {
      const n = Number(e.tooth_number);
      if (!map[n]) map[n] = { condition: e.condition || "healthy", surface: e.surface || null, id: e.id };
    });
    return map;
  }, [entries]);

  // Auto-switch to mixed when primary teeth have been charted before.
  const hasPrimary = useMemo(() => Object.keys(teeth).some((k) => isPrimaryTooth(Number(k))), [teeth]);
  useEffect(() => { if (hasPrimary) setDentition((d) => (d === "permanent" ? "mixed" : d)); }, [hasPrimary]);

  const suggest = (condition: string) => {
    const rule = conditionProcedure[condition];
    if (!rule) return null;
    const t = matchCatalogTreatment(condition, treatments as any);
    return { label: t?.name || rule.label, cost: t ? Number(t.price || 0) : 0, treatmentId: t?.id || null, priced: !!t };
  };

  const setCondition = (tooth: number, condition: string, surface: string) => {
    const cur = teeth[tooth];
    const s = cond(condition).surface ? surface || null : null;
    if (cur) updateEntry.mutate({ id: cur.id, patient_id: patientId, condition, surface: s });
    else createEntry.mutate({
      patient_id: patientId, tooth_number: String(tooth), procedure: `Condition: ${label(condition)}`,
      condition, surface: s, entry_date: new Date().toISOString().split("T")[0],
    });
  };

  const plan = (tooth: number, condition: string, surface: string) => {
    const s = suggest(condition);
    if (!s) return;
    addToPlan.mutate({
      patient_id: patientId, tooth_number: tooth,
      description: surface ? `${s.label} (${surface})` : s.label,
      treatment_id: s.treatmentId, estimated_cost: s.cost,
    });
  };

  const row = (list: (number | null)[], upper: boolean) => (
    <div className="grid gap-0.5 sm:gap-1" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
      {list.map((t, i) => t == null ? <div key={`gap-${i}`} /> : (
        <ToothCell key={t} tooth={t} upper={upper} notation={notation} data={teeth[t]} canEdit={canEdit}
          stamp={stamp} suggest={suggest} onSet={setCondition} onPlan={plan} />
      ))}
    </div>
  );

  const showPerm = dentition !== "primary";
  const showPrim = dentition !== "permanent";

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Odontogram</CardTitle>
          <CardDescription>Tap a tooth to chart it, or pick a stamp and tap teeth to chart in one step.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleGroup type="single" size="sm" value={dentition} onValueChange={(v) => v && setDentition(v as Dentition)} aria-label="Dentition">
            <ToggleGroupItem value="permanent" className="text-xs">Adult</ToggleGroupItem>
            <ToggleGroupItem value="mixed" className="text-xs">Mixed</ToggleGroupItem>
            <ToggleGroupItem value="primary" className="text-xs">Child</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" size="sm" value={notation} onValueChange={(v) => v && setNotation(v as Notation)} aria-label="Tooth numbering">
            <ToggleGroupItem value="fdi" className="text-xs">FDI</ToggleGroupItem>
            <ToggleGroupItem value="universal" className="text-xs">Universal</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {canEdit && <StampBar stamp={stamp} setStamp={setStamp} />}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Upper · patient's right ←</p>
        {showPerm && row(UPPER, true)}
        {showPrim && row(UPPER_PRIMARY, true)}
        <div className="border-t border-dashed border-border my-1" />
        {showPrim && row(LOWER_PRIMARY, false)}
        {showPerm && row(LOWER, false)}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Lower</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2">
          {CONDITIONS.filter((c) => c.value !== "treated").map((c) => (
            <span key={c.value} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm border border-border" style={{ background: fill(c.token) }} />{c.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StampBar({ stamp, setStamp }: {
  stamp: { condition: string; surface: string } | null;
  setStamp: (s: { condition: string; surface: string } | null) => void;
}) {
  const [condition, setC] = useState("decayed");
  const [surface, setS] = useState("O");
  const isSurface = !!cond(condition).surface;
  const active = !!stamp;
  const apply = (c: string, s: string) => { setC(c); setS(s); if (active) setStamp({ condition: c, surface: cond(c).surface ? s : "" }); };

  return (
    <div className={`rounded-md border p-2 space-y-2 ${active ? "border-primary bg-primary/5" : "border-border"}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Stamp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <select value={condition} onChange={(e) => apply(e.target.value, surface)} aria-label="Stamp finding"
          className="h-7 rounded border border-input bg-background px-1.5 text-xs">
          {GROUPS.map((g) => (
            <optgroup key={g} label={g}>
              {CONDITIONS.filter((c) => c.group === g).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </optgroup>
          ))}
        </select>
        {isSurface && PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => apply(condition, p)} aria-pressed={surface === p}
            className={`h-7 rounded border px-1.5 text-[10px] font-bold ${surface === p ? "bg-primary text-primary-foreground border-primary" : "border-border bg-muted/30"}`}>
            {p === "MODBL" ? "All" : p}
          </button>
        ))}
        <Button size="sm" variant={active ? "secondary" : "default"} className="h-7 ml-auto text-xs"
          onClick={() => setStamp(active ? null : { condition, surface: isSurface ? surface : "" })}>
          {active ? <><X className="mr-1 h-3 w-3" />Stop stamping</> : "Start stamping"}
        </Button>
      </div>
      {active && (
        <p className="text-[11px] text-primary">
          Tap teeth to chart <strong>{label(stamp!.condition)}{stamp!.surface ? ` (${stamp!.surface})` : ""}</strong>.
        </p>
      )}
    </div>
  );
}

/** 5-surface anatomical tooth with root, restorations and status overlays. */
function ToothGraphic({ tooth, upper, data }: { tooth: number; upper: boolean; data?: ToothData }) {
  const condition = data?.condition || "healthy";
  const c = cond(condition);
  const surf = data?.surface || "";
  const q = Math.floor(tooth / 10);
  const mesialRight = [1, 4, 5, 8].includes(q); // patient's right is drawn on screen left
  const cy = upper ? 24 : 4;
  const o = { l: 4, r: 36, t: cy, b: cy + 32 };
  const i = { l: 14, r: 26, t: cy + 10, b: cy + 22 };
  const top = upper ? "B" : "L";
  const bottom = upper ? "L" : "B";
  const left = mesialRight ? "D" : "M";
  const right = mesialRight ? "M" : "D";
  const paths: Record<string, string> = {
    [top]: `M${o.l} ${o.t}L${o.r} ${o.t}L${i.r} ${i.t}L${i.l} ${i.t}Z`,
    [bottom]: `M${o.l} ${o.b}L${o.r} ${o.b}L${i.r} ${i.b}L${i.l} ${i.b}Z`,
    [left]: `M${o.l} ${o.t}L${i.l} ${i.t}L${i.l} ${i.b}L${o.l} ${o.b}Z`,
    [right]: `M${o.r} ${o.t}L${i.r} ${i.t}L${i.r} ${i.b}L${o.r} ${o.b}Z`,
    O: `M${i.l} ${i.t}L${i.r} ${i.t}L${i.r} ${i.b}L${i.l} ${i.b}Z`,
  };
  const surfaceFill = (s: string) => {
    if (condition === "crowned" || condition === "bridged") return fill(c.token);
    if (condition === "veneer" && s === "B") return fill(c.token);
    if (c.surface && (surf ? surf.includes(s) : s === "O")) return fill(c.token);
    return fill("--chart-enamel");
  };
  const root = upper ? `M12 ${o.t}L16 2L24 2L28 ${o.t}Z` : `M12 ${o.b}L16 58L24 58L28 ${o.b}Z`;
  const rootMidA = upper ? o.t : o.b;
  const rootMidB = upper ? 4 : 56;
  const absent = ABSENT.includes(condition);
  const dashed = condition === "unerupted" || condition === "congenitally_missing";
  const faded = absent || condition === "unerupted";

  return (
    <svg viewBox="0 0 40 60" className="h-full w-full" aria-hidden>
      <g opacity={faded ? 0.35 : 1} strokeDasharray={dashed ? "2 2" : undefined}>
        {condition === "implant" ? (
          <g stroke={fill("--chart-implant")} strokeWidth="2">
            <path d={root} fill={fill("--chart-implant")} opacity={0.35} stroke="none" />
            {[0, 1, 2, 3, 4].map((k) => {
              const y = upper ? 6 + k * 4 : o.b + 4 + k * 4;
              return <line key={k} x1="13" x2="27" y1={y} y2={y} />;
            })}
          </g>
        ) : condition !== "bridged" && (
          <path d={root} fill={fill("--chart-root")} stroke={fill("--chart-outline")} strokeWidth="1" />
        )}
        {condition === "root_canal" && (
          <line x1="20" x2="20" y1={rootMidA} y2={rootMidB} stroke={fill("--chart-endo")} strokeWidth="3" strokeLinecap="round" />
        )}
        {Object.entries(paths).map(([s, d]) => (
          <path key={s} d={d} fill={surfaceFill(s)} stroke={fill("--chart-outline")} strokeWidth="1" />
        ))}
        {(condition === "crowned" || condition === "bridged") && (
          <rect x={o.l} y={o.t} width="32" height="32" rx="3" fill="none" stroke={fill("--chart-crown")} strokeWidth="3" />
        )}
        {condition === "bridged" && (
          <line x1="0" x2="40" y1={cy + 16} y2={cy + 16} stroke={fill("--chart-crown")} strokeWidth="2" />
        )}
      </g>
      {absent && (
        <path d={`M${o.l} ${o.t}L${o.r} ${o.b}M${o.r} ${o.t}L${o.l} ${o.b}`}
          stroke={condition === "extracted" ? fill("--chart-caries") : fill("--chart-outline")} strokeWidth="3" strokeLinecap="round" />
      )}
      {condition === "impacted" && (
        <path d={upper ? `M10 ${cy + 26}L30 ${cy + 6}M30 ${cy + 6}L22 ${cy + 7}M30 ${cy + 6}L29 ${cy + 14}` : `M10 ${cy + 6}L30 ${cy + 26}M30 ${cy + 26}L22 ${cy + 25}M30 ${cy + 26}L29 ${cy + 18}`}
          stroke={fill("--chart-planned")} strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}

function ToothCell({ tooth, upper, notation, data, canEdit, stamp, suggest, onSet, onPlan }: {
  tooth: number; upper: boolean; notation: Notation; data?: ToothData; canEdit: boolean;
  stamp: { condition: string; surface: string } | null;
  suggest: (c: string) => { label: string; cost: number; priced: boolean } | null;
  onSet: (t: number, c: string, s: string) => void; onPlan: (t: number, c: string, s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const condition = data?.condition || "healthy";
  const sug = suggest(condition);
  const surface = surfaces.join("") || data?.surface || "";
  const primary = isPrimaryTooth(tooth);
  const name = toothLabel(tooth, notation);
  const aria = `Tooth ${name}${primary ? " (primary)" : ""}: ${label(condition)}${data?.surface ? ` ${data.surface}` : ""}`;

  const face = (
    <span className="flex h-full w-full flex-col items-center">
      {!upper && <span className="text-[9px] sm:text-[10px] font-bold leading-tight">{name}</span>}
      <span className={`block w-full flex-1 ${primary ? "px-0.5" : ""}`}><ToothGraphic tooth={tooth} upper={upper} data={data} /></span>
      {upper && <span className="text-[9px] sm:text-[10px] font-bold leading-tight">{name}</span>}
    </span>
  );
  const cls = `relative aspect-[2/3] min-h-12 rounded-md p-0.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${primary ? "bg-muted/40" : ""}`;

  if (stamp && canEdit) {
    return (
      <button type="button" aria-label={`${aria}. Stamp ${label(stamp.condition)}`} className={`${cls} cursor-crosshair`}
        onClick={() => onSet(tooth, stamp.condition, stamp.surface)}>{face}</button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={aria} className={cls}>{face}</button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-2" side="top">
        <div>
          <p className="text-xs font-semibold">Tooth {name} · {label(condition)}{data?.surface ? ` (${data.surface})` : ""}</p>
          {primary && <p className="text-[10px] text-muted-foreground">Primary tooth · successor {toothLabel(successorOf(tooth), notation)}</p>}
        </div>
        {canEdit ? (
          <>
            <div className="flex gap-1">
              {SURFACES.map((s) => (
                <button key={s} type="button" aria-pressed={surfaces.includes(s)} onClick={() => setSurfaces((c) => c.includes(s) ? c.filter((x) => x !== s) : [...c, s])}
                  className={`h-7 flex-1 rounded border text-[10px] font-bold ${surfaces.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border bg-muted/30"}`}>{s}</button>
              ))}
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1.5">
              {GROUPS.map((g) => (
                <div key={g}>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">{g}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {CONDITIONS.filter((c) => c.group === g || (g === "Status" && c.value === "healthy" && false)).map((c) => (
                      <button key={c.value} type="button" onClick={() => { onSet(tooth, c.value, surfaces.join("")); setSurfaces([]); }}
                        className={`flex items-center gap-1.5 rounded border border-border px-1.5 py-1 text-[11px] font-medium text-left hover:bg-accent ${c.value === condition ? "ring-2 ring-ring" : ""}`}>
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm border border-border" style={{ background: fill(c.token) }} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {sug && (
              <Button size="sm" className="w-full h-auto py-1.5 text-xs whitespace-normal" onClick={() => { onPlan(tooth, condition, surface); setOpen(false); setSurfaces([]); }}>
                <ClipboardPlus className="mr-1 h-3.5 w-3.5 shrink-0" />
                Add to plan: {sug.label}{sug.priced ? ` · ₦${sug.cost.toLocaleString()}` : ""}
              </Button>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Only clinicians can update the chart.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
