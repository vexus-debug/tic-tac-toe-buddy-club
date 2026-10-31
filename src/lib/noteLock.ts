// Clinical notes lock when signed, or automatically 24 hours after creation (mirrors the database rule).
export const NOTE_LOCK_HOURS = 24;

export function isNoteLocked(note: { signed_at?: string | null; created_at: string }, now = Date.now()): boolean {
  if (note.signed_at) return true;
  return now - new Date(note.created_at).getTime() >= NOTE_LOCK_HOURS * 3600_000;
}

export function noteUnlocksIn(note: { created_at: string }, now = Date.now()): number {
  const left = NOTE_LOCK_HOURS * 3600_000 - (now - new Date(note.created_at).getTime());
  return Math.max(0, Math.ceil(left / 3600_000));
}
