import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read: boolean;
  link: string | null;
  created_at: string;
}

export function useNotifications() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["notifications", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return ((data || []) as any[]).map((n: any) => ({ ...n, read: n.is_read })) as Notification[];
    },
  });
}

export function useUnreadCount() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["notifications-unread-count", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useRealtimeNotifications() {
  // Will be implemented with Supabase realtime subscriptions
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("org_id", currentOrg?.org_id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}
