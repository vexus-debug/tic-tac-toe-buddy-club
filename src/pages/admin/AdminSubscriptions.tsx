import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CreditCard, Search, Building2, Plus, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, isPast, differenceInDays } from "date-fns";

function useSubscriptions() {
  return useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_subscriptions")
        .select("*, organizations(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function usePlans() {
  return useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("subscription_plans")
        .select("*")
        .order("price_monthly", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  trial: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  suspended: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-muted text-muted-foreground",
};

export default function AdminSubscriptions() {
  const { data: subs = [], isLoading } = useSubscriptions();
  const { data: plans = [] } = usePlans();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("clinic_subscriptions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast({ title: "Subscription updated" });
    },
  });

  const filtered = subs.filter((s: any) => {
    const name = s.organizations?.name || "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const trialExpiring = subs.filter((s: any) => 
    s.status === "trial" && s.trial_ends_at && differenceInDays(new Date(s.trial_ends_at), new Date()) <= 7
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage clinic subscriptions, plans, and billing status.</p>
      </div>

      {trialExpiring.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700">{trialExpiring.length} trial(s) expiring within 7 days</p>
              <p className="text-xs text-amber-600/80">
                {trialExpiring.map((s: any) => s.organizations?.name).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Overview */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">PLAN TIERS</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan: any) => (
            <Card key={plan.id} className="glass-card">
              <CardContent className="p-4">
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{plan.description || "No description"}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">${plan.price_monthly}</span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
                {plan.price_yearly && (
                  <p className="text-xs text-muted-foreground">${plan.price_yearly}/yr</p>
                )}
                <div className="mt-2 flex gap-1 flex-wrap">
                  {plan.max_staff && <Badge variant="secondary" className="text-[10px]">{plan.max_staff} staff</Badge>}
                  {plan.max_patients && <Badge variant="secondary" className="text-[10px]">{plan.max_patients} patients</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">No plans configured yet.</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clinics..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "trial", "suspended", "cancelled"].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize text-xs">
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Clinic</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Status</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs">Billing</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs hidden md:table-cell">Amount</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs hidden lg:table-cell">Trial Ends</th>
                  <th className="py-2.5 px-4 text-left font-medium text-muted-foreground text-xs hidden lg:table-cell">Payment</th>
                  <th className="py-2.5 px-4 text-right font-medium text-muted-foreground text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b"><td colSpan={7} className="py-3 px-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No subscriptions found</p>
                  </td></tr>
                ) : filtered.map((sub: any) => (
                  <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{sub.organizations?.name || "Unknown"}</td>
                    <td className="py-3 px-4">
                      <Badge className={`text-[10px] ${statusColors[sub.status] || ""}`}>{sub.status}</Badge>
                    </td>
                    <td className="py-3 px-4 capitalize text-muted-foreground">{sub.billing_cycle}</td>
                    <td className="py-3 px-4 hidden md:table-cell">${Number(sub.amount).toFixed(2)}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {sub.trial_ends_at ? (
                        <span className={isPast(new Date(sub.trial_ends_at)) ? "text-destructive" : ""}>
                          {format(new Date(sub.trial_ends_at), "MMM d, yyyy")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <Badge variant="outline" className="text-[10px] capitalize">{sub.payment_status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Select
                        value={sub.status}
                        onValueChange={(v) => updateStatus.mutate({ id: sub.id, status: v })}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
