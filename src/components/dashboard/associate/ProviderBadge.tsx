import { cn } from "@/lib/utils";

export type ProviderType = "owner" | "in_house" | "associate" | "locum";

export const PROVIDER_TYPES: { value: ProviderType; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "in_house", label: "In-House Dentist" },
  { value: "associate", label: "Associate" },
  { value: "locum", label: "Locum" },
];

const STYLE: Record<ProviderType, string> = {
  owner: "border-primary/30 bg-primary/10 text-primary",
  in_house: "border-secondary/30 bg-secondary/10 text-secondary",
  associate: "border-warning/40 bg-warning/10 text-warning",
  locum: "border-accent-foreground/20 bg-accent text-accent-foreground",
};

export const providerLabel = (t?: string | null) =>
  PROVIDER_TYPES.find((p) => p.value === t)?.label ?? "In-House Dentist";

/** True for contracted providers paid by commission (associates & locums). */
export const isContracted = (t?: string | null) => t === "associate" || t === "locum";

export function ProviderBadge({ type, className, compact }: { type?: string | null; className?: string; compact?: boolean }) {
  const t = (type || "in_house") as ProviderType;
  if (compact) {
    if (!isContracted(t)) return null;
    return <span aria-label={providerLabel(t)} title={providerLabel(t)} className={cn("inline-block h-2 w-2 shrink-0 rounded-full bg-warning", className)} />;
  }
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", STYLE[t] ?? STYLE.in_house, className)}>
      {providerLabel(t)}
    </span>
  );
}
