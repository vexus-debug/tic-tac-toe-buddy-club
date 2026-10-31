// Pure helpers for USB/HID barcode wedge scanners and bench timers.

/** Scanners "type" very fast and end with Enter. Humans type slower. */
export function createScanBuffer(opts: { maxGapMs?: number; minLength?: number } = {}) {
  const maxGap = opts.maxGapMs ?? 50;
  const minLen = opts.minLength ?? 4;
  let buf = "";
  let last = 0;
  return {
    /** Feed one key. Returns the scanned code when a fast burst ends with Enter. */
    push(key: string, at: number): string | null {
      if (buf && at - last > maxGap) buf = "";
      last = at;
      if (key === "Enter") {
        const code = buf.trim();
        buf = "";
        return code.length >= minLen ? code : null;
      }
      if (key.length === 1) buf += key;
      return null;
    },
    reset() { buf = ""; },
  };
}

/** Match a scanned code to a case number (case-insensitive, ignores spaces). */
export function matchScannedCase<T extends { case_number?: string | null }>(cases: T[], code: string): T | null {
  const norm = (s: string) => s.replace(/\s+/g, "").toUpperCase();
  const k = norm(code);
  return cases.find((c) => c.case_number && norm(c.case_number) === k) ?? null;
}

export interface TimerState { startedAt: number | null; accumulatedMs: number }

/** A start time of 0 is a valid timestamp; only null means stopped. */
export const timerRunning = (t: TimerState) => t.startedAt !== null && t.startedAt !== undefined;
export const timerElapsedMs = (t: TimerState, now: number) =>
  t.accumulatedMs + (timerRunning(t) ? Math.max(0, now - (t.startedAt as number)) : 0);
export const timerStart = (t: TimerState, now: number): TimerState => (timerRunning(t) ? t : { ...t, startedAt: now });
export const timerPause = (t: TimerState, now: number): TimerState =>
  timerRunning(t) ? { startedAt: null, accumulatedMs: timerElapsedMs(t, now) } : t;

export function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export type ToothRole = "abutment" | "pontic";
/** Display "#14 (A), #15 (P)" style labels; plain teeth stay as they were. */
export function teethLabel(teeth: string[], roles: Record<string, ToothRole> = {}) {
  return teeth.map((t) => roles[t] === "pontic" ? `${t} (P)` : roles[t] === "abutment" ? `${t} (A)` : t);
}
