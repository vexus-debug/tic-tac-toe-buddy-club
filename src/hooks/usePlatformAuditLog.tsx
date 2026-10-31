import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformAuditEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export function usePlatformAuditLog(filters?: { action?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["platform-audit-log", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("platform_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

      if (filters?.action) {
        query = query.eq("action", filters.action);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo + "T23:59:59");
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PlatformAuditEntry[];
    },
  });
}
