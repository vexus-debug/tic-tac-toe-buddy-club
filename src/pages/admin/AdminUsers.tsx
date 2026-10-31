import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Users, Shield, Ban, UserCheck, UserX, KeyRound, MoreHorizontal, ShieldCheck, ShieldOff, Pencil } from "lucide-react";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAllProfiles, useAllOrgMembers } from "@/hooks/useAdminData";
import { useAllUsersWithRoles } from "@/hooks/useUserRoles";
import { useUpdateAccountStatus, useAssignSuperAdmin, useRevokeSuperAdmin, useResetPassword } from "@/hooks/useAdminUserActions";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { getRoleLabel } from "@/config/roleAccess";

type ConfirmAction = {
  type: "status" | "assign_sa" | "revoke_sa" | "reset_pw";
  userId: string;
  userName: string;
  status?: string;
};

export default function AdminUsers() {
  const { data: profiles, isLoading } = useAllProfiles();
  const { data: usersWithRoles } = useAllUsersWithRoles();
  const { data: orgMembers } = useAllOrgMembers();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const updateStatus = useUpdateAccountStatus();
  const assignSA = useAssignSuperAdmin();
  const revokeSA = useRevokeSuperAdmin();
  const resetPw = useResetPassword();

  // Build lookup maps
  const roleMap = new Map<string, string[]>();
  (usersWithRoles || []).forEach((u) => roleMap.set(u.user_id, u.roles));

  const orgMap = new Map<string, { org_name: string; role: string }[]>();
  (orgMembers || []).forEach((m: any) => {
    const existing = orgMap.get(m.user_id) || [];
    existing.push({ org_name: m.organizations?.name || "Unknown", role: m.role });
    orgMap.set(m.user_id, existing);
  });

  const filtered = (profiles || []).filter((p: any) => {
    const matchesSearch = (p.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || (p.account_status || "active") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, userId, status } = confirmAction;
    if (type === "status" && status) updateStatus.mutate({ target_user_id: userId, new_status: status });
    if (type === "assign_sa") assignSA.mutate({ target_user_id: userId });
    if (type === "revoke_sa") revokeSA.mutate({ target_user_id: userId });
    if (type === "reset_pw") resetPw.mutate({ target_user_id: userId });
    setConfirmAction(null);
  };

  const getStatusBadge = (status: string) => {
    if (status === "banned") return <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20"><Ban className="h-2.5 w-2.5 mr-0.5" />Banned</Badge>;
    if (status === "suspended") return <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20"><UserX className="h-2.5 w-2.5 mr-0.5" />Suspended</Badge>;
    return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><UserCheck className="h-2.5 w-2.5 mr-0.5" />Active</Badge>;
  };

  const confirmMessages: Record<string, { title: string; desc: string }> = {
    status: {
      title: `Change status to "${confirmAction?.status}"?`,
      desc: `This will ${confirmAction?.status === "banned" ? "permanently ban" : confirmAction?.status === "suspended" ? "suspend" : "reactivate"} ${confirmAction?.userName}. ${confirmAction?.status !== "active" ? "They will be unable to log in." : "They will be able to log in again."}`,
    },
    assign_sa: { title: "Assign Super Admin?", desc: `Grant super admin privileges to ${confirmAction?.userName}? They'll have full platform access.` },
    revoke_sa: { title: "Revoke Super Admin?", desc: `Remove super admin privileges from ${confirmAction?.userName}?` },
    reset_pw: { title: "Reset Password?", desc: `Generate a temporary password for ${confirmAction?.userName}? The temp password will be displayed once.` },
  };

  const msg = confirmAction ? confirmMessages[confirmAction.type] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage platform users, roles, and account status.</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "suspended", "banned"].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize text-xs">
              {s}
            </Button>
          ))}
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">User</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Status</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Platform Roles</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs hidden md:table-cell">Organizations</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs hidden lg:table-cell">Joined</th>
                  <th className="py-2.5 px-4 text-right font-medium text-muted-foreground text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-32 animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
                      <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 bg-muted rounded w-24 animate-pulse" /></td>
                      <td className="py-3 px-4 hidden lg:table-cell"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
                      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-8 animate-pulse ml-auto" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No users found</p>
                    </td>
                  </tr>
                ) : filtered.map((p: any) => {
                  const initials = (p.full_name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  const platformRoles = roleMap.get(p.id) || [];
                  const userOrgs = orgMap.get(p.id) || [];
                  const isSuperAdmin = platformRoles.includes("super_admin");
                  const accountStatus = p.account_status || "active";
                  const isSelf = p.id === currentUser?.id;

                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{p.full_name || "Unnamed"} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                            {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(accountStatus)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {isSuperAdmin && (
                            <Badge className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20">
                              <Shield className="h-2.5 w-2.5 mr-0.5" /> Super Admin
                            </Badge>
                          )}
                          {platformRoles.filter((r) => r !== "super_admin").map((r) => (
                            <Badge key={r} variant="outline" className="text-[10px]">{getRoleLabel(r)}</Badge>
                          ))}
                          {platformRoles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {userOrgs.map((o, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {o.org_name} ({getRoleLabel(o.role)})
                            </Badge>
                          ))}
                          {userOrgs.length === 0 && <span className="text-xs text-muted-foreground">No org</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                        {format(new Date(p.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setEditUserId(p.id)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {accountStatus === "active" && (
                              <>
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: "status", userId: p.id, userName: p.full_name, status: "suspended" })} disabled={isSelf}>
                                  <UserX className="h-4 w-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: "status", userId: p.id, userName: p.full_name, status: "banned" })} disabled={isSelf} className="text-destructive">
                                  <Ban className="h-4 w-4 mr-2" /> Ban
                                </DropdownMenuItem>
                              </>
                            )}
                            {accountStatus !== "active" && (
                              <DropdownMenuItem onClick={() => setConfirmAction({ type: "status", userId: p.id, userName: p.full_name, status: "active" })}>
                                <UserCheck className="h-4 w-4 mr-2" /> Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {!isSuperAdmin && (
                              <DropdownMenuItem onClick={() => setConfirmAction({ type: "assign_sa", userId: p.id, userName: p.full_name })}>
                                <ShieldCheck className="h-4 w-4 mr-2" /> Grant Super Admin
                              </DropdownMenuItem>
                            )}
                            {isSuperAdmin && !isSelf && (
                              <DropdownMenuItem onClick={() => setConfirmAction({ type: "revoke_sa", userId: p.id, userName: p.full_name })} className="text-destructive">
                                <ShieldOff className="h-4 w-4 mr-2" /> Revoke Super Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setConfirmAction({ type: "reset_pw", userId: p.id, userName: p.full_name })}>
                              <KeyRound className="h-4 w-4 mr-2" /> Reset Password
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditUserDialog userId={editUserId} open={!!editUserId} onOpenChange={(open) => !open && setEditUserId(null)} />

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{msg?.title}</AlertDialogTitle>
            <AlertDialogDescription>{msg?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className={confirmAction?.type === "status" && confirmAction?.status === "banned" ? "bg-destructive hover:bg-destructive/90" : ""}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
