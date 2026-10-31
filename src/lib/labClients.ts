// Client master for the dental lab: practice profiles, doctor roster, credit control.
// Stored in lab_records (kind "client-profiles"): title = practice name, amount = credit limit,
// status = "active" | "hold", data = ClientProfileData. Legacy name matching is kept as fallback.

export type PaymentTerms = "cod" | "net_15" | "net_30" | "net_45" | "net_60";
export type PriceTier = "standard" | "tier_a" | "tier_b" | "tier_c";
export type ContactPref = "sms" | "email" | "phone";

export const TERMS: { value: PaymentTerms; label: string; days: number }[] = [
  { value: "cod", label: "COD", days: 0 },
  { value: "net_15", label: "Net 15", days: 15 },
  { value: "net_30", label: "Net 30", days: 30 },
  { value: "net_45", label: "Net 45", days: 45 },
  { value: "net_60", label: "Net 60", days: 60 },
];
export const TIERS: { value: PriceTier; label: string }[] = [
  { value: "standard", label: "Standard" }, { value: "tier_a", label: "Tier A" },
  { value: "tier_b", label: "Tier B" }, { value: "tier_c", label: "Tier C" },
];

export interface Doctor {
  id: string; name: string; license?: string; email?: string; phone?: string;
  shade_guide?: string; margin_pref?: string; contact_pref?: ContactPref; special_instructions?: string;
}

export interface ClientProfileData {
  client_id: string;
  contact_name?: string; email?: string; phone?: string;
  address?: string; delivery_address?: string; tax_id?: string;
  terms: PaymentTerms; tier: PriceTier; courier_notes?: string;
  doctors: Doctor[];
}

export interface ClientProfileInput extends Partial<ClientProfileData> {
  name: string; credit_limit?: number; on_hold?: boolean;
}

export const termDays = (t?: string) => TERMS.find((x) => x.value === t)?.days ?? 30;
export const termLabel = (t?: string) => TERMS.find((x) => x.value === t)?.label ?? "Net 30";
export const tierLabel = (t?: string) => TIERS.find((x) => x.value === t)?.label ?? "Standard";

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a list of human-readable problems; empty means valid. */
export function validateClient(input: ClientProfileInput): string[] {
  const errs: string[] = [];
  if (!input.name?.trim()) errs.push("Practice name is required.");
  if (input.email && !EMAIL.test(input.email.trim())) errs.push("Billing email looks invalid.");
  if (input.credit_limit != null && (isNaN(input.credit_limit) || input.credit_limit < 0)) errs.push("Credit limit cannot be negative.");
  if (input.terms && !TERMS.some((t) => t.value === input.terms)) errs.push("Unknown payment terms.");
  (input.doctors || []).forEach((d, i) => { if (!d.name?.trim()) errs.push(`Doctor ${i + 1} needs a name.`); });
  return errs;
}

/** Normalise form input into a lab_records payload, keeping an existing client UUID. */
export function toProfileRecord(input: ClientProfileInput, existingId?: string) {
  const data: ClientProfileData = {
    client_id: input.client_id || existingId || newId(),
    contact_name: input.contact_name?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    phone: input.phone?.trim() || undefined,
    address: input.address?.trim() || undefined,
    delivery_address: input.delivery_address?.trim() || undefined,
    tax_id: input.tax_id?.trim() || undefined,
    terms: input.terms || "net_30",
    tier: input.tier || "standard",
    courier_notes: input.courier_notes?.trim() || undefined,
    doctors: (input.doctors || []).filter((d) => d.name?.trim()).map((d) => ({ ...d, id: d.id || newId(), name: d.name.trim() })),
  };
  return {
    title: input.name.trim(),
    status: input.on_hold ? "hold" : "active",
    amount: Math.max(0, Number(input.credit_limit || 0)),
    data,
  };
}

export interface CreditState { limit: number; used: number; available: number; utilization: number; overLimit: boolean; }

/** Credit utilisation; a limit of 0 means "no limit set". */
export function creditState(limit: number, balance: number): CreditState {
  const used = Math.max(0, balance);
  if (!limit) return { limit: 0, used, available: Infinity, utilization: 0, overLimit: false };
  return { limit, used, available: Math.max(0, limit - used), utilization: Math.min(1, used / limit), overLimit: used > limit };
}

export type AgingRisk = "current" | "overdue" | "high_risk";

/** Risk from the age (days past due) of the oldest unpaid invoice. */
export function agingRisk(oldestDaysPastDue: number | null, balance: number): AgingRisk {
  if (balance <= 0 || oldestDaysPastDue == null || oldestDaysPastDue <= 0) return "current";
  return oldestDaysPastDue > 60 ? "high_risk" : "overdue";
}

/** Whether new work should be held: manual hold, or over limit. */
export const shouldHold = (manualHold: boolean, credit: CreditState) => manualHold || credit.overLimit;

export interface LedgerEntry { date: string; kind: "invoice" | "payment" | "credit"; ref: string; debit: number; credit: number; balance: number; }

/** Chronological running ledger: invoices debit, payments and credit notes credit. */
export function buildLedger(rows: { date: string; kind: LedgerEntry["kind"]; ref: string; amount: number }[]): LedgerEntry[] {
  let bal = 0;
  return [...rows].sort((a, b) => a.date.localeCompare(b.date)).map((r) => {
    const debit = r.kind === "invoice" ? Number(r.amount || 0) : 0;
    const credit = r.kind === "invoice" ? 0 : Number(r.amount || 0);
    bal = Math.round((bal + debit - credit) * 100) / 100;
    return { date: r.date, kind: r.kind, ref: r.ref, debit, credit, balance: bal };
  });
}
