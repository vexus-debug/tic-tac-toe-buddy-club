import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Palette, Building2, Save, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

function useOrgsWithSettings() {
  return useQuery({
    queryKey: ["admin-orgs-branding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, clinic_type, logo_url, settings")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export default function AdminWhiteLabel() {
  const { data: orgs = [], isLoading } = useOrgsWithSettings();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [brandForm, setBrandForm] = useState({ primary_color: "", logo_url: "", tagline: "" });

  const updateBranding = useMutation({
    mutationFn: async ({ id, settings }: { id: string; settings: any }) => {
      const org = orgs.find((o) => o.id === id);
      const existingSettings = (org?.settings as Record<string, any>) || {};
      const { error } = await supabase.from("organizations").update({
        settings: { ...existingSettings, branding: settings },
        logo_url: settings.logo_url || org?.logo_url,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orgs-branding"] });
      toast({ title: "Branding updated" });
      setEditingId(null);
    },
  });

  const startEdit = (org: any) => {
    const branding = (org.settings as any)?.branding || {};
    setBrandForm({
      primary_color: branding.primary_color || "",
      logo_url: org.logo_url || "",
      tagline: branding.tagline || "",
    });
    setEditingId(org.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">White-label / Branding</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure per-clinic branding from the admin panel.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No clinics found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map((org: any) => {
            const branding = (org.settings as any)?.branding || {};
            const isEditing = editingId === org.id;

            return (
              <Card key={org.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-sm">{org.name}</h3>
                        <p className="text-xs text-muted-foreground">/{org.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {branding.primary_color && (
                        <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: branding.primary_color }} />
                      )}
                      <Badge variant="secondary" className="text-[10px] capitalize">{org.clinic_type}</Badge>
                      {!isEditing && (
                        <Button variant="outline" size="sm" onClick={() => startEdit(org)} className="text-xs gap-1">
                          <Palette className="h-3 w-3" /> Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={brandForm.primary_color || "#3b82f6"}
                              onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                              className="h-9 w-12 p-1 cursor-pointer"
                            />
                            <Input
                              value={brandForm.primary_color}
                              onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                              placeholder="#3b82f6"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Tagline</Label>
                          <Input
                            value={brandForm.tagline}
                            onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
                            placeholder="Your clinic tagline"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Logo URL</Label>
                        <Input
                          value={brandForm.logo_url}
                          onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button size="sm" className="gap-1" onClick={() => updateBranding.mutate({ id: org.id, settings: brandForm })}>
                          <Save className="h-3 w-3" /> Save
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
