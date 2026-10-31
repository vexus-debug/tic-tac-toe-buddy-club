import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveSession {
  id: string;
  user_id: string;
  session_key: string;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  is_pwa: boolean;
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  current_path: string | null;
  org_slug: string | null;
  started_at: string;
  last_seen_at: string;
  full_name: string | null;
  email: string | null;
}

export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isOnline(lastSeen: string) {
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}

export function useActiveSessions() {
  return useQuery({
    queryKey: ["admin-active-sessions"],
    refetchInterval: 30_000,
    queryFn: async (): Promise<ActiveSession[]> => {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const rows = data ?? [];
      const userIds = [...new Set(rows.map((r) => r.user_id))];

      let profiles: Record<string, { full_name: string | null }> = {};
      if (userIds.length) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        profiles = Object.fromEntries(
          (profileData ?? []).map((p: any) => [p.id, { full_name: p.full_name }]),
        );
      }

      return rows.map((r) => ({
        ...r,
        full_name: profiles[r.user_id]?.full_name ?? null,
        email: null,
      })) as ActiveSession[];
    },
  });
}
