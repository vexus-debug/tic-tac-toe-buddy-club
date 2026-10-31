import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";

export interface MessageWithDetails {
  id: string;
  sender_id: string;
  subject: string;
  body: string;
  content: string;
  is_urgent: boolean;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
  full_name?: string;
  user_id?: string;
  role?: string;
  unread_count?: number;
  last_message_at?: string;
  attachments?: any[];
  recipients?: { recipient_id: string; is_read: boolean }[];
}

export interface ConversationPartner {
  user_id: string;
  full_name: string;
  role: string;
  last_message_at: string;
  unread_count: number;
}

export function getAllowedRecipientRoles(_senderRoles: string[]): string[] {
  return ["admin", "dentist", "receptionist", "accountant", "hygienist", "assistant", "lab_technician"];
}

export function useConversations() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["conversations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      // Get messages for this org
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("*, message_recipients(*)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as MessageWithDetails[];
    },
  });
}

export function useMessageThread(partnerId: string | null) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["message-thread", partnerId, orgId],
    enabled: !!partnerId && !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("*, message_recipients(*)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as MessageWithDetails[];
    },
  });
}

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ["unread-message-count"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("message_recipients")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) return 0;
      return count || 0;
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: { subject?: string; body?: string; content?: string; recipient_ids?: string[]; recipientIds?: string[]; is_urgent?: boolean; attachments?: any[]; isBroadcast?: boolean; broadcastRole?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: msg, error: msgErr } = await (supabase as any)
        .from("messages")
        .insert({ sender_id: user.id, subject: input.subject || "", body: input.body || input.content || "", is_urgent: input.is_urgent || false, org_id: currentOrg?.org_id })
        .select()
        .single();
      if (msgErr) throw msgErr;

      const recipientIds = input.recipient_ids || input.recipientIds || [];
      const recipients = recipientIds.map((rid: string) => ({ message_id: msg.id, recipient_id: rid }));
      const { error: recErr } = await (supabase as any).from("message_recipients").insert(recipients);
      if (recErr) throw recErr;

      return msg;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["message-thread"] });
    },
  });
}

export function useMarkMessagesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      for (const mid of messageIds) {
        await (supabase as any)
          .from("message_recipients")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("message_id", mid)
          .eq("recipient_id", user.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-message-count"] });
      qc.invalidateQueries({ queryKey: ["message-thread"] });
    },
  });
}

export function useRealtimeMessages() {
  // Will be implemented with Supabase realtime subscriptions
}
