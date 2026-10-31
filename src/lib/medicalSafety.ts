// Rule-based clinical safety checks (no AI): allergy ↔ drug conflicts and
// medical alerts parsed from the patient's record. Runs instantly, offline.

export const COMMON_ALLERGIES = [
  "Penicillin", "Sulfa", "Codeine", "NSAIDs", "Aspirin", "Latex", "Local anaesthetic", "Metronidazole", "Erythromycin",
] as const;

export const MEDICAL_ALERTS = [
  "Anticoagulants / bleeding disorder",
  "Bisphosphonates",
  "Heart condition / premedication",
  "Diabetes",
  "Hypertension",
  "Pregnant",
  "Asthma",
  "Epilepsy",
  "HIV / Hepatitis",
  "Peptic ulcer",
  "Renal impairment",
] as const;

// Allergy class → drug name fragments that belong to it (lowercase).
const ALLERGY_CLASSES: { match: RegExp; label: string; drugs: string[]; alternative: string }[] = [
  { match: /penicill|amoxic|augmentin/i, label: "Penicillin", drugs: ["penicillin", "amoxicillin", "amoxil", "augmentin", "ampicillin", "cloxacillin", "flucloxacillin", "co-amoxiclav", "amoxicillin-clavulanate"], alternative: "Azithromycin or Clindamycin" },
  { match: /sulfa|sulph/i, label: "Sulfa", drugs: ["sulfamethoxazole", "co-trimoxazole", "septrin", "bactrim", "sulfadiazine"], alternative: "a non-sulfonamide antibiotic" },
  { match: /codeine|opioid|opiate/i, label: "Codeine / opioids", drugs: ["codeine", "tramadol", "morphine", "dihydrocodeine", "pentazocine"], alternative: "Paracetamol" },
  { match: /nsaid|ibuprofen|diclofenac/i, label: "NSAIDs", drugs: ["ibuprofen", "diclofenac", "naproxen", "aspirin", "piroxicam", "ketoprofen", "mefenamic", "celecoxib"], alternative: "Paracetamol" },
  { match: /aspirin|salicyl/i, label: "Aspirin", drugs: ["aspirin", "acetylsalicylic"], alternative: "Paracetamol" },
  { match: /metronid|flagyl/i, label: "Metronidazole", drugs: ["metronidazole", "flagyl", "tinidazole"], alternative: "Amoxicillin (if not penicillin-allergic) or Clindamycin" },
  { match: /erythro|macrolide|azithro|clarithro/i, label: "Macrolides", drugs: ["erythromycin", "azithromycin", "clarithromycin"], alternative: "Clindamycin" },
  { match: /chlorhex/i, label: "Chlorhexidine", drugs: ["chlorhexidine"], alternative: "a saline rinse" },
];

const NSAIDS = ["ibuprofen", "diclofenac", "naproxen", "aspirin", "piroxicam", "ketoprofen", "mefenamic"];

/** Allergy tags offered on the intake form. */
export const INTAKE_ALLERGIES = ["Penicillin", "Sulfa", "Codeine", "NSAIDs", "Aspirin", "Latex", "Local anaesthetic"] as const;

/** What each medical alert means chairside (shown in the expanded banner). */
export const ALERT_GUIDANCE: Record<string, string> = {
  "Anticoagulants / bleeding disorder": "Bleeding risk — check INR before extractions, use local haemostatics, avoid NSAIDs.",
  "Bisphosphonates": "Risk of jaw osteonecrosis — avoid elective extractions or implants where possible.",
  "Heart condition / premedication": "May need antibiotic cover before invasive procedures; limit adrenaline.",
  "Diabetes": "Slower healing and infection risk — confirm they have eaten; watch for hypoglycaemia.",
  "Hypertension": "Check blood pressure before treatment; limit adrenaline in local anaesthetic.",
  "Pregnant": "Avoid elective X-rays and NSAIDs; prefer second trimester for treatment.",
  "Asthma": "Keep inhaler at hand; avoid NSAIDs.",
  "Epilepsy": "Confirm seizure control; keep appointments short and calm.",
  "HIV / Hepatitis": "Standard precautions; check bleeding and medication interactions.",
  "Peptic ulcer": "Avoid NSAIDs; prefer paracetamol.",
  "Renal impairment": "Avoid NSAIDs; adjust antibiotic doses.",
};

/** Add or remove a medical alert line in the free-text history. */
export function toggleAlertInHistory(history: string, alert: string): string {
  const has = detectMedicalAlerts(history).includes(alert);
  if (!has) return history.trim() ? `${history.trim()}\n${alert}` : alert;
  return history.split("\n").filter((l) => l.trim() !== alert).join("\n");
}

export function parseList(text?: string | null): string[] {
  if (!text) return [];
  return text.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
}

/** Medical alerts found in the free-text medical history. */
export function detectMedicalAlerts(history?: string | null): string[] {
  const h = (history || "").toLowerCase();
  if (!h) return [];
  const found: string[] = [];
  if (/warfarin|anticoag|apixaban|rivaroxaban|clopidogrel|bleeding|haemophilia|hemophilia|blood thinner/.test(h)) found.push("Anticoagulants / bleeding disorder");
  if (/bisphosph|alendron|zoledron|ibandron/.test(h)) found.push("Bisphosphonates");
  if (/premedicat|heart valve|endocarditis|heart condition|cardiac|pacemaker/.test(h)) found.push("Heart condition / premedication");
  if (/diabet/.test(h)) found.push("Diabetes");
  if (/hypertens|high blood pressure/.test(h)) found.push("Hypertension");
  if (/pregnan/.test(h)) found.push("Pregnant");
  if (/asthma/.test(h)) found.push("Asthma");
  if (/epilep|seizure/.test(h)) found.push("Epilepsy");
  if (/\bhiv\b|hepatitis|hbv|hcv/.test(h)) found.push("HIV / Hepatitis");
  if (/peptic|stomach ulcer|gastric ulcer|duodenal ulcer|\bpud\b/.test(h)) found.push("Peptic ulcer");
  if (/renal|kidney|ckd|dialysis/.test(h)) found.push("Renal impairment");
  return found;
}

export interface RxConflict { medication: string; reason: string; alternative?: string; severity: "allergy" | "caution" }

/** Hard conflicts between prescribed medications and the patient's allergies / alerts. */
export function checkPrescriptionConflicts(medications: string[], allergiesText?: string | null, history?: string | null): RxConflict[] {
  const allergies = parseList(allergiesText);
  const alerts = detectMedicalAlerts(history);
  const out: RxConflict[] = [];
  for (const raw of medications) {
    const med = raw.toLowerCase().trim();
    if (!med) continue;
    for (const a of allergies) {
      const cls = ALLERGY_CLASSES.find((c) => c.match.test(a));
      const hit = cls ? cls.drugs.some((d) => med.includes(d)) : med.includes(a.toLowerCase());
      if (hit) out.push({ medication: raw, reason: `Patient is allergic to ${cls?.label ?? a}`, alternative: cls?.alternative, severity: "allergy" });
    }
    const isNsaid = NSAIDS.some((d) => med.includes(d));
    if (isNsaid && alerts.includes("Anticoagulants / bleeding disorder")) out.push({ medication: raw, reason: "NSAID with anticoagulants / bleeding disorder raises bleeding risk", alternative: "Paracetamol", severity: "caution" });
    if (isNsaid && alerts.includes("Pregnant")) out.push({ medication: raw, reason: "NSAIDs are generally avoided in pregnancy", alternative: "Paracetamol", severity: "caution" });
    if (isNsaid && alerts.includes("Asthma")) out.push({ medication: raw, reason: "NSAIDs can trigger bronchospasm in asthma", alternative: "Paracetamol", severity: "caution" });
    if (isNsaid && alerts.includes("Peptic ulcer")) out.push({ medication: raw, reason: "NSAIDs can cause bleeding in peptic ulcer disease", alternative: "Paracetamol", severity: "caution" });
    if (isNsaid && alerts.includes("Renal impairment")) out.push({ medication: raw, reason: "NSAIDs can worsen kidney function", alternative: "Paracetamol", severity: "caution" });
    if (/epinephrine|adrenaline|lidocaine with|lignocaine with|articaine/.test(med) && alerts.includes("Hypertension")) out.push({ medication: raw, reason: "Adrenaline in local anaesthetic — check BP; avoid in uncontrolled hypertension", alternative: "Plain mepivacaine 3% or limit cartridges", severity: "caution" });
    if (/metronidazole/.test(med) && /warfarin/.test((history || "").toLowerCase())) out.push({ medication: raw, reason: "Metronidazole strongly increases warfarin effect", severity: "caution" });
  }
  return out;
}
