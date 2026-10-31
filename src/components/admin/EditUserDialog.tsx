import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { fetchAdminUserDetails, useUpdateUserDetails } from "@/hooks/useAdminUserActions";
import { toast } from "@/hooks/use-toast";

interface EditUserDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ userId, open, onOpenChange }: EditUserDialogProps) {
  const updateUser = useUpdateUserDetails();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [originalEmail, setOriginalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setPassword("");
    setChangingPassword(false);
    fetchAdminUserDetails(userId)
      .then((u) => {
        setForm({ full_name: u.full_name || "", phone: u.phone || "", email: u.email || "" });
        setOriginalEmail(u.email || "");
      })
      .catch((e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const handleSave = async () => {
    if (!userId) return;
    if (changingPassword && password.length > 0 && password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    await updateUser.mutateAsync({
      target_user_id: userId,
      full_name: form.full_name,
      phone: form.phone,
      ...(form.email && form.email !== originalEmail ? { email: form.email } : {}),
      ...(changingPassword && password ? { password } : {}),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update this user's details, email and password.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-9 bg-muted rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-xs font-medium">Change Password</Label>
                    <p className="text-[11px] text-muted-foreground">Set a new password for this user</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setChangingPassword(!changingPassword)}>
                  {changingPassword ? "Cancel" : "Change"}
                </Button>
              </div>
              {changingPassword && (
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
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || updateUser.isPending}>
            {updateUser.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
