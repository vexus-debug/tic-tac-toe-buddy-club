import { useSyncExternalStore } from "react";

/**
 * The patient currently "in the chair". Persisted per browser tab so that
 * plain sidebar navigation keeps the visit context alive across clinical pages.
 */
export interface ActiveVisit {
  patientId: string;
  appointmentId?: string | null;
  startedAt: string;
}

const KEY = "clinexus.activeVisit";
const listeners = new Set<() => void>();
let cache: ActiveVisit | null | undefined;

function read(): ActiveVisit | null {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ActiveVisit) : null;
  } catch {
    cache = null;
  }
  return cache;
}

function emit() {
  listeners.forEach((l) => l());
}

export function setActiveVisit(v: { patientId: string; appointmentId?: string | null } | null) {
  const current = read();
  if (v && current?.patientId === v.patientId && (v.appointmentId === undefined || v.appointmentId === current.appointmentId)) return;
  cache = v
    ? {
        patientId: v.patientId,
        appointmentId: v.appointmentId ?? (current?.patientId === v.patientId ? current.appointmentId : null),
        startedAt: current?.patientId === v.patientId ? current.startedAt : new Date().toISOString(),
      }
    : null;
  try {
    if (cache) window.sessionStorage.setItem(KEY, JSON.stringify(cache));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  emit();
}

export function getActiveVisit() {
  return read();
}

export function useActiveVisit() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}

/** Pages where the visit bar follows the dentist and the patient stays preselected. */
export const VISIT_PAGES = [
  "consent-forms",
  "dental-charts",
  "treatments",
  "prescriptions",
  "lab-work",
  "estimates",
  "treatment-materials",
  "patients",
];
