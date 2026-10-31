import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function useFeatureFlags() {
  return useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feature_flags").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export default function AdminFeatureFlags() {
  const { data: flags = [], isLoading } = useFeatureFlags();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", target_type: "global" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feature_flags").insert({ ...form, is_enabled: false });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      toast({ title: "Feature flag created" });
      setOpen(false);
      setForm({ name: "", description: "", target_type: "global" });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase.from("feature_flags").update({ is_enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feature_flags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      toast({ title: "Feature flag deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Feature Flags</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Enable or disable features per clinic or globally.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> New Flag</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Feature Flag</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. new_billing_ui" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <Label>Target Type</Label>
                <Select value={form.target_type} onValueChange={(v) => setForm({ ...form, target_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="per_org">Per Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => create.mutate()} disabled={!form.name} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : flags.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No feature flags configured</p>
          </div>
        ) : flags.map((f: any) => (
          <Card key={f.id} className="glass-card">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-semibold">{f.name}</code>
                  <Badge variant="secondary" className="text-[10px]">{f.target_type}</Badge>
                  <Badge className={`text-[10px] ${f.is_enabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>
                    {f.is_enabled ? "ON" : "OFF"}
                  </Badge>
                </div>
                {f.description && <p className="text-xs text-muted-foreground mt-1">{f.description}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Switch checked={f.is_enabled} onCheckedChange={(checked) => toggle.mutate({ id: f.id, is_enabled: checked })} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate(f.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
