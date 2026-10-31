import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

export interface TreatmentPlan {
  id: string;
  org_id: string;
  patient_id: string;
  plan_name: string;
  description: string | null;
  status: string;
  priority: string;
  total_estimated_cost: number;
  start_date: string | null;
  target_end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient_name: string;
  items_count: number;
  completed_count: number;
  acceptance_status?: string;
  coverage_percent?: number;
  insurer_name?: string | null;
}

export interface TreatmentPlanItem {
  id: string;
  plan_id: string;
  treatment_id: string | null;
  description: string;
  tooth_number: string | null;
  visit_number: number;
  estimated_cost: number;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  notes: string | null;
  phase?: number | null;
  surfaces?: string | null;
  cdt_code?: string | null;
  insurance_amount?: number;
}

export function useTreatmentPlans() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["treatment-plans", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("treatment_plans")
        .select("*, patients(first_name, last_name), treatment_plan_items(id, status)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        patient_name: p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : "Unknown",
        items_count: p.treatment_plan_items?.length || 0,
        completed_count: p.treatment_plan_items?.filter((i: any) => i.status === "completed").length || 0,
        treatment_plan_items: undefined,
        patients: undefined,
      })) as TreatmentPlan[];
    },
  });
}

export function useTreatmentPlanItems(planId: string | null) {
  return useQuery({
    queryKey: ["treatment-plan-items", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("treatment_plan_items")
        .select("*")
        .eq("plan_id", planId)
        .order("visit_number", { ascending: true });
      if (error) throw error;
      return (data || []) as TreatmentPlanItem[];
    },
  });
}

export function useCreateTreatmentPlan() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      patient_id: string;
      plan_name: string;
      description?: string;
      priority?: string;
      start_date?: string;
      target_end_date?: string;
      insurer_name?: string;
      coverage_percent?: number;
      items: { treatment_id?: string; description: string; tooth_number?: string; surfaces?: string; phase?: number; cdt_code?: string; visit_number: number; estimated_cost: number; scheduled_date?: string; notes?: string }[];
    }) => {
      const totalCost = input.items.reduce((s, i) => s + i.estimated_cost, 0);
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const { data: plan, error } = await (supabase as any)
        .from("treatment_plans")
        .insert({
          org_id: currentOrg?.org_id,
          patient_id: input.patient_id,
          plan_name: input.plan_name,
          description: input.description || null,
          priority: input.priority || "normal",
          start_date: input.start_date || null,
          target_end_date: input.target_end_date || null,
          total_estimated_cost: totalCost,
          insurer_name: input.insurer_name || null,
          coverage_percent: Math.min(100, Math.max(0, Number(input.coverage_percent || 0))),
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.items.length > 0) {
        const items = input.items.map((i) => ({
          plan_id: plan.id,
          treatment_id: i.treatment_id || null,
          description: i.description,
          tooth_number: i.tooth_number || null,
          surfaces: i.surfaces || null,
          phase: i.phase || null,
          cdt_code: i.cdt_code || null,
          visit_number: i.visit_number,
          estimated_cost: i.estimated_cost,
          scheduled_date: i.scheduled_date || null,
          notes: i.notes || null,
        }));
        const { error: itemsErr } = await (supabase as any).from("treatment_plan_items").insert(items);
        if (itemsErr) throw itemsErr;
      }

      return plan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      toast({ title: "Treatment plan created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePlanItemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      updates.completed_date = status === "completed" ? new Date().toISOString().split("T")[0] : null;
      const { error } = await (supabase as any).from("treatment_plan_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plan-items"] });
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["patient-plan-items"] });
      qc.invalidateQueries({ queryKey: ["patient-treatment-plans"] });
      toast({ title: "Visit status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePlanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("treatment_plans").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      toast({ title: "Plan status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

async function recalcPlanTotal(planId: string) {
  const db = supabase as any;
  const { data } = await db.from("treatment_plan_items").select("estimated_cost, status").eq("plan_id", planId);
  const total = (data || []).filter((i: any) => i.status !== "skipped").reduce((s: number, i: any) => s + Number(i.estimated_cost || 0), 0);
  await db.from("treatment_plans").update({ total_estimated_cost: total }).eq("id", planId);
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  ["treatment-plans", "treatment-plan-items", "patient-plan-items", "patient-treatment-plans"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, any> }) => {
      const { error } = await (supabase as any).from("treatment_plans").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(qc); toast({ title: "Plan updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const db = supabase as any;
      const { error: e1 } = await db.from("treatment_plan_items").delete().eq("plan_id", id);
      if (e1) throw e1;
      const { error } = await db.from("treatment_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(qc); toast({ title: "Plan deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useSavePlanItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, plan_id, values }: { id?: string; plan_id: string; values: Record<string, any> }) => {
      const db = supabase as any;
      const { error } = id
        ? await db.from("treatment_plan_items").update(values).eq("id", id)
        : await db.from("treatment_plan_items").insert({ ...values, plan_id });
      if (error) throw error;
      await recalcPlanTotal(plan_id);
    },
    onSuccess: () => { invalidateAll(qc); toast({ title: "Procedure saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeletePlanItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, plan_id }: { id: string; plan_id: string }) => {
      const { error } = await (supabase as any).from("treatment_plan_items").delete().eq("id", id);
      if (error) throw error;
      await recalcPlanTotal(plan_id);
    },
    onSuccess: () => { invalidateAll(qc); toast({ title: "Procedure removed" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useMovePlanItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ a, b }: { a: { id: string; visit_number: number }; b: { id: string; visit_number: number } }) => {
      const db = supabase as any;
      const r1 = await db.from("treatment_plan_items").update({ visit_number: b.visit_number }).eq("id", a.id);
      if (r1.error) throw r1.error;
      const r2 = await db.from("treatment_plan_items").update({ visit_number: a.visit_number }).eq("id", b.id);
      if (r2.error) throw r2.error;
    },
    onSuccess: () => invalidateAll(qc),
  });
}
