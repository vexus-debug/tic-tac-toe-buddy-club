// Pure helpers for the dental lab Catalogue & Stock (work types, material stock, shade library).
import { WORK_TYPES } from "@/config/dentalLab";
import { turnaroundFor } from "@/lib/labCalendar";

export interface CatalogRecord { id?: string; title: string; status: string; amount: number | null; record_date?: string | null; data: Record<string, any> }

export interface WorkTypeOption { name: string; price: number | null; turnaround: number; category?: string; cdt?: string; material?: string; multiUnit?: boolean }

/** Active catalogue work types first, then built-in defaults not already in the catalogue. */
export function workTypeOptions(records: CatalogRecord[]): WorkTypeOption[] {
  const out: WorkTypeOption[] = [];
  const seen = new Set<string>();
  records.filter((r) => r.status === "active" && r.title?.trim()).forEach((r) => {
    const name = r.title.trim();
    const k = name.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    const t = Number(r.data?.turnaround_days);
    out.push({
      name, price: Number(r.amount) > 0 ? Number(r.amount) : null,
      turnaround: t > 0 ? Math.round(t) : turnaroundFor(name),
      category: r.data?.category, cdt: r.data?.cdt, material: r.data?.material,
      multiUnit: r.data?.multi_unit === "Yes",
    });
  });
  // Retired catalogue items are hidden, including built-in names.
  const retired = new Set(records.filter((r) => r.status === "retired").map((r) => r.title?.trim().toLowerCase()));
  WORK_TYPES.forEach((w) => {
    const k = w.toLowerCase();
    if (seen.has(k) || retired.has(k)) return;
    seen.add(k);
    out.push({ name: w, price: null, turnaround: turnaroundFor(w) });
  });
  return out;
}

/** Clinic agreed price wins; otherwise the catalogue default price; otherwise nothing. */
export const suggestedFee = (agreed: number | null, catalogPrice: number | null): number | null =>
  agreed !== null ? agreed : catalogPrice;

export type StockState = "in stock" | "low" | "used up" | "expired" | "recalled";

/** Stock state from quantity, safety minimum, expiry and recall flag. */
export function stockState(r: CatalogRecord, today: string): StockState {
  if (r.status === "recalled") return "recalled";
  if (r.record_date && r.record_date < today) return "expired";
  const qty = Number(r.amount || 0);
  const min = Number(r.data?.min_stock || 0);
  if (qty <= 0) return "used up";
  if (qty <= min) return "low";
  return "in stock";
}

/** Lots a technician may draw from: not recalled, not expired, quantity left. Soonest expiry first (FEFO). */
export function usableLots(records: CatalogRecord[], today: string) {
  return records
    .filter((r) => { const s = stockState(r, today); return s === "in stock" || s === "low"; })
    .sort((a, b) => (a.record_date || "9999-12-31").localeCompare(b.record_date || "9999-12-31"));
}

/** Lots expiring within `days` (still usable), for an early warning. */
export function expiringSoon(records: CatalogRecord[], today: string, days = 30) {
  const limit = new Date(today + "T00:00:00");
  limit.setDate(limit.getDate() + days);
  const lim = limit.toISOString().slice(0, 10);
  return records.filter((r) => r.record_date && r.record_date >= today && r.record_date <= lim && r.status !== "recalled" && Number(r.amount || 0) > 0);
}

export function stockSummary(records: CatalogRecord[], today: string) {
  const states = records.map((r) => stockState(r, today));
  return {
    lots: records.length,
    usable: states.filter((s) => s === "in stock" || s === "low").length,
    low: states.filter((s) => s === "low").length,
    expired: states.filter((s) => s === "expired").length,
    recalled: states.filter((s) => s === "recalled").length,
    expiringSoon: expiringSoon(records, today).length,
  };
}

export const STUMP_SHADES = ["ND1", "ND2", "ND3", "ND4", "ND5", "ND6", "ND7", "ND8", "ND9"];

/** Active shade codes from the library, falling back to the VITA Classical guide. */
export const VITA_CLASSICAL = ["BL1", "BL2", "BL3", "BL4", "A1", "A2", "A3", "A3.5", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D2", "D3", "D4"];
export function shadeOptions(records: CatalogRecord[]): string[] {
  const lib = records.filter((r) => r.status === "active" && r.title?.trim()).map((r) => r.title.trim());
  return [...new Set([...lib, ...VITA_CLASSICAL])];
}

/** Library entry matching a case's shade (case-insensitive), for showing notes on the bench. */
export const findShade = (records: CatalogRecord[], code?: string | null) =>
  code ? records.find((r) => r.status === "active" && r.title?.trim().toLowerCase() === code.trim().toLowerCase()) : undefined;

/** Short clinical spec line for a stock lot, e.g. "14 mm · ST · A2 · 405 nm". */
export function materialSpecs(r: { data?: Record<string, any> | null }): string {
  const d = r.data || {};
  const keys = ["thickness", "translucency", "spec", "size", "wavelength", "bio_class", "platform", "interface"];
  const vals = keys.map((k) => d[k]).filter((v) => v && v !== "Not applicable");
  if (d.volume_ml) vals.push(`${d.volume_ml} ml`);
  return vals.join(" · ");
}

export interface ShadeMap { stump?: string; cervical?: string; body?: string; incisal?: string }

/** Bench recipe line: case-specific stratification wins over the library entry; adds firing notes. */
export function shadeRecipe(map: ShadeMap | null | undefined, lib?: Record<string, any> | null): { line: string; firing: string } {
  const m = map || {}; const d = lib || {};
  const pick = (k: keyof ShadeMap) => m[k] || d[k];
  const line = [d.guide, pick("stump") && `Stump ${pick("stump")}`, pick("cervical") && `Cervical ${pick("cervical")}`,
    pick("body") && `Body ${pick("body")}`, pick("incisal") && `Incisal ${pick("incisal")}`, d.notes].filter(Boolean).join(" · ");
  return { line, firing: d.recipe || "" };
}

/** Clinical domains used to group the restoration catalogue. Older categories map onto them. */
export const CLINICAL_DOMAINS = ["Fixed Prosthetics", "Removables", "Implants", "Orthodontics & Splints", "Other"] as const;
export function clinicalDomain(category?: string | null): (typeof CLINICAL_DOMAINS)[number] {
  const c = (category || "").toLowerCase();
  if (c.startsWith("fixed")) return "Fixed Prosthetics";
  if (c.startsWith("remov")) return "Removables";
  if (c.startsWith("implant")) return "Implants";
  if (c.startsWith("ortho") || c.startsWith("appliance") || c.includes("splint")) return "Orthodontics & Splints";
  return "Other";
}

/** Tier price: catalogue fee less the tier discount percent, rounded to 2dp. */
export function tierPrice(catalogPrice: number | null, discountPct: number | null): number | null {
  if (catalogPrice === null || discountPct === null || !(discountPct > 0)) return null;
  const pct = Math.min(100, discountPct);
  return Math.round(catalogPrice * (100 - pct)) / 100;
}

/** Fee chain: clinic custom price → clinic's tier schedule → catalogue default. */
export function resolveFee(custom: number | null, catalogPrice: number | null, tierDiscountPct: number | null): number | null {
  if (custom !== null) return custom;
  return tierPrice(catalogPrice, tierDiscountPct) ?? catalogPrice;
}

/** Add-on charge: percent surcharges apply to the base fee, flat ones add their amount. */
export function surchargeAmount(baseFee: number, s: { amount: number | null; data?: Record<string, any> }): number {
  const v = Number(s.amount || 0);
  if (s.data?.charge_type === "Percent of case fee") return Math.round(baseFee * v) / 100;
  return v;
}

/** Store sections for the Material Store page. */
export const STORE_SECTIONS = ["Milling Discs", "3D Resins", "Implant Hardware", "Other Consumables"] as const;
export type StoreSection = (typeof STORE_SECTIONS)[number];
export function storeSection(category?: string | null): StoreSection {
  const c = (category || "").toLowerCase();
  if (/disc|pmma|wax|disilicate|block|puck/.test(c)) return "Milling Discs";
  if (/resin/.test(c)) return "3D Resins";
  if (/implant/.test(c)) return "Implant Hardware";
  return "Other Consumables";
}

export type StoreFilter = "all" | "usable" | "low" | "expiring" | "quarantine";
/** Reorder pills: low = at/below minimum; expiring = within 30 days; quarantine = recalled or expired. */
export function filterStock(records: CatalogRecord[], f: StoreFilter, today: string): CatalogRecord[] {
  if (f === "all") return records;
  if (f === "expiring") { const ids = new Set(expiringSoon(records, today)); return records.filter((r) => ids.has(r)); }
  return records.filter((r) => {
    const s = stockState(r, today);
    if (f === "usable") return s === "in stock" || s === "low";
    if (f === "low") return s === "low";
    return s === "recalled" || s === "expired";
  });
}
