import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference: string;
  created_at: string;
}

export function usePayments(invoiceId: string | null) {
  return useQuery({
    queryKey: ["payments", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payments")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("payment_date", { ascending: true });
      if (error) throw error;
      return (data || []) as Payment[];
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: { invoice_id: string; amount: number; payment_method: string; reference?: string }) => {
      const { error: payError } = await (supabase as any).from("payments").insert({
        invoice_id: input.invoice_id, amount: input.amount, payment_method: input.payment_method, reference: input.reference || "", org_id: currentOrg?.org_id,
      });
      if (payError) throw payError;

      // Update invoice status based on total payments
      const { data: payments } = await (supabase as any)
        .from("payments").select("amount").eq("invoice_id", input.invoice_id);
      const totalPaid = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);

      const { data: invoice } = await (supabase as any)
        .from("invoices").select("total").eq("id", input.invoice_id).single();
      const newStatus = totalPaid >= Number(invoice?.total || 0) ? "paid" : "partial";
      await (supabase as any).from("invoices").update({ status: newStatus }).eq("id", input.invoice_id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments", variables.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ["billing_stats"] });
    },
  });
}
