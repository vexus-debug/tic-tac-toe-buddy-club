import { FDI_LOWER, FDI_UPPER } from "@/lib/labWorkflow";
import type { ToothRole } from "@/lib/labScanner";
import { cn } from "@/lib/utils";

/**
 * Tap a tooth to select it. With `roles`, tapping again cycles it
 * Selected → Abutment → Pontic → off, for bridge prescriptions.
 */
export function TeethPicker({ value, onChange, roles, onRolesChange }: {
  value: string[]; onChange: (v: string[]) => void;
  roles?: Record<string, ToothRole>; onRolesChange?: (r: Record<string, ToothRole>) => void;
}) {
  const bridge = !!onRolesChange;
  const r = roles || {};
  const toggle = (t: string) => {
    if (!value.includes(t)) return onChange([...value, t]);
    if (!bridge) return onChange(value.filter((x) => x !== t));
    const next = { ...r };
    if (!r[t]) next[t] = "abutment";
    else if (r[t] === "abutment") next[t] = "pontic";
    else { delete next[t]; onChange(value.filter((x) => x !== t)); }
    onRolesChange!(next);
  };
  const row = (teeth: string[]) => (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
      {teeth.map((t) => {
        const on = value.includes(t), role = r[t];
        return (
          <button key={t} type="button" onClick={() => toggle(t)} aria-pressed={on} title={role ? `${t} ${role}` : t}
            className={cn("relative rounded border py-1 text-[10px] font-mono transition-colors",
              !on && "border-border bg-background hover:bg-muted",
              on && !role && "border-primary bg-primary text-primary-foreground",
              role === "abutment" && "border-primary bg-primary/80 text-primary-foreground ring-1 ring-primary",
              role === "pontic" && "border-dashed border-primary bg-primary/15 text-primary")}>
            {t}
            {role && <span className="block text-[8px] leading-none">{role === "abutment" ? "A" : "P"}</span>}
          </button>
        );
      })}
    </div>
  );
  const pontics = value.filter((t) => r[t] === "pontic"), abuts = value.filter((t) => r[t] === "abutment");
  return (
    <div className="space-y-1">
      {row(FDI_UPPER)}
      {row(FDI_LOWER)}
      <p className="text-[11px] text-muted-foreground">
        {value.length ? `Selected: ${value.join(", ")}` : "Tap teeth (FDI)"}
        {bridge && value.length > 0 && (abuts.length || pontics.length
          ? ` · Bridge: abutments ${abuts.join(", ") || "—"}, pontics ${pontics.join(", ") || "—"}`
          : " · Tap a selected tooth again to mark it Abutment, then Pontic")}
      </p>
    </div>
  );
}
