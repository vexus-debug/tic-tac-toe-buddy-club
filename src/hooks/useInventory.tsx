import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_stock: number;
  supplier: string | null;
  last_restocked: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export function useInventory() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["inventory", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("inventory")
        .select("*")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return (data || []) as InventoryItem[];
    },
  });
}

export function useAddInventoryItem() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "created_at" | "updated_at">) => {
      const { error } = await (supabase as any).from("inventory").insert({ ...item, org_id: currentOrg?.org_id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useUpdateInventoryStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await (supabase as any)
        .from("inventory")
        .update({ quantity, last_restocked: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; category?: string; unit?: string; min_stock?: number; supplier?: string | null; unit_cost?: number | null; expiry_date?: string | null; quantity?: number }) => {
      const { error } = await (supabase as any).from("inventory").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });
}
