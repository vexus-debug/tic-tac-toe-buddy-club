import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface OrgMemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
}

export function useOrgMembers() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;

  return useQuery({
    queryKey: ["org-members", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_members")
        .select("id, user_id, role, profiles:user_id(full_name)")
        .eq("org_id", orgId!);
      if (error) throw error;
      return (data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        full_name: (m.profiles as any)?.full_name || "Unnamed User",
      })) as OrgMemberWithProfile[];
    },
  });
}

export function useUpdateOrgMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from("org_members")
        .update({ role: role as any })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      toast({ title: "Role updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export interface MemberDetails {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
}

async function callManageStaffUser(body: Record<string, unknown>) {
  const res = await supabase.functions.invoke("manage-staff-user", { body });
  if (res.error) throw new Error(res.error.message || "Request failed");
  if ((res.data as any)?.error) throw new Error((res.data as any).error);
  return res.data as any;
}

export async function fetchMemberDetails(orgId: string, userId: string): Promise<MemberDetails> {
  const data = await callManageStaffUser({ action: "get_member_details", org_id: orgId, user_id: userId });
  return data.member as MemberDetails;
}

export function useUpdateOrgMemberDetails() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (payload: {
      user_id: string;
      full_name?: string;
      phone?: string;
      email?: string;
      password?: string;
    }) => {
      return callManageStaffUser({
        action: "update_member_details",
        org_id: currentOrg?.org_id,
        ...payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({ title: "Member updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useRemoveOrgMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("org_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      toast({ title: "Member removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
