import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface PrescriptionRow {
  id: string;
  patient_id: string;
  dentist_id: string;
  prescription_date: string;
  diagnosis: string;
  notes: string;
  created_at: string;
  patients: { first_name: string; last_name: string } | null;
  staff: { full_name: string } | null;
  prescription_medications: { id: string; name: string; medication_name: string; dosage: string; frequency: string; duration: string }[];
}

export function usePrescriptions() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["prescriptions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("prescriptions")
        .select("*, patients(first_name, last_name), staff(full_name), prescription_medications(*)")
        .eq("org_id", orgId)
        .order("prescription_date", { ascending: false });
      if (error) throw error;
      return (data || []) as PrescriptionRow[];
    },
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      patient_id: string;
      dentist_id: string;
      medications: { name: string; dosage: string; frequency: string; duration: string; instructions?: string }[];
      diagnosis?: string;
      notes?: string;
    }) => {
      const { data: rx, error: rxErr } = await (supabase as any)
        .from("prescriptions")
        .insert({ patient_id: input.patient_id, dentist_id: input.dentist_id, org_id: currentOrg?.org_id, diagnosis: input.diagnosis || null, notes: input.notes || null })
        .select()
        .single();
      if (rxErr) throw rxErr;

      const meds = input.medications.map((m) => ({ medication_name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration, instructions: m.instructions ?? null, prescription_id: rx.id }));
      const { error: medErr } = await (supabase as any).from("prescription_medications").insert(meds);
      if (medErr) throw medErr;

      return rx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      toast({ title: "Prescription created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
