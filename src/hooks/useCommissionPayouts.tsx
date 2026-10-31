import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

export interface CommissionPayout {
  id: string;
  org_id: string;
  staff_id: string;
  staff_name: string;
  period_start: string;
  period_end: string;
  calculated_amount: number;
  paid_amount: number;
  status: string;
  payment_date: string | null;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export function useCommissionPayouts() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["commission-payouts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("commission_payouts")
        .select("*, staff(full_name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        staff_name: p.staff?.full_name || "Unknown",
      })) as CommissionPayout[];
    },
  });
}

export function useCreateCommissionPayout() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      staff_id: string;
      period_start: string;
      period_end: string;
      calculated_amount: number;
      notes?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from("commission_payouts")
        .insert({
          org_id: currentOrg?.org_id,
          staff_id: input.staff_id,
          period_start: input.period_start,
          period_end: input.period_end,
          calculated_amount: input.calculated_amount,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commission-payouts"] });
      toast({ title: "Commission payout created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useMarkCommissionPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; paid_amount: number; payment_method: string; reference?: string }) => {
      const { error } = await (supabase as any)
        .from("commission_payouts")
        .update({
          paid_amount: input.paid_amount,
          status: "paid",
          payment_date: new Date().toISOString().split("T")[0],
          payment_method: input.payment_method,
          reference: input.reference || null,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commission-payouts"] });
      toast({ title: "Commission marked as paid" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
