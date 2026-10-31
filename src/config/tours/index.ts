import type { PageTour, TourMap } from "@/components/dashboard/tour/types";
import { clinicalTours } from "./clinical";
import { clinicalRecordsTours } from "./records";
import { financeTours } from "./finance";
import { operationsTours } from "./operations";

/**
 * All page walk-throughs, keyed by the route path after /clinic/:slug/.
 * Marketing pages are intentionally excluded for now.
 */
export const pageTours: TourMap = {
  ...clinicalTours,
  ...clinicalRecordsTours,
  ...financeTours,
  ...operationsTours,
};

/** Turn a full pathname into a tour key, e.g. /clinic/acme/patients/123 -> patients/detail */
export function getTourKey(pathname: string): string | null {
  const match = pathname.match(/^\/clinic\/[^/]+\/(.*)$/);
  if (!match) return null;
  const rest = match[1].replace(/\/$/, "");
  if (!rest) return null;
  const segments = rest.split("/");
  if (segments[0] === "patients" && segments.length > 1) return "patients/detail";
  return segments.join("/");
}

export function getTourForPath(pathname: string): PageTour | null {
  const key = getTourKey(pathname);
  if (!key) return null;
  return pageTours[key] ?? null;
}
