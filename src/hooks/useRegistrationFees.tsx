import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface RegistrationFeeRow {
  id: string;
  patient_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  receipt_number: string | null;
  notes: string;
  created_at: string;
  patients?: { first_name: string; last_name: string } | null;
}

export function useRegistrationFees() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["registration_fees", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("registration_fees")
        .select("*, patients(first_name, last_name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as RegistrationFeeRow[];
    },
  });
}

export function useRegistrationFeeStats() {
  const { data: fees = [], isLoading } = useRegistrationFees();
  const totalCollected = fees.reduce((s, f) => s + Number(f.amount), 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthCollected = fees
    .filter((f) => new Date(f.payment_date) >= startOfMonth)
    .reduce((s, f) => s + Number(f.amount), 0);
  return { fees, totalCollected, monthCollected, isLoading };
}

export function useCreateRegistrationFee() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (fee: any) => {
      const { data, error } = await (supabase as any)
        .from("registration_fees")
        .insert({ ...fee, org_id: currentOrg?.org_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["registration_fees"] }); toast({ title: "Registration fee recorded" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });
}
