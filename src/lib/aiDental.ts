import { supabase } from "@/integrations/supabase/client";

/** One-shot call to the clinic AI assistant; returns plain text. */
export async function askClinicAi(orgId: string, prompt: string, page: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-copilot", {
    body: { messages: [{ role: "user", content: prompt }], orgId, context: { page } },
  });
  if (error) {
    const s = (error as any)?.context?.status;
    if (s === 429) throw new Error("AI is busy — please wait a moment and try again.");
    if (s === 402) throw new Error("AI credits are currently unavailable.");
    throw error;
  }
  const reply = String(data?.reply ?? "").trim();
  if (!reply) throw new Error("AI returned nothing.");
  return reply;
}

export const consentRiskPrompt = (patientId: string, title: string, content: string) =>
  `Tailor this dental consent form for patient id ${patientId}. Use get_patient_history (read-only) to check allergies, medical conditions and medications. Never invent facts.
Procedure: ${title}
Current form text:
${content}

Reply with ONLY a short section to append, starting with "PATIENT-SPECIFIC RISKS:" followed by bullet points ("- ") covering procedure-specific risks (e.g. nerve proximity for lower molars, dry socket, sinus involvement) and risks raised by this patient's medical history. Plain text, no markdown headings.`;

export const postOpPrompt = (patientId: string, procedures: string[], meds: string[]) =>
  `Write post-operative care instructions for dental patient id ${patientId}. Use get_patient_history (read-only) for allergies/conditions. Never invent facts.
Procedures done today: ${procedures.join("; ") || "none listed"}
Medications prescribed today: ${meds.join("; ") || "none"}

Reply in plain text, simple patient-friendly language, short bullet points ("- ") grouped under: "Today", "Next few days", "Medications", "Call the clinic if". No markdown headings or bold.`;

const READ_ONLY = "Use only read-only lookup tools. Do NOT create, update or delete anything. Never invent facts.";

export const soapNotePrompt = (patientId: string, treatmentName: string, chartedFindings: string[], proceduresDone: string[]) =>
  `Draft a clinical SOAP note for today's dental visit, patient id ${patientId}. ${READ_ONLY} You may use get_patient_history and get_dental_chart.
Booked treatment: ${treatmentName || "not specified"}
Charted findings: ${chartedFindings.join("; ") || "none provided"}
Procedures done today: ${proceduresDone.join("; ") || "none listed"}

Reply in plain text with exactly four lines, each starting with its label:
S: <subjective / chief complaint>
O: <objective exam findings>
A: <assessment / diagnosis>
P: <plan, treatment done, next steps>
Keep each concise and clinical. Where information is missing, write "[clinician to confirm]".`;

export function parseSoap(text: string) {
  const out = { subjective: "", objective: "", assessment: "", plan: "" };
  const map: Record<string, keyof typeof out> = { S: "subjective", O: "objective", A: "assessment", P: "plan" };
  let cur: keyof typeof out | null = null;
  for (const raw of text.split("\n")) {
    const m = raw.match(/^\s*\**\s*([SOAP])\s*[:\-–]\s*(.*)$/i);
    if (m) { cur = map[m[1].toUpperCase()]; out[cur] = m[2].trim(); }
    else if (cur && raw.trim()) out[cur] += `\n${raw.trim()}`;
  }
  return out;
}

export const rxSafetyPrompt = (patientId: string, meds: string[]) =>
  `Prescription safety check for dental patient id ${patientId}. ${READ_ONLY} Use get_patient_history to read allergies, medical conditions and current medications.
Medications being prescribed now:
${meds.map((m) => `- ${m}`).join("\n")}

Check for: drug-drug interactions (within this list and with current meds), allergy conflicts (incl. cross-reactivity e.g. penicillin/cephalosporin), and contraindications from medical conditions, pregnancy or age.
If there are no meaningful concerns reply with exactly: NO ISSUES
Otherwise reply with one line per concern, format: "- HIGH|MODERATE|LOW: <concern> — <suggested alternative or action>". Plain text only.`;

export const unbilledAuditPrompt = (patientId: string, billed: string[], catalog: string[]) =>
  `Missing-billables audit for today's dental visit, patient id ${patientId}. ${READ_ONLY} Use get_patient_history / get_dental_chart to see today's charted work and notes.
Already on the bill: ${billed.join("; ") || "nothing"}
Clinic treatment catalog (only suggest names from this list): ${catalog.join("; ")}

Be conservative: only suggest items with clear evidence they were performed TODAY but are not billed. Do not suggest duplicates.
If nothing is missing reply exactly: NOTHING MISSING
Otherwise one line per item: "- <exact catalog name> | <evidence from today>". Plain text.`;

export const fastFillPrompt = (slot: { date: string; time: string; treatment?: string; dentist?: string }) =>
  `An appointment slot just opened: ${slot.date} at ${slot.time}${slot.treatment ? `, originally for ${slot.treatment}` : ""}${slot.dentist ? ` with ${slot.dentist}` : ""}. ${READ_ONLY}
Use get_treatment_plans, get_overdue_patients and get_appointments_by_date to find the best patients to offer this slot to: patients with pending planned treatment of a similar type and duration, urgent/overdue cases, and the same provider preferred. Exclude patients already booked that day.
Reply with up to 5 lines ranked best first, format: "- <patient full name> | <phone if known> | <why they fit>". If none fit, reply exactly: NO MATCHES`;

/** Splits "- a | b" style AI lines into trimmed parts. */
export const parseAiLines = (text: string) =>
  text.split("\n").map((l) => l.replace(/^\s*[-*•\d.]+\s*/, "").trim()).filter(Boolean).map((l) => l.split("|").map((p) => p.trim()));
