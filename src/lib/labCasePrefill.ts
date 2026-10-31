// Pure helpers for pre-filling a lab case order from the patient's record.

export interface DentistLite { id: string; user_id?: string | null }
export interface VisitLite { dentistId?: string | null; notes?: string; date?: string }

/**
 * Who should be the clinician on a new lab case:
 * 1. the signed-in user, if they are a dentist;
 * 2. otherwise the dentist from the patient's most recent completed visit
 *    (visits are ordered newest first);
 * 3. otherwise blank.
 */
export function pickDefaultDentist(dentists: DentistLite[], userId: string | undefined, visits: VisitLite[] = []): string {
  const me = userId ? dentists.find((d) => d.user_id && d.user_id === userId) : undefined;
  if (me) return me.id;
  const ids = new Set(dentists.map((d) => d.id));
  const recent = visits.find((v) => v.dentistId && ids.has(v.dentistId));
  return recent?.dentistId || "";
}

/** Most recent non-empty clinical note, trimmed to keep the lab ticket short. */
export function latestClinicalNote(visits: VisitLite[] = [], max = 280): string {
  const note = visits.find((v) => v.notes && v.notes.trim())?.notes?.trim() || "";
  return note.length > max ? `${note.slice(0, max - 1)}…` : note;
}

/** Status filter used by the patient's Lab Cases tab. */
export const isLabCaseActive = (c: { status: string }) => c.status !== "delivered";
