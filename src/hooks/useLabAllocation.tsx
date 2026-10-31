import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export function useLabAllocationRules() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["lab-allocation-rules", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lab_allocation_rules")
        .select("*")
        .eq("org_id", orgId)
        .order("category");
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useUpdateLabAllocationRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rules: { id: string; percentage: number }[]) => {
      for (const rule of rules) {
        const { error } = await (supabase as any)
          .from("lab_allocation_rules")
          .update({ percentage: rule.percentage })
          .eq("id", rule.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab-allocation-rules"] }); toast({ title: "Lab allocation rules updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });
}

export function useLabRevenueSummary() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["lab-revenue-summary", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: allInvoices } = await (supabase as any)
        .from("lab_invoices")
        .select("total, amount_paid, status")
        .eq("org_id", orgId);
      const invoices = (allInvoices || []) as any[];
      const totalRevenue = invoices.reduce((s: number, i: any) => s + Number(i.total), 0);
      const totalPaid = invoices.reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0);
      const outstanding = Math.max(totalRevenue - totalPaid, 0);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data: monthInvoices } = await (supabase as any)
        .from("lab_invoices")
        .select("total")
        .eq("org_id", orgId)
        .gte("invoice_date", startOfMonth.toISOString().split("T")[0]);
      const monthRevenue = ((monthInvoices || []) as any[]).reduce((s: number, i: any) => s + Number(i.total), 0);

      return { totalRevenue, totalPaid, outstanding, monthRevenue };
    },
  });
}
