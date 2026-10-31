// Fills consent templates with clinical data. Supports {{mustache}} tags and the
// legacy [BRACKET] placeholders used by the seeded templates.

export interface SmartTagData {
  patient_name?: string;
  procedure_name?: string;
  tooth_numbers?: string;
  clinician_name?: string;
  alternative_treatments?: string;
  total_cost?: string;
  clinic_name?: string;
  date?: string;
  number_of_implants?: string;
  healing_period?: string;
  reason?: string;
  signer_name?: string;
}

const BRACKET: Record<string, keyof SmartTagData> = {
  "PATIENT NAME": "patient_name",
  "TREATMENT DESCRIPTION": "procedure_name",
  "PROCEDURE": "procedure_name",
  "TOOTH NUMBER": "tooth_numbers",
  "CLINICIAN NAME": "clinician_name",
  "ALTERNATIVES": "alternative_treatments",
  "AMOUNT": "total_cost",
  "CLINIC NAME": "clinic_name",
  "DATE": "date",
  "NUMBER": "number_of_implants",
  "HEALING PERIOD": "healing_period",
  "REASON": "reason",
  "GUARDIAN NAME": "signer_name",
  "SIGNER NAME": "signer_name",
};

export const SMART_TAGS = [
  "patient_name", "procedure_name", "tooth_numbers", "clinician_name",
  "alternative_treatments", "total_cost", "clinic_name", "date",
  "number_of_implants", "healing_period", "reason",
] as const;

export const IMPLANT_HEALING_DEFAULT = "3 to 6 months (osseointegration period)";

/** Clinical defaults derived from the selected plan item: implant count and healing period. */
export function clinicalDefaults(procedure?: string | null, teeth?: string | null): Partial<SmartTagData> {
  if (!/implant/i.test(procedure || "")) return {};
  const count = (teeth || "").split(/[,\s]+/).filter(Boolean).length;
  return { number_of_implants: String(count || 1), healing_period: IMPLANT_HEALING_DEFAULT };
}

/** Replaces known tags with values; unknown or empty tags are left visible for manual completion. */
export function fillSmartTags(text: string, data: SmartTagData): string {
  return (text || "")
    .replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, k) => (data as any)[k.toLowerCase()] || m)
    .replace(/\[([A-Z ]+)\]/g, (m, k) => {
      const key = BRACKET[k.trim()];
      return (key && data[key]) || m;
    });
}

/** Lists every placeholder still left in a document ({{tag}} or [TAG]), unique, in order. */
export function findUnresolvedTags(text: string): string[] {
  const found = (text || "").match(/\{\{\s*[a-z_]+\s*\}\}|\[[A-Z][A-Z0-9 /:,-]*\]/gi) || [];
  return [...new Set(found.filter((t) => t.startsWith("{{") || t === t.toUpperCase()))];
}

/** Human label for a placeholder, e.g. "[HEALING PERIOD]" → "Healing period". */
export function tagLabel(tag: string): string {
  const s = tag.replace(/^\{\{\s*|\s*\}\}$|^\[|\]$/g, "").replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Replaces every occurrence of one placeholder with a value. */
export function fillTag(text: string, tag: string, value: string): string {
  return value ? (text || "").split(tag).join(value) : text;
}

// Procedures that require a signed consent before they can be completed.
const INVASIVE: { category: string; re: RegExp }[] = [
  { category: "extraction", re: /extract|surgical|wisdom|third molar/i },
  { category: "root canal", re: /root canal|endodon|rct|pulp/i },
  { category: "implant", re: /implant|bone graft|sinus lift/i },
  { category: "crown", re: /crown|bridge|veneer|onlay|inlay/i },
  { category: "orthodontic", re: /ortho|brace|aligner/i },
];

export function consentCategory(description?: string | null): string | null {
  const hit = INVASIVE.find((c) => c.re.test(description || ""));
  return hit ? hit.category : null;
}

/** True when a signed consent covers this procedure category (and tooth, when the form names teeth). */
export function hasSignedConsent(item: { description?: string; tooth_number?: string | null }, forms: any[]): boolean {
  const cat = consentCategory(item.description);
  if (!cat) return true;
  const catRe = INVASIVE.find((c) => c.category === cat)!.re;
  return forms.some((f) => {
    if (f.status !== "signed") return false;
    const text = `${f.title || ""} ${f.content || ""}`;
    if (!catRe.test(text)) return false;
    if (!item.tooth_number) return true;
    return new RegExp(`(^|\\D)${item.tooth_number}(\\D|$)`).test(f.content || "");
  });
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Removes the old typed "Signature: ____" block from templates imported before digital signing. */
export function stripLegacySignature(text: string): string {
  return (text || "").replace(/\n*Patient \/ Guardian name:[\s\S]*?Witness \(if applicable\):\s*_+\s*$/m, "").trimEnd();
}
