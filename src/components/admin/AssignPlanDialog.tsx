import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { addMonths, format } from "date-fns";

interface Props {
  /** When set, the dialog assigns a plan to this clinic only. */
  orgId?: string;
  trigger: React.ReactNode;
}

export function AssignPlanDialog({ orgId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(orgId ?? "");
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState("active");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (orgId) setSelectedOrg(orgId);
  }, [orgId]);

  const { data: orgs = [] } = useQuery({
    queryKey: ["admin-orgs-for-plan"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, created_at")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly");
      if (error) throw error;
      return data ?? [];
    },
  });

  const org = orgs.find((o: any) => o.id === selectedOrg);
  const plan: any = plans.find((p: any) => p.id === planId);

  const period = useMemo(() => {
    if (!org || !plan) return null;
    const start = new Date(org.created_at);
    const months = plan.duration_months ?? 1;
    return { start, end: addMonths(start, months), months };
  }, [org, plan]);

  const save = useMutation({
    mutationFn: async () => {
      if (!selectedOrg || !plan || !period) throw new Error("Select a clinic and a plan");
      const months = period.months;
      const amount = months >= 12 ? Number(plan.price_yearly ?? plan.price_monthly * 12)
        : Number(plan.price_monthly) * months;
      const payload = {
        org_id: selectedOrg,
        plan_id: plan.id,
        status,
        billing_cycle: months >= 12 ? "yearly" : months === 1 ? "monthly" : `${months}-monthly`,
        amount,
        current_period_start: period.start.toISOString(),
        current_period_end: period.end.toISOString(),
        payment_status: status === "trial" ? "pending" : "paid",
        trial_ends_at: status === "trial" ? period.end.toISOString() : null,
      };

      const { data: existing } = await supabase
        .from("clinic_subscriptions")
        .select("id")
        .eq("org_id", selectedOrg)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from("clinic_subscriptions").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clinic_subscriptions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-clinic-detail"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-subscription"] });
      toast({ title: "Plan assigned", description: "The clinic now sees this plan in its portal." });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Could not assign plan", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign subscription plan</DialogTitle>
          <DialogDescription>
            The plan period runs from the clinic's creation date for the plan's length.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!orgId && (
            <div className="space-y-1.5">
              <Label>Clinic</Label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger><SelectValue placeholder="Select clinic" /></SelectTrigger>
                <SelectContent>
                  {orgs.map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
              <SelectContent>
                {plans.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.duration_months ?? 1} month{(p.duration_months ?? 1) > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {plans.length === 0 && (
              <p className="text-xs text-muted-foreground">No active plans configured yet.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Coverage</p>
              <p className="text-muted-foreground">
                {format(period.start, "MMM d, yyyy")} → {format(period.end, "MMM d, yyyy")} ({period.months} month
                {period.months > 1 ? "s" : ""} from clinic creation)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!selectedOrg || !planId || save.isPending}>
            {save.isPending ? "Saving…" : "Assign plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
