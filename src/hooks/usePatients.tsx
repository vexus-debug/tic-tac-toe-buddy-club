import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  address: string;
  blood_group?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history: string;
  allergies?: string;
  referral_source: string;
  status: string;
  created_at: string;
  [key: string]: any;
}

export function usePatients() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["patients", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as Patient[]).filter(
        (p) => p.referral_source !== "walkthrough" && !(p.first_name === "Walkthrough" && p.last_name === "Demo Patient"),
      );
    },
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (patient: any) => {
      const { data, error } = await (supabase as any).from("patients").insert({ ...patient, org_id: currentOrg?.org_id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Patient registered", description: `${data.first_name} ${data.last_name} has been added.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await (supabase as any).from("patients").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-detail", data.id] });
      toast({ title: "Patient updated", description: `${data.first_name} ${data.last_name} has been updated.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
