import { useState, useEffect } from "react";
import { getStaffRoles, getRoleLabel } from "@/config/roleAccess";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateStaff, type StaffMember } from "@/hooks/useStaff";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROVIDER_TYPES } from "@/components/dashboard/associate/ProviderBadge";
import { ContractTermsTab } from "@/components/dashboard/associate/ContractTermsTab";
import { useClinicChairs } from "@/hooks/useClinicChairs";


interface EditStaffDialogProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStaffDialog({ staff, open, onOpenChange }: EditStaffDialogProps) {
  const updateStaff = useUpdateStaff();
  const { currentOrg } = useOrg();
  const { roles: platformRoles } = useAuth();
  const isSuper = platformRoles.includes("super_admin");
  const myRole = currentOrg?.role;
  // Managers can never appoint admins; owners, admins and super admins can
  const canAppointAdmin = isSuper || myRole === "owner" || myRole === "admin";
  const canAppointManager = canAppointAdmin;
  const canEditLogin = isSuper || ["owner", "admin", "manager"].includes(myRole || "");
  const roles = [...(canAppointAdmin ? ["admin"] : []), ...(canAppointManager ? ["manager"] : []), ...getStaffRoles(currentOrg?.clinic_type as string | undefined)];
  const [form, setForm] = useState({ full_name: "", role: "dentist", phone: "", email: "", specialty: "", status: "active", provider_type: "in_house", allowed_chairs: [] as string[] });
  const { data: chairRows = [] } = useClinicChairs();
  const chairNames: string[] = (chairRows as any[]).length ? (chairRows as any[]).map((c) => c.name) : ["Chair 1", "Chair 2", "Chair 3"];
  const isClinical = ["dentist", "hygienist", "doctor", "specialist", "orthodontist", "surgeon"].includes(form.role);
  const canSeeContract = isSuper || ["owner", "admin", "accountant"].includes(myRole || "");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (staff) {
      setForm({
        full_name: staff.full_name,
        role: staff.role,
        phone: staff.phone || "",
        email: staff.email || "",
        specialty: staff.specialty || "",
        status: staff.status,
        provider_type: staff.provider_type || "in_house",
        allowed_chairs: staff.allowed_chairs || [],
      });
      setNewPassword("");
      setChangingPassword(false);
    }
  }, [staff]);

  const hasLinkedAccount = !!staff?.user_id;

  const handleSave = async () => {
    if (!staff) return;
    setIsSaving(true);
    try {
      const wantsPassword = changingPassword && newPassword.trim().length > 0;
      if (wantsPassword && newPassword.length < 6) {
        toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
        setIsSaving(false);
        return;
      }
      const emailChanged = form.email.trim() !== (staff.email || "") && form.email.trim().length > 0;

      // Update the login account first so a rejected email doesn't leave records out of sync
      if (hasLinkedAccount && (emailChanged || wantsPassword)) {
        const res = await supabase.functions.invoke("manage-staff-user", {
          body: {
            action: "update_member_details",
            org_id: currentOrg?.org_id,
            user_id: staff.user_id,
            full_name: form.full_name,
            phone: form.phone,
            ...(emailChanged ? { email: form.email.trim() } : {}),
            ...(wantsPassword ? { password: newPassword } : {}),
          },
        });
        if (res.error || res.data?.error) {
          throw new Error(res.data?.error || res.error?.message || "Could not update login details.");
        }
      }

      await updateStaff.mutateAsync({ id: staff.id, ...form, email: form.email.trim() });

      // Keep the member's access role in sync with their staff role (server-enforced)
      if (hasLinkedAccount && form.role !== staff.role && currentOrg?.org_id) {
        const res = await supabase.functions.invoke("manage-staff-user", {
          body: {
            action: "update_role",
            org_id: currentOrg.org_id,
            user_id: staff.user_id,
            role: form.role,
          },
        });
        if (res.error || res.data?.error) {
          throw new Error(res.data?.error || res.error?.message || "Could not update this staff member's role.");
        }
      }

      if (hasLinkedAccount && (emailChanged || wantsPassword)) {
        toast({ title: "Login details updated", description: `${staff.full_name} can now sign in with the new ${emailChanged && wantsPassword ? "email and password" : emailChanged ? "email" : "password"}.` });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>Update details for {staff?.full_name}.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="details">
        {isClinical && canSeeContract && staff && (
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="contract" className="flex-1">Compensation &amp; Contract</TabsTrigger>
          </TabsList>
        )}
        {staff && <TabsContent value="contract"><ContractTermsTab staffId={staff.id} /></TabsContent>}
        <TabsContent value="details">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(roles.includes(form.role) ? roles : [form.role, ...roles]).map((r) => <SelectItem key={r} value={r} >{getRoleLabel(r, currentOrg?.clinic_type as string | undefined)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Specialty</Label>
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input value={form.email} disabled={!canEditLogin} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isClinical && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Provider type</Label>
                <Select value={form.provider_type} onValueChange={(v) => setForm({ ...form, provider_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROVIDER_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Allowed chairs <span className="text-muted-foreground">(none = any)</span></Label>
                <div className="flex flex-wrap gap-1">
                  {chairNames.map((c) => {
                    const on = form.allowed_chairs.includes(c);
                    return (
                      <button key={c} type="button" aria-pressed={on}
                        onClick={() => setForm({ ...form, allowed_chairs: on ? form.allowed_chairs.filter((x) => x !== c) : [...form.allowed_chairs, c] })}
                        className={`rounded-md border px-2 py-1 text-[11px] font-medium ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Password change section */}
          {hasLinkedAccount && canEditLogin && (
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs font-medium">Change Password</Label>
                    <p className="text-[11px] text-muted-foreground">Set a new password for this staff member</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setChangingPassword(!changingPassword)}
                >
                  {changingPassword ? "Cancel" : "Change"}
                </Button>
              </div>
              {changingPassword && (
                <div className="space-y-1">
                  <Label className="text-xs">New Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasLinkedAccount && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                This staff member doesn't have a login account. To create one, delete and re-add them with the "Create Login Account" option.
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
        </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
