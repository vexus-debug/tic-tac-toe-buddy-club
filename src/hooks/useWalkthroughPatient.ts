import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { usePatientContext } from "@/hooks/usePatientContext";

/**
 * Phantom patient used by the dentist "Walk through a visit" tour.
 * The dental chart and procedure widgets only render once a patient is
 * selected, so the tour needs a real patient record to spotlight. This hook
 * reuses the clinic's existing demo patient or creates one, selects it while
 * the tour is open, and clears the selection when the tour ends.
 */
export const WALKTHROUGH_PATIENT = {
  first_name: "Walkthrough",
  last_name: "Demo Patient",
};

export function useWalkthroughPatient(active: boolean) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  const { patientId, setPatientId } = usePatientContext();
  const queryClient = useQueryClient();
  const busyRef = useRef(false);
  const selectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active || !orgId) return;
    let cancelled = false;

    (async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const { data: existing } = await (supabase as any)
          .from("patients")
          .select("id")
          .eq("org_id", orgId)
          .eq("first_name", WALKTHROUGH_PATIENT.first_name)
          .eq("last_name", WALKTHROUGH_PATIENT.last_name)
          .limit(1)
          .maybeSingle();

        let id: string | undefined = existing?.id;
        if (!id) {
          const { data, error } = await (supabase as any)
            .from("patients")
            .insert({
              org_id: orgId,
              ...WALKTHROUGH_PATIENT,
              gender: "other",
              status: "active",
              phone: "",
              email: "",
              address: "",
              emergency_contact_name: "",
              emergency_contact_phone: "",
              medical_history:
                "Demo patient created automatically for the visit walkthrough. Safe to delete.",
              referral_source: "walkthrough",
            })
            .select("id")
            .single();
          if (error) throw error;
          id = data.id;
          queryClient.invalidateQueries({ queryKey: ["patients"] });
        }
        if (!cancelled && id) {
          selectedRef.current = id;
          setPatientId(id);
        }
      } finally {
        busyRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, orgId]);

  // When the tour closes, release the demo patient so the dentist isn't left
  // with a phantom patient locked in the chair.
  useEffect(() => {
    if (active) return;
    if (selectedRef.current && patientId === selectedRef.current) {
      setPatientId("");
    }
    selectedRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
