import { useSyncExternalStore } from "react";
import { GuidedTour } from "./GuidedTour";
import { dentistVisitTour } from "@/config/tours/dentist-visit";
import { useWalkthroughPatient } from "@/hooks/useWalkthroughPatient";

/**
 * The visit walkthrough moves across pages, so it must live in the persistent
 * dashboard layout — not inside a page that unmounts when the tour navigates.
 */
let open = false;
const listeners = new Set<() => void>();
const set = (v: boolean) => { open = v; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export const startDentistVisitTour = () => set(true);

export function DentistVisitTourHost() {
  const isOpen = useSyncExternalStore(subscribe, () => open, () => false);
  useWalkthroughPatient(isOpen);
  return <GuidedTour tour={dentistVisitTour} open={isOpen} onClose={() => set(false)} />;
}
