import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrg } from "@/hooks/useOrg";

export function useRevenueAllocationRules() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["revenue-allocation-rules", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("revenue_allocation_rules")
        .select("*")
        .eq("org_id", orgId)
        .order("category");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useStaffAllocationRules() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["staff-allocation-rules", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("staff_allocation_rules")
        .select("*")
        .eq("org_id", orgId)
        .order("category");
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useUpdateRevenueRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rules: { id: string; percentage: number }[]) => {
      for (const rule of rules) {
        const { error } = await (supabase as any)
          .from("revenue_allocation_rules")
          .update({ percentage: rule.percentage })
          .eq("id", rule.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["revenue-allocation-rules"] }); toast.success("Revenue allocation rules updated"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateStaffRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rules: { id: string; percentage: number }[]) => {
      for (const rule of rules) {
        const { error } = await (supabase as any)
          .from("staff_allocation_rules")
          .update({ percentage: rule.percentage })
          .eq("id", rule.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff-allocation-rules"] }); toast.success("Staff allocation rules updated"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useToggleAllocationActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const { error } = await (supabase as any)
        .from("revenue_allocation_rules")
        .update({ is_active: isActive })
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["revenue-allocation-rules"] }); toast.success("Allocation system toggled"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRevenueSummary() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["revenue-summary", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: allPayments } = await (supabase as any).from("payments").select("amount").eq("org_id", orgId);
      const totalRevenue = (allPayments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data: monthPayments } = await (supabase as any)
        .from("payments")
        .select("amount")
        .eq("org_id", orgId)
        .gte("payment_date", startOfMonth.toISOString().split("T")[0]);
      const monthRevenue = (monthPayments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);

      const { data: warChest } = await (supabase as any).from("war_chest_entries").select("amount").eq("org_id", orgId);
      const warChestTotal = (warChest || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

      return { totalRevenue, monthRevenue, warChestTotal };
    },
  });
}

export function useAllocationBreakdown() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["allocation-breakdown", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: allAllocations } = await (supabase as any).from("revenue_allocations").select("category, amount").eq("org_id", orgId);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data: monthAllocations } = await (supabase as any)
        .from("revenue_allocations")
        .select("category, amount, created_at")
        .eq("org_id", orgId)
        .gte("created_at", startOfMonth.toISOString());

      const allTime: Record<string, number> = {};
      const thisMonth: Record<string, number> = {};
      (allAllocations || []).forEach((a: any) => { allTime[a.category] = (allTime[a.category] || 0) + Number(a.amount); });
      (monthAllocations || []).forEach((a: any) => { thisMonth[a.category] = (thisMonth[a.category] || 0) + Number(a.amount); });

      return { allTime, thisMonth };
    },
  });
}

export function useStaffAllocationBreakdown() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["staff-allocation-breakdown", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: allAllocations } = await (supabase as any)
        .from("staff_revenue_allocations")
        .select("amount, created_at, staff_allocation_rules(category)")
        .eq("org_id", orgId);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const allTime: Record<string, number> = {};
      const thisMonth: Record<string, number> = {};
      ((allAllocations as any[]) || []).forEach((a) => {
        const category = a.staff_allocation_rules?.category || "Unassigned";
        allTime[category] = (allTime[category] || 0) + Number(a.amount);
        if (new Date(a.created_at) >= startOfMonth) {
          thisMonth[category] = (thisMonth[category] || 0) + Number(a.amount);
        }
      });


      return { allTime, thisMonth };
    },
  });
}
