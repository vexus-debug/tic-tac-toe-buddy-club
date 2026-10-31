import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export function useDentalChartEntries(patientId: string | undefined) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["dental-chart", patientId, orgId],
    enabled: !!patientId && !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dental_chart_entries")
        .select("*, staff:dentist_id(full_name)")
        .eq("org_id", orgId)
        .eq("patient_id", patientId!)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateDentalChartEntry() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (entry: any) => {
      const { data, error } = await (supabase as any).from("dental_chart_entries").insert({ ...entry, org_id: currentOrg?.org_id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["dental-chart", data.patient_id] });
      toast({ title: "Procedure recorded", description: `${data.procedure} on tooth #${data.tooth_number}` });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useUpdateDentalChartEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await (supabase as any).from("dental_chart_entries").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["dental-chart", data.patient_id] });
      toast({ title: "Entry updated", description: `Updated tooth #${data.tooth_number}` });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useDeleteDentalChartEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patient_id }: { id: string; patient_id: string }) => {
      const { error } = await (supabase as any).from("dental_chart_entries").delete().eq("id", id);
      if (error) throw error;
      return { id, patient_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dental-chart", data.patient_id] });
      toast({ title: "Entry deleted", description: "Procedure record removed" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}
