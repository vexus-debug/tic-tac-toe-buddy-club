import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";

/**
 * Warm the data for high-traffic dashboard pages before the user clicks,
 * so the page renders from cache instead of waiting on a network round trip.
 * Only pages whose query returns raw rows are prefetched, so the cached
 * shape always matches what the page's own hook expects.
 */
const PREFETCHERS: Record<
  string,
  { key: (orgId: string) => unknown[]; run: (orgId: string) => Promise<unknown> }
> = {
  patients: {
    key: (orgId) => ["patients", orgId],
    run: async (orgId) => {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  },
  inventory: {
    key: (orgId) => ["inventory", orgId],
    run: async (orgId) => {
      const { data, error } = await (supabase as any)
        .from("inventory")
        .select("*")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  },
  treatments: {
    key: (orgId) => ["treatments", orgId],
    run: async (orgId) => {
      const { data, error } = await (supabase as any)
        .from("treatments")
        .select("*")
        .eq("org_id", orgId)
        .order("category", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  },
  staff: {
    key: (orgId) => ["staff", orgId],
    run: async (orgId) => {
      const { data, error } = await (supabase as any)
        .from("staff")
        .select("*")
        .eq("org_id", orgId)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  },
};

export function usePrefetchPage() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useCallback(
    (path: string) => {
      if (!orgId) return;
      const entry = PREFETCHERS[String(path).split("/")[0]];
      if (!entry) return;
      queryClient.prefetchQuery({
        queryKey: entry.key(orgId),
        queryFn: () => entry.run(orgId),
        staleTime: 2 * 60 * 1000,
      });
    },
    [queryClient, orgId],
  );
}
