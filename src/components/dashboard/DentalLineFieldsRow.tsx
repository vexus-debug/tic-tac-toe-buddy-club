import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ProviderBadge } from "@/components/dashboard/associate/ProviderBadge";
import type { DentalLineFields } from "@/hooks/useInvoices";

export const CLINICAL_PROVIDER_ROLES = ["dentist", "hygienist", "doctor", "specialist", "orthodontist", "surgeon"];
const SURFACES = ["M", "O", "D", "B", "L", "F", "I"];

interface Props {
  value: DentalLineFields;
  onChange: (v: DentalLineFields) => void;
  providers: { id: string; full_name: string; role?: string; provider_type?: string | null }[];
  className?: string;
}

/** Optional tooth / surface / CDT / provider details for one bill line. Leave blank for retail items. */
export function DentalLineFieldsRow({ value, onChange, providers, className }: Props) {
  const selected = providers.find((p) => p.id === value.provider_id);
  const surfaces = (value.surfaces || "").toUpperCase();
  const toggle = (s: string) => {
    const next = surfaces.includes(s) ? surfaces.replace(s, "") : SURFACES.filter((x) => surfaces.includes(x) || x === s).join("");
    onChange({ ...value, surfaces: next });
  };
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-[80px_auto_100px_1fr] gap-2 items-center rounded-md border border-dashed border-border/70 bg-muted/20 p-2", className)}>
      <Input
        aria-label="Tooth number"
        placeholder="Tooth #"
        className="h-8 text-xs"
        maxLength={4}
        value={value.tooth_number || ""}
        onChange={(e) => onChange({ ...value, tooth_number: e.target.value.replace(/[^0-9A-Ta-t]/g, "") })}
      />
      <div className="flex gap-0.5" role="group" aria-label="Surfaces">
        {SURFACES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            aria-pressed={surfaces.includes(s)}
            className={cn(
              "h-8 w-6 rounded text-[11px] font-semibold border transition-colors",
              surfaces.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <Input
        aria-label="CDT code"
        placeholder="CDT e.g. D2391"
        className="h-8 text-xs font-mono uppercase"
        maxLength={6}
        value={value.cdt_code || ""}
        onChange={(e) => onChange({ ...value, cdt_code: e.target.value.toUpperCase() })}
      />
      <Select value={value.provider_id || "none"} onValueChange={(v) => onChange({ ...value, provider_id: v === "none" ? null : v, ...(v === "none" || v === value.secondary_provider_id ? { secondary_provider_id: null, split_ratio: 100 } : {}) })}>
        <SelectTrigger className="h-8 text-xs" aria-label="Treating provider"><SelectValue placeholder="Treating provider" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No provider</SelectItem>
          {providers.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-1.5">{p.full_name}{p.role ? ` · ${p.role}` : ""}<ProviderBadge compact type={p.provider_type} /></span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value.provider_id && (
        <div className="col-span-2 sm:col-span-4 flex flex-wrap items-center gap-2">
          {selected && <ProviderBadge type={selected.provider_type} />}
          {!value.secondary_provider_id ? (
            <button type="button" className="text-[11px] font-medium text-primary hover:underline"
              onClick={() => { const other = providers.find((p) => p.id !== value.provider_id); if (other) onChange({ ...value, secondary_provider_id: other.id, split_ratio: 50 }); }}>
              + Add Co-Provider / Split
            </button>
          ) : (
            <>
              <Select value={value.secondary_provider_id} onValueChange={(v) => onChange({ ...value, secondary_provider_id: v })}>
                <SelectTrigger className="h-8 w-44 text-xs" aria-label="Co-provider"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providers.filter((p) => p.id !== value.provider_id).map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                Primary %
                <Input type="number" min={0} max={100} className="h-8 w-16 text-xs" aria-label="Primary provider share"
                  value={value.split_ratio ?? 50} onChange={(e) => onChange({ ...value, split_ratio: Math.min(100, Math.max(0, Number(e.target.value))) })} />
              </label>
              <span className="text-[11px] text-muted-foreground">Co-provider gets {100 - Number(value.split_ratio ?? 50)}%</span>
              <button type="button" className="text-[11px] text-destructive hover:underline" onClick={() => onChange({ ...value, secondary_provider_id: null, split_ratio: 100 })}>Remove split</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Short label like "#14 · MOD · D2391". Empty string when nothing dental is set. */
export function dentalSummary(li: DentalLineFields, providerName?: string) {
  return [li.tooth_number && `#${li.tooth_number}`, li.surfaces, li.cdt_code, providerName].filter(Boolean).join(" · ");
}
