// Multi-item lab invoicing: line items with units, add-ons, rush surcharges and CDT codes,
// plus batch consolidation of several cases into one client invoice.
// Lines are stored in lab_records (kind "invoice-lines", data.invoice_id) so lab_invoices stays unchanged.

export interface AddOn { name: string; price: number }

export interface LineItem {
  case_id?: string | null;
  case_number?: string;
  patient_name?: string;
  description: string;
  cdt_code?: string;
  teeth?: string;
  units: number;
  unit_price: number;
  add_ons: AddOn[];
  rush_pct?: number;   // % surcharge on base
  rush_flat?: number;  // flat surcharge
  discount?: number;   // flat discount on this line
}

export const ADD_ON_PRESETS: AddOn[] = [
  { name: "Custom shade", price: 35 },
  { name: "Diagnostic wax-up", price: 45 },
  { name: "Ti-base screw", price: 65 },
];

export const DEFAULT_RUSH_PCT = 25;

const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

export function lineBase(l: LineItem) { return r2(Math.max(0, num(l.units)) * Math.max(0, num(l.unit_price))); }
export function lineAddOns(l: LineItem) { return r2((l.add_ons || []).reduce((s, a) => s + Math.max(0, num(a.price)), 0)); }
export function lineRush(l: LineItem) { return r2(lineBase(l) * Math.max(0, num(l.rush_pct)) / 100 + Math.max(0, num(l.rush_flat))); }

/** units × unit price + add-ons + rush − discount, never below zero. */
export function lineTotal(l: LineItem) {
  return r2(Math.max(0, lineBase(l) + lineAddOns(l) + lineRush(l) - Math.max(0, num(l.discount))));
}

export interface InvoiceTotals { subtotal: number; discount: number; taxable: number; tax: number; total: number }

/** Subtotal is the sum of line totals; invoice discount and tax apply on top. */
export function invoiceTotals(lines: LineItem[], invoiceDiscount = 0, taxRatePct = 0): InvoiceTotals {
  const subtotal = r2(lines.reduce((s, l) => s + lineTotal(l), 0));
  const discount = r2(Math.min(subtotal, Math.max(0, num(invoiceDiscount))));
  const taxable = r2(subtotal - discount);
  const tax = r2(taxable * Math.max(0, num(taxRatePct)) / 100);
  return { subtotal, discount, taxable, tax, total: r2(taxable + tax) };
}

/** Build a starting line from a lab case: fee is treated as the per-case base price. */
export function caseToLine(c: any, rushPct = DEFAULT_RUSH_PCT): LineItem {
  const units = Math.max(1, Math.round(num(c?.units) || 1));
  const fee = num(c?.lab_fee);
  return {
    case_id: c?.id ?? null,
    case_number: c?.case_number || "",
    patient_name: c?.external_patient_name || c?.patient_name || "",
    description: [c?.work_type || "Lab work", c?.material].filter(Boolean).join(" — "),
    cdt_code: c?.cdt_code || "",
    teeth: c?.tooth_numbers || c?.teeth || "",
    units,
    unit_price: r2(fee / units),
    add_ons: [],
    rush_pct: c?.is_urgent ? rushPct : 0,
    discount: Math.max(0, num(c?.discount)),
  };
}

/** Group uninvoiced cases by client, optionally within a delivery date range (inclusive, yyyy-mm-dd). */
export function groupForBatch<T extends { id: string }>(
  cases: T[], clientOf: (c: T) => string, dateOf: (c: T) => string | null | undefined = () => null,
  from?: string, to?: string,
): { client: string; cases: T[] }[] {
  const map = new Map<string, { client: string; cases: T[] }>();
  for (const c of cases) {
    const d = (dateOf(c) || "").slice(0, 10);
    if (from && d && d < from) continue;
    if (to && d && d > to) continue;
    const name = (clientOf(c) || "Unassigned").trim();
    const key = name.toLowerCase();
    if (!map.has(key)) map.set(key, { client: name, cases: [] });
    map.get(key)!.cases.push(c);
  }
  return [...map.values()].sort((a, b) => b.cases.length - a.cases.length);
}

/** Lifecycle status derived from amounts. Void stays void. */
export function invoiceStatus(total: number, paid: number, current?: string) {
  if (current === "void") return "void";
  if (paid <= 0) return "unpaid";
  if (paid + 0.005 >= total) return "paid";
  return "partial";
}

export function validateLines(lines: LineItem[]): string[] {
  const errs: string[] = [];
  if (!lines.length) errs.push("Add at least one line.");
  lines.forEach((l, i) => {
    if (!l.description?.trim()) errs.push(`Line ${i + 1}: description is required.`);
    if (num(l.units) <= 0) errs.push(`Line ${i + 1}: units must be at least 1.`);
    if (num(l.unit_price) < 0) errs.push(`Line ${i + 1}: price cannot be negative.`);
  });
  return errs;
}
