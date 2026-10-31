import { useOrg } from "@/hooks/useOrg";
import { getClinicTerms, type ClinicTerms } from "@/config/clinicTerminology";

/** Wording for the current organisation's clinic type. */
export function useClinicTerms(): ClinicTerms {
  const { currentOrg } = useOrg();
  return getClinicTerms(currentOrg?.clinic_type);
}
