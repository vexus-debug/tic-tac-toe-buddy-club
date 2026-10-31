import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";

export function useAuditLog(filters?: { eventType?: string; dateFrom?: string; dateTo?: string }) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["audit_log", orgId, filters],
    enabled: !!orgId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("activity_log")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.eventType) {
        query = query.eq("event_type", filters.eventType);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo + "T23:59:59");
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}
