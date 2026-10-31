import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

async function callAdminAction(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await supabase.functions.invoke("admin-user-actions", {
    body,
  });

  if (res.error) throw new Error(res.error.message || "Action failed");
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

export function useUpdateAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ target_user_id, new_status }: { target_user_id: string; new_status: string }) => {
      return callAdminAction({ action: "update_account_status", target_user_id, new_status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["platform-audit-log"] });
      toast({ title: "Account status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useAssignSuperAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ target_user_id }: { target_user_id: string }) => {
      return callAdminAction({ action: "assign_super_admin", target_user_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users-roles"] });
      queryClient.invalidateQueries({ queryKey: ["platform-audit-log"] });
      toast({ title: "Super admin role assigned" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useRevokeSuperAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ target_user_id }: { target_user_id: string }) => {
      return callAdminAction({ action: "revoke_super_admin", target_user_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users-roles"] });
      queryClient.invalidateQueries({ queryKey: ["platform-audit-log"] });
      toast({ title: "Super admin role revoked" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export interface AdminUserDetails {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  account_status: string;
}

export async function fetchAdminUserDetails(target_user_id: string): Promise<AdminUserDetails> {
  const data = await callAdminAction({ action: "get_user_details", target_user_id });
  return data.user as AdminUserDetails;
}

export function useUpdateUserDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      target_user_id: string;
      full_name?: string;
      phone?: string;
      email?: string;
      password?: string;
    }) => {
      return callAdminAction({ action: "update_user_details", ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["platform-audit-log"] });
      toast({ title: "User updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ target_user_id }: { target_user_id: string }) => {
      return callAdminAction({ action: "reset_password", target_user_id });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["platform-audit-log"] });
      toast({
        title: "Password reset",
        description: `Temporary password: ${data.temp_password}`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
