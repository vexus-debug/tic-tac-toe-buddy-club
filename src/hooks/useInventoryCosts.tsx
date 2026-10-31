import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  transaction_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
  item_name?: string;
}

export function useInventoryTransactions(inventoryId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["inventory-transactions", orgId, inventoryId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("inventory_transactions")
        .select("*, inventory(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (inventoryId) query = query.eq("inventory_id", inventoryId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        item_name: t.inventory?.name || "Unknown",
      })) as InventoryTransaction[];
    },
  });
}

export function useCreateInventoryTransaction() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      inventory_id: string;
      transaction_type: string;
      quantity: number;
      unit_cost: number;
      reference?: string;
      notes?: string;
    }) => {
      // Atomic, audited stock movement (records balance before/after and who did it)
      const { error } = await (supabase as any).rpc("record_inventory_movement", {
        p_org_id: currentOrg?.org_id,
        p_inventory_id: input.inventory_id,
        p_type: input.transaction_type,
        p_quantity: input.quantity,
        p_unit_cost: input.unit_cost,
        p_reference: input.reference || null,
        p_notes: input.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-transactions"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory-cost-analytics"] });
      toast({ title: "Transaction recorded" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteInventoryTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("inventory_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-transactions"] });
      qc.invalidateQueries({ queryKey: ["inventory-cost-analytics"] });
      toast({ title: "Transaction removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useInventoryCostAnalytics() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["inventory-cost-analytics", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: transactions } = await (supabase as any)
        .from("inventory_transactions")
        .select("inventory_id, transaction_type, total_cost, inventory(name, category)")
        .eq("org_id", orgId);

      const { data: inventory } = await (supabase as any)
        .from("inventory")
        .select("id, name, category, quantity, unit_cost")
        .eq("org_id", orgId);

      const totalSpend = (transactions || [])
        .filter((t: any) => t.transaction_type === "purchase")
        .reduce((s: number, t: any) => s + Number(t.total_cost), 0);

      const byCategoryMap: Record<string, number> = {};
      (transactions || []).filter((t: any) => t.transaction_type === "purchase").forEach((t: any) => {
        const cat = t.inventory?.category || "Other";
        byCategoryMap[cat] = (byCategoryMap[cat] || 0) + Number(t.total_cost);
      });

      const byCategory = Object.entries(byCategoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const stockValue = (inventory || []).reduce(
        (s: number, i: any) => s + (Number(i.quantity) * Number(i.unit_cost || 0)),
        0
      );

      return { totalSpend, stockValue, byCategory };
    },
  });
}
