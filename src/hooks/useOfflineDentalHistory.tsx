import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface OfflineDentalHistoryRow {
  id: string;
  org_id: string;
  patient_id: string;
  history_date: string;
  procedure: string;
  treatment: string | null;
  amount_paid: number;
  dentist_id: string | null;
  notes: string | null;
  created_at: string;
  staff?: { full_name: string } | null;
}

export interface OfflineDentalHistoryInput {
  history_date: string;
  procedure: string;
  treatment?: string;
  amount_paid?: number;
  dentist_id?: string | null;
  notes?: string;
}

export function useOfflineDentalHistory(patientId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["offline_dental_history", patientId, orgId],
    enabled: !!patientId && !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("offline_dental_history")
        .select("*, staff:dentist_id(full_name)")
        .eq("org_id", orgId)
        .eq("patient_id", patientId!)
        .order("history_date", { ascending: false });
      if (error) throw error;
      return (data || []) as OfflineDentalHistoryRow[];
    },
  });
}

export function useCreateOfflineDentalHistory() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async ({ patientId, ...input }: OfflineDentalHistoryInput & { patientId: string }) => {
      const { data, error } = await (supabase as any)
        .from("offline_dental_history")
        .insert({
          org_id: currentOrg?.org_id,
          patient_id: patientId,
          history_date: input.history_date,
          procedure: input.procedure,
          treatment: input.treatment || null,
          amount_paid: input.amount_paid ?? 0,
          dentist_id: input.dentist_id || null,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offline_dental_history"] });
      toast({ title: "Past record added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateOfflineDentalHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: OfflineDentalHistoryInput & { id: string }) => {
      const { error } = await (supabase as any)
        .from("offline_dental_history")
        .update({
          history_date: input.history_date,
          procedure: input.procedure,
          treatment: input.treatment || null,
          amount_paid: input.amount_paid ?? 0,
          dentist_id: input.dentist_id || null,
          notes: input.notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offline_dental_history"] });
      toast({ title: "Past record updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteOfflineDentalHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("offline_dental_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offline_dental_history"] });
      toast({ title: "Past record deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
