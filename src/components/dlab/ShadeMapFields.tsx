import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STUMP_SHADES, type ShadeMap } from "@/lib/labCatalog";

/** Stump (prep die) shade + cervical / body / incisal stratification for one case. */
export function ShadeMapFields({ value, onChange, options }: { value: ShadeMap; onChange: (v: ShadeMap) => void; options: string[] }) {
  const set = (k: keyof ShadeMap, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg border p-2 sm:col-span-2 sm:grid-cols-4">
      <div className="space-y-1"><Label className="text-xs">Stump shade</Label>
        <Select value={value.stump || "none"} onValueChange={(v) => set("stump", v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="none">Not set</SelectItem>{STUMP_SHADES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {(["cervical", "body", "incisal"] as const).map((k) => (
        <div key={k} className="space-y-1"><Label className="text-xs capitalize">{k === "incisal" ? "Incisal / translucency" : k}</Label>
          <Input list="dlab-shade-zone" value={value[k] || ""} onChange={(e) => set(k, e.target.value)} />
        </div>
      ))}
      <datalist id="dlab-shade-zone">{options.map((o) => <option key={o} value={o} />)}</datalist>
    </div>
  );
}
