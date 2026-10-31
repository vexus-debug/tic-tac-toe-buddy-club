import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export function usePatientImages(patientId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["patient_images", patientId, orgId],
    enabled: !!patientId && !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("patient_images")
        .select("*")
        .eq("org_id", orgId)
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUploadPatientImage() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async ({ file, patientId, imageType, toothNumber, description, userId }: {
      file: File; patientId: string; imageType: string; toothNumber?: string | number; description?: string; userId?: string;
    }) => {
      const ext = file.name.split(".").pop();
      const path = `${currentOrg?.org_id}/${patientId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("patient-images").upload(path, file);
      if (uploadError) throw uploadError;
      const { data, error } = await (supabase as any).from("patient_images").insert({
        patient_id: patientId, image_url: path, image_type: imageType,
        tooth_number: toothNumber || null, description: description || "", uploaded_by: userId || null, org_id: currentOrg?.org_id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["patient_images"] }); toast({ title: "Image uploaded" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeletePatientImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("patient_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["patient_images"] }); toast({ title: "Image deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
