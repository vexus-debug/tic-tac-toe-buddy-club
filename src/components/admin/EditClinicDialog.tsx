import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { clinicTypeOptions } from "@/config/clinicTypeConfig";

interface EditClinicDialogProps {
  org: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClinicDialog({ org, open, onOpenChange }: EditClinicDialogProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    clinic_type: "dental",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (org && open) {
      setForm({
        name: org.name || "",
        slug: org.slug || "",
        clinic_type: org.clinic_type || "dental",
        email: org.email || "",
        phone: org.phone || "",
        address: org.address || "",
      });
    }
  }, [org, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: form.name.trim(),
          slug: form.slug.trim(),
          clinic_type: form.clinic_type as any,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
        })
        .eq("id", org.id);
      if (error) throw error;

      toast({ title: "Clinic updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-platform-stats"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to update clinic",
        description: err.message?.includes("duplicate") ? "A clinic with this slug already exists." : err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Clinic</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Clinic Name *</Label>
            <Input id="edit-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-slug">Slug *</Label>
            <Input id="edit-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            <p className="text-[11px] text-muted-foreground">Used in URL: /clinic/{form.slug || "..."}/dashboard</p>
          </div>
          <div className="space-y-2">
            <Label>Clinic Type</Label>
            <Select value={form.clinic_type} onValueChange={(v) => setForm((f) => ({ ...f, clinic_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {clinicTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      {opt.label}
                      {opt.comingSoon && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">Coming Soon</Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <Textarea id="edit-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
