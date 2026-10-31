import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Pencil, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_GOAL = 500000;
const HYGIENE_RE = /(clean|scal|polish|prophy|fluoride|hygien|sealant|check.?up|exam|x.?ray|radiograph|consult)/i;

const money = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

/** Hygiene = diagnostic/preventive (CDT D0xxx/D1xxx) or matching name/category. */
export function isHygieneProcedure(t: { name?: string | null; category?: string | null; cdt_code?: string | null }) {
  if (t.cdt_code && /^D[01]/i.test(t.cdt_code.trim())) return true;
  return HYGIENE_RE.test(`${t.name || ""} ${t.category || ""}`);
}

export function MorningHuddleCard({ basePath }: { basePath: string }) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  const goalKey = `clinexus-daily-goal-${orgId}`;
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const saved = Number(localStorage.getItem(goalKey));
    if (saved > 0) setGoal(saved);
  }, [goalKey]);

  const { data } = useQuery({
    queryKey: ["morning-huddle", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const [apptRes, itemsRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("status, treatments(name, category, cdt_code, price)")
          .eq("org_id", orgId!)
          .eq("appointment_date", today),
        (supabase as any)
          .from("treatment_plan_items")
          .select("estimated_cost, status, scheduled_date, treatment_plans!inner(org_id, status)")
          .eq("treatment_plans.org_id", orgId!)
          .is("scheduled_date", null)
          .not("status", "in", "(completed,cancelled)"),
      ]);
      let doctor = 0, hygiene = 0, done = 0;
      for (const a of (apptRes.data || []) as any[]) {
        if (["cancelled", "no_show", "no-show"].includes(a.status)) continue;
        const t = a.treatments;
        const price = Number(t?.price || 0);
        if (t && isHygieneProcedure(t)) hygiene += price; else doctor += price;
        if (a.status === "completed") done += price;
      }
      const items = ((itemsRes.data || []) as any[]).filter((i) => !["cancelled", "completed", "archived"].includes(i.treatment_plans?.status));
      return {
        scheduled: doctor + hygiene, doctor, hygiene, done,
        unscheduledValue: items.reduce((s, i) => s + Number(i.estimated_cost || 0), 0),
        unscheduledCount: items.length,
      };
    },
  });

  const scheduled = data?.scheduled || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((scheduled / goal) * 100)) : 0;
  const donePct = goal > 0 ? Math.min(100, (data?.done || 0) / goal * 100) : 0;
  const split = scheduled > 0 ? Math.round(((data?.doctor || 0) / scheduled) * 100) : 0;

  const saveGoal = () => {
    const n = Number(draft.replace(/[^\d]/g, ""));
    if (n > 0) { setGoal(n); localStorage.setItem(goalKey, String(n)); }
    setEditing(false);
  };

  return (
    <Card className="border-border/60" data-tour="morning-huddle">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" />Morning huddle</CardTitle>
        <CardDescription>Today's production against your daily goal</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl font-semibold tabular-nums">{money(scheduled)}</p>
            <span className="text-sm font-medium text-primary">{pct}%</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-muted" aria-label={`${pct}% of daily goal scheduled`}>
            <span className="absolute inset-y-0 left-0 bg-primary/40" style={{ width: `${pct}%` }} />
            <span className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${donePct}%` }} />
          </div>
          {editing ? (
            <div className="flex gap-2">
              <Input autoFocus inputMode="numeric" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveGoal()} className="h-8" />
              <Button size="sm" onClick={saveGoal}>Save</Button>
            </div>
          ) : (
            <button type="button" onClick={() => { setDraft(String(goal)); setEditing(true); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Scheduled of {money(goal)} goal · {money(data?.done || 0)} done <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Doctor vs hygiene</p>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
            <span className="bg-primary" style={{ width: `${split}%` }} />
            <span className="bg-info" style={{ width: `${scheduled > 0 ? 100 - split : 0}%` }} />
          </div>
          <div className="flex justify-between text-sm">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />Doctor {money(data?.doctor || 0)}</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-info" />Hygiene {money(data?.hygiene || 0)}</span>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Unscheduled treatment</p>
          <p className="text-xl font-semibold tabular-nums">{money(data?.unscheduledValue || 0)}</p>
          <Link to={`${basePath}/treatments`} className="flex items-center gap-1 text-xs font-medium text-primary">
            {data?.unscheduledCount || 0} procedures not booked yet <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
