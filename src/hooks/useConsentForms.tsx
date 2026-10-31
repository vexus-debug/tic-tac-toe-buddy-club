import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export function useConsentFormTemplates() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["consent_form_templates", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("consent_form_templates")
        .select("*")
        .eq("org_id", orgId)
        .order("title");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateConsentFormTemplate() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (template: { title: string; content: string; category: string; created_by?: string }) => {
      const { data, error } = await (supabase as any).from("consent_form_templates").insert({ ...template, org_id: currentOrg?.org_id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consent_form_templates"] });
      toast({ title: "Template created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateConsentFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string; category?: string; is_active?: boolean }) => {
      const { data, error } = await (supabase as any).from("consent_form_templates").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consent_form_templates"] });
      toast({ title: "Template updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function usePatientConsentForms(patientId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["patient_consent_forms", patientId, orgId],
    enabled: !!patientId && !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("patient_consent_forms")
        .select("*, consent_form_templates(title, category)")
        .eq("org_id", orgId)
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllConsentForms() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["patient_consent_forms", "all", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("patient_consent_forms")
        .select("*, patients(first_name, last_name), consent_form_templates(title, category)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreatePatientConsentForm() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (form: {
      patient_id: string;
      template_id?: string;
      title: string;
      content: string;
      created_by?: string;
    }) => {
      const { created_by: _ignored, ...payload } = form;
      const { data, error } = await (supabase as any).from("patient_consent_forms").insert({ ...payload, org_id: currentOrg?.org_id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient_consent_forms"] });
      toast({ title: "Consent form created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useSignConsentForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, signed_by, signer_name, witnessed_by }: { id: string; signed_by?: string; signer_name?: string; witnessed_by?: string }) => {
      const { data, error } = await (supabase as any).from("patient_consent_forms").update({
        status: "signed",
        signed_by: signed_by || signer_name || "",
        signed_date: new Date().toISOString().split("T")[0],
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient_consent_forms"] });
      toast({ title: "Consent form signed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
