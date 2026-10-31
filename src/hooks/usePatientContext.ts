import { useCallback, useEffect } from "react";
import { setActiveVisit, useActiveVisit } from "@/hooks/useActiveVisit";
import { useParams, useSearchParams } from "react-router-dom";

/**
 * Shared patient context carried in the URL as `?patientId=`.
 * Lets every clinical page lock onto the same patient without re-selecting.
 */
export function usePatientContext() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = useActiveVisit();
  const urlPatientId = searchParams.get("patientId") || "";
  // URL wins; otherwise fall back to the patient in the chair so context never drops.
  const patientId = urlPatientId || active?.patientId || "";

  useEffect(() => {
    if (urlPatientId) setActiveVisit({ patientId: urlPatientId });
  }, [urlPatientId]);

  const setPatientId = useCallback(
    (id: string) => {
      setActiveVisit(id ? { patientId: id } : null);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set("patientId", id);
          else next.delete("patientId");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /** Read and clear a one-shot flag such as `?new=1`. */
  const consumeFlag = useCallback(
    (key: string) => {
      if (searchParams.get(key) !== "1") return false;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(key);
          return next;
        },
        { replace: true },
      );
      return true;
    },
    [searchParams, setSearchParams],
  );

  return { patientId, setPatientId, searchParams, consumeFlag };
}

/** Builds clinic-scoped links that keep the patient locked in the URL. */
export function useClinicLinks() {
  const { slug } = useParams();
  const base = `/clinic/${slug}`;
  return useCallback(
    (page: string, patientId?: string | null, extra?: Record<string, string>) => {
      const qs = new URLSearchParams();
      if (patientId) qs.set("patientId", patientId);
      Object.entries(extra || {}).forEach(([k, v]) => qs.set(k, v));
      const q = qs.toString();
      if (page === "patient" && patientId) return `${base}/patients/${patientId}`;
      return `${base}/${page}${q ? `?${q}` : ""}`;
    },
    [base],
  );
}
