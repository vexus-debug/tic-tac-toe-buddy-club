import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

export interface TreatmentMaterial {
  id: string;
  org_id: string;
  treatment_id: string;
  inventory_id: string;
  quantity_used: number;
  notes: string | null;
  created_at: string;
  treatments?: { name: string };
  inventory?: { name: string; unit: string };
}

export function useTreatmentMaterials(treatmentId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["treatment-materials", orgId, treatmentId],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("treatment_materials")
        .select("*, treatments:treatment_id(name), inventory:inventory_id(name, unit)")
        .eq("org_id", orgId);
      if (treatmentId) q = q.eq("treatment_id", treatmentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as TreatmentMaterial[];
    },
  });
}

export function useCreateTreatmentMaterial() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (mat: { treatment_id: string; inventory_id: string; quantity_used: number; notes?: string }) => {
      const { error } = await (supabase as any).from("treatment_materials").insert({ ...mat, org_id: currentOrg?.org_id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-materials"] });
      toast({ title: "Material mapping added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteTreatmentMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("treatment_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-materials"] });
      toast({ title: "Material mapping removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
