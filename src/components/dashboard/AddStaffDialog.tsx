import { useState, useEffect } from "react";
import { getStaffRoles, getRoleLabel } from "@/config/roleAccess";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateStaff } from "@/hooks/useStaff";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { PROVIDER_TYPES } from "@/components/dashboard/associate/ProviderBadge";
import { useClinicChairs } from "@/hooks/useClinicChairs";


interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStaffDialog({ open, onOpenChange }: AddStaffDialogProps) {
  const createStaff = useCreateStaff();
  const { currentOrg } = useOrg();
  const { roles: platformRoles } = useAuth();
  const isSuper = platformRoles.includes("super_admin");
  const myRole = currentOrg?.role;
  // Managers can never appoint admins; owners, admins and super admins can
  const canAppointAdmin = isSuper || myRole === "owner" || myRole === "admin";
  const canAppointManager = canAppointAdmin;
  const clinicType = currentOrg?.clinic_type as string | undefined;
  const isLab = clinicType === "dental_lab";
  const defaultRole = isLab ? "lab_technician" : "dentist";
  const roles = [...(canAppointAdmin ? ["admin"] : []), ...(canAppointManager ? ["manager"] : []), ...getStaffRoles(clinicType)];
  const [form, setForm] = useState({ full_name: "", role: defaultRole, phone: "", email: "", specialty: "", provider_type: "in_house", allowed_chairs: [] as string[] });
  const { data: chairRows = [] } = useClinicChairs();
  const chairNames: string[] = (chairRows as any[]).length ? (chairRows as any[]).map((c) => c.name) : ["Chair 1", "Chair 2", "Chair 3"];
  const isClinical = !isLab && ["dentist", "hygienist", "doctor", "specialist", "orthodontist", "surgeon"].includes(form.role);
  useEffect(() => { if (open && !roles.includes(form.role)) setForm((f) => ({ ...f, role: defaultRole })); }, [open, isLab]);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.full_name.trim()) return;
    if (createAccount && (!form.email.trim() || !password.trim())) {
      toast({ title: "Email and password required", description: "Please provide email and password to create a login account.", variant: "destructive" });
      return;
    }
    if (createAccount && password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the staff record first
      const staffData = await createStaff.mutateAsync(isClinical ? form : { ...form, provider_type: "in_house", allowed_chairs: [] });

      // If creating an account, call the edge function
      if (createAccount && form.email.trim() && password.trim()) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke("manage-staff-user", {
          body: {
            action: "create_user",
            org_id: currentOrg?.org_id,
            email: form.email,
            password,
            full_name: form.full_name,
            role: form.role,
            staff_id: staffData?.id,
          },
        });

        if (res.error || res.data?.error) {
          toast({
            title: "Staff added but account creation failed",
            description: res.data?.error || res.error?.message || "Could not create login account.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Staff added with login account", description: `${form.full_name} can now log in with their email and password.` });
        }
      }

      onOpenChange(false);
      setForm({ full_name: "", role: defaultRole, phone: "", email: "", specialty: "", provider_type: "in_house", allowed_chairs: [] });
      setPassword("");
      setCreateAccount(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-secondary" />
            Add Staff Member
          </DialogTitle>
          <DialogDescription>Add a new team member to your {isLab ? "dental lab" : "clinic"}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Enter full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r} value={r} >{getRoleLabel(r, clinicType)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Specialty</Label>
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder={isLab ? "e.g. CAD/CAM, Ceramics" : "e.g. Orthodontics"} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@email.com" />
            </div>
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
              {(form.provider_type === "associate" || form.provider_type === "locum") && (
                <p className="col-span-2 text-[11px] text-muted-foreground">After saving, open this person and use the Contract tab to set commission, lab fee share and daily draw.</p>
              )}
            </div>
          )}

          {/* Login account section */}
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Create Login Account</Label>
                <p className="text-[11px] text-muted-foreground">Allow this staff member to log in to the system</p>
              </div>
              <Switch checked={createAccount} onCheckedChange={setCreateAccount} />
            </div>
            {createAccount && (
              <div className="space-y-1">
                <Label className="text-xs">Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {!form.email.trim() && (
                  <p className="text-[11px] text-destructive">Email is required to create a login account</p>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-secondary hover:bg-secondary/90" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
