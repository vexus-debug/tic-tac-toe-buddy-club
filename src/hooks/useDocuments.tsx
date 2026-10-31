import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";
import { sanitizeFileName } from "@/lib/documentUtils";

export function useClinicDocuments() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["clinic_documents", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("clinic_documents")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUploadClinicDocument() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async ({ file, title, category, expiryDate, userId, notes }: {
      file: File; title: string; category: string; expiryDate?: string; userId?: string; notes?: string;
    }) => {
      if (!currentOrg?.org_id) throw new Error("No clinic selected");
      const path = `clinic/${currentOrg.org_id}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("clinic-documents")
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (uploadError) throw uploadError;
      const { data, error } = await (supabase as any).from("clinic_documents").insert({
        title: title.trim(), category, file_url: path, file_type: file.type || null,
        expiry_date: expiryDate || null, uploaded_by: userId || null, org_id: currentOrg.org_id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clinic_documents"] }); toast({ title: "Document uploaded" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteClinicDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("clinic_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clinic_documents"] }); toast({ title: "Document deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function usePatientDocuments(patientId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["patient_documents", patientId, orgId],
    enabled: !!patientId && !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("patient_documents")
        .select("*")
        .eq("org_id", orgId)
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUploadPatientDocument() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async ({ file, patientId, title, category, userId, notes }: {
      file: File; patientId: string; title: string; category: string; userId?: string; notes?: string;
    }) => {
      if (!currentOrg?.org_id) throw new Error("No clinic selected");
      const path = `patients/${currentOrg.org_id}/${patientId}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("clinic-documents")
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (uploadError) throw uploadError;
      const { data, error } = await (supabase as any).from("patient_documents").insert({
        patient_id: patientId, title: title.trim(), category, file_url: path,
        file_type: file.type || null, uploaded_by: userId || null, org_id: currentOrg.org_id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["patient_documents"] }); toast({ title: "Document uploaded" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
