export type VisitNotes = { subjective: string; objective: string; assessment: string; plan: string };
const key = (id?: string | null) => `visit-notes:${id}`;

export function readVisitNotesDraft(patientId?: string | null): Partial<VisitNotes> {
  if (!patientId || typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(key(patientId)) || "{}"); } catch { return {}; }
}
export function writeVisitNotesDraft(patientId: string, notes: VisitNotes) {
  if (typeof window === "undefined") return;
  if (Object.values(notes).some((v) => v.trim())) localStorage.setItem(key(patientId), JSON.stringify(notes));
  else localStorage.removeItem(key(patientId));
}
export function clearVisitNotesDraft(patientId?: string | null) {
  if (patientId && typeof window !== "undefined") localStorage.removeItem(key(patientId));
}
