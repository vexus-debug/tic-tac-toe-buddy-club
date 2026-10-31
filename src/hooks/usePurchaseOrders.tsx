import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

export interface PurchaseOrder {
  id: string;
  org_id: string;
  supplier_id: string | null;
  order_number: string;
  status: string;
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  suppliers?: { name: string } | null;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  inventory_id: string | null;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export function usePurchaseOrders() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["purchase-orders", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PurchaseOrder[];
    },
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (po: Partial<PurchaseOrder>) => {
      const { data, error } = await (supabase as any)
        .from("purchase_orders")
        .insert({ ...po, org_id: currentOrg?.org_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Purchase order created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseOrder> & { id: string }) => {
      const { error } = await (supabase as any).from("purchase_orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Purchase order updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
