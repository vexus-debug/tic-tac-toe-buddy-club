import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface LabCaseRow {
  id: string;
  case_number: string;
  patient_id: string | null;
  dentist_id: string | null;
  client_type: string | null;
  external_client_name: string | null;
  external_contact_person: string | null;
  external_client_phone: string | null;
  external_client_email: string | null;
  external_patient_name: string | null;
  technician_id: string | null;
  assigned_technician_id: string | null;
  treatment_id: string | null;
  work_type: string;
  instructions: string;
  status: string;
  urgency: string;
  is_urgent: boolean;
  due_date: string | null;
  start_date: string | null;
  completed_date: string | null;
  lab_fee: number;
  clinic_fee: number;
  discount: number;
  shade: string;
  material: string;
  notes: string;
  remark: string;
  clinic_code: string;
  clinic_doctor_name: string;
  created_at: string;
  updated_at: string;
  patients: { first_name: string; last_name: string } | null;
  dentist: { full_name: string } | null;
  technician: { full_name: string } | null;
}

export function useLabCases() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["lab_cases", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lab_cases")
        .select(
          "*, patients(first_name, last_name), dentist:staff!lab_cases_dentist_id_fkey(full_name), technician:staff!lab_cases_technician_id_fkey(full_name)"
        )
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LabCaseRow[];
    },
  });
}

export function useLabCaseStats() {
  const { data: cases = [], isLoading } = useLabCases();
  const stats = {
    total: cases.length,
    pending: cases.filter((c) => c.status === "pending").length,
    inProgress: cases.filter((c) => c.status === "in-progress").length,
    ready: cases.filter((c) => c.status === "ready").length,
    delivered: cases.filter((c) => c.status === "delivered").length,
    urgent: cases.filter((c) => (c.is_urgent || c.urgency === "urgent") && c.status !== "delivered").length,
    overdue: cases.filter((c) => c.due_date && new Date(c.due_date) < new Date() && !["delivered", "ready"].includes(c.status)).length,
    unpaid: cases.filter((c) => Number(c.lab_fee) > 0).length,
  };
  return { stats, cases, isLoading };
}

export function useCreateLabCase() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (labCase: any) => {
      const { data, error } = await (supabase as any)
        .from("lab_cases")
        .insert({ ...labCase, org_id: currentOrg?.org_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lab_cases"] }); toast({ title: "Lab case created" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}

export function useUpdateLabCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await (supabase as any).from("lab_cases").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lab_cases"] }); toast({ title: "Lab case updated" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });
}
