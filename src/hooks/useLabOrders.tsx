import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface LabOrderRow {
  id: string;
  patient_id: string;
  treatment_id: string | null;
  dentist_id: string;
  lab_work_type: string;
  lab_name: string;
  due_date: string | null;
  sent_date: string | null;
  received_date: string | null;
  status: string;
  notes: string;
  created_at: string;
  patients: { first_name: string; last_name: string } | null;
  staff: { full_name: string } | null;
  treatments: { name: string } | null;
}

export function useLabOrders() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["lab_orders", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lab_orders")
        .select("*, patients(first_name, last_name), staff(full_name), treatments(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LabOrderRow[];
    },
  });
}

export function useCreateLabOrder() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (order: any) => {
      const { data, error } = await (supabase as any).from("lab_orders").insert({ ...order, org_id: currentOrg?.org_id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lab_orders"] }); toast({ title: "Lab order created" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}
