import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { clinicTypeOptions } from "@/config/clinicTypeConfig";

export function CreateClinicDialog() {
  const [open, setOpen] = useState(false);
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

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: generateSlug(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const insertData: any = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        clinic_type: form.clinic_type,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };
      const { error } = await supabase.from("organizations").insert([insertData]);

      if (error) throw error;

      toast({ title: "Clinic created successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-platform-stats"] });
      setOpen(false);
      setForm({ name: "", slug: "", clinic_type: "dental", email: "", phone: "", address: "" });
    } catch (err: any) {
      toast({
        title: "Failed to create clinic",
        description: err.message?.includes("duplicate") ? "A clinic with this slug already exists." : err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Clinic
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Clinic</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Clinic Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Smile Dental Clinic" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="smile-dental-clinic" />
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="clinic@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1234567890" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City" rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Clinic"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
