import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { setActiveVisit } from "@/hooks/useActiveVisit";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

const today = () => new Date().toISOString().split("T")[0];

/** Suggested procedure for each charted condition (null = nothing to treat). */
export const conditionProcedure: Record<string, { label: string; keywords: string[] } | null> = {
  healthy: null,
  treated: null,
  erupting: null,
  decayed: { label: "Filling", keywords: ["filling", "restoration", "composite", "amalgam"] },
  root_canal: { label: "Root Canal Treatment", keywords: ["root canal", "endodont", "rct"] },
  crowned: { label: "Crown", keywords: ["crown"] },
  missing: { label: "Implant / Bridge", keywords: ["implant", "bridge"] },
  impacted: { label: "Surgical Extraction", keywords: ["extraction", "surgical"] },
  fractured: { label: "Repair / Crown", keywords: ["crown", "repair", "bonding"] },
  sensitive: { label: "Desensitising Treatment", keywords: ["sensitiv", "fluoride", "desensit"] },
  rotated: { label: "Orthodontic Assessment", keywords: ["ortho", "brace", "aligner"] },
  bridged: { label: "Bridge", keywords: ["bridge"] },
  veneer: { label: "Veneer", keywords: ["veneer"] },
  implant: { label: "Implant", keywords: ["implant"] },
  other: { label: "Procedure", keywords: [] },
};

export function matchCatalogTreatment(
  condition: string,
  treatments: { id: string; name: string; price: number }[],
) {
  const rule = conditionProcedure[condition];
  if (!rule) return null;
  for (const kw of rule.keywords) {
    const t = treatments.find((tr) => tr.name.toLowerCase().includes(kw));
    if (t) return t;
  }
  return null;
}

/** Adds a charted tooth procedure to the patient's active plan, creating one if needed. */
export function useAddChartItemToPlan() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      patient_id: string;
      tooth_number: number;
      description: string;
      treatment_id?: string | null;
      estimated_cost: number;
    }) => {
      const db = supabase as any;
      const { data: existing, error: findErr } = await db
        .from("treatment_plans")
        .select("id, total_estimated_cost, treatment_plan_items(id)")
        .eq("org_id", currentOrg?.org_id)
        .eq("patient_id", input.patient_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      if (findErr) throw findErr;

      let plan = existing?.[0];
      if (!plan) {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { data: created, error } = await db
          .from("treatment_plans")
          .insert({
            org_id: currentOrg?.org_id,
            patient_id: input.patient_id,
            plan_name: `Treatment plan — ${today()}`,
            description: "Created from dental charting",
            priority: "normal",
            start_date: today(),
            total_estimated_cost: 0,
            created_by: userId,
          })
          .select("id, total_estimated_cost")
          .single();
        if (error) throw error;
        plan = { ...created, treatment_plan_items: [] };
      }

      const { error: itemErr } = await db.from("treatment_plan_items").insert({
        plan_id: plan.id,
        treatment_id: input.treatment_id || null,
        description: input.description,
        tooth_number: String(input.tooth_number),
        visit_number: (plan.treatment_plan_items?.length || 0) + 1,
        estimated_cost: input.estimated_cost,
      });
      if (itemErr) throw itemErr;

      await db
        .from("treatment_plans")
        .update({ total_estimated_cost: Number(plan.total_estimated_cost || 0) + input.estimated_cost })
        .eq("id", plan.id);
      return plan.id as string;
    },
    onSuccess: (_id, v) => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["treatment-plan-items"] });
      qc.invalidateQueries({ queryKey: ["patient-plan-items", v.patient_id] });
      qc.invalidateQueries({ queryKey: ["patient-treatment-plans", v.patient_id] });
      toast({ title: "Added to treatment plan", description: `${v.description} · tooth #${v.tooth_number}` });
    },
    onError: (e: any) => toast({ title: "Could not add to plan", description: e.message, variant: "destructive" }),
  });
}

export const INVOICED_TAG = "[invoiced]";
/** Plan items are locked once they've been sent to an invoice. */
export const isInvoiced = (i: { notes?: string | null }) => !!i.notes?.includes(INVOICED_TAG);

/** Tags plan items as invoiced so they drop out of the visit hand-off and lock their status. */
export function useMarkPlanItemsInvoiced() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; notes?: string | null }[]) => {
      for (const i of items) {
        const notes = `${i.notes ? i.notes + " " : ""}${INVOICED_TAG} ${today()}`;
        const { error } = await (supabase as any).from("treatment_plan_items").update({ notes }).eq("id", i.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["treatment-plan-items"] });
      qc.invalidateQueries({ queryKey: ["patient-plan-items"] });
    },
  });
}

export interface PatientPlanItem {
  notes?: string | null;
  id: string;
  plan_id: string;
  treatment_id: string | null;
  description: string;
  tooth_number: string | null;
  estimated_cost: number;
  status: string;
  completed_date: string | null;
  plan_name: string;
  /** Already invoiced (paid ahead) but the work is still in progress. */
  invoiced?: boolean;
  visit_number?: number | null;
}

/** All open/today-completed plan items for a patient (used by the visit hand-off). */
export function usePatientPlanItems(patientId?: string | null) {
  const { currentOrg } = useOrg();
  return useQuery({
    queryKey: ["patient-plan-items", patientId],
    enabled: !!patientId && !!currentOrg?.org_id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("treatment_plan_items")
        .select("*, treatment_plans!inner(plan_name, patient_id, org_id, status)")
        .eq("treatment_plans.patient_id", patientId)
        .eq("treatment_plans.org_id", currentOrg?.org_id)
        .order("visit_number", { ascending: true });
      if (error) throw error;
      return (data || [])
        // Keep paid-ahead work that is still in progress so it can be marked done later.
        .filter((i: any) => i.status !== "skipped" && (!isInvoiced(i) || i.status === "in-progress"))
        .map((i: any) => ({ ...i, invoiced: isInvoiced(i), plan_name: i.treatment_plans?.plan_name || "Plan" })) as PatientPlanItem[];
    },
  });
}

/** Prescriptions written for the patient today. */
export function useTodaysPrescriptions(patientId?: string | null) {
  const { currentOrg } = useOrg();
  return useQuery({
    queryKey: ["prescriptions", "today", patientId],
    enabled: !!patientId && !!currentOrg?.org_id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("prescriptions")
        .select("*, staff(full_name), prescription_medications(*)")
        .eq("org_id", currentOrg?.org_id)
        .eq("patient_id", patientId)
        .gte("created_at", `${today()}T00:00:00`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCompletePlanItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return;
      const { error } = await (supabase as any)
        .from("treatment_plan_items")
        .update({ status: "completed", completed_date: today() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["treatment-plan-items"] });
      qc.invalidateQueries({ queryKey: ["patient-plan-items"] });
    },
  });
}

/** Today's in-progress appointment for a patient — the one a visit belongs to. */
export function useActiveVisitAppointment(patientId?: string | null) {
  const { currentOrg } = useOrg();
  return useQuery({
    queryKey: ["active-visit-appointment", patientId],
    enabled: !!patientId && !!currentOrg?.org_id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("appointments")
        .select("id")
        .eq("org_id", currentOrg?.org_id)
        .eq("patient_id", patientId)
        .eq("appointment_date", today())
        .eq("status", "in-progress")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data?.[0]?.id as string) || null;
    },
  });
}

/** Marks an appointment completed once its visit is finished. */
export function useCompleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await (supabase as any)
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

/** Check an appointment straight into today's queue with chair carried over. */
export function useCheckInAppointment() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (appt: { id: string; patient_id: string; chair?: string | null; notes?: string | null }) => {
      const db = supabase as any;
      const { data: existing } = await db
        .from("waiting_list")
        .select("id")
        .eq("appointment_id", appt.id)
        .gte("created_at", `${today()}T00:00:00`)
        .limit(1);
      if (existing?.length) return existing[0].id as string;
      const { data, error } = await db
        .from("waiting_list")
        .insert({
          org_id: currentOrg?.org_id,
          patient_id: appt.patient_id,
          appointment_id: appt.id,
          chair: appt.chair || null,
          notes: appt.notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waiting-list"] });
      toast({ title: "Patient checked in", description: "Added to today's waiting list." });
    },
    onError: (e: any) => toast({ title: "Check-in failed", description: e.message, variant: "destructive" }),
  });
}

/**
 * Starts a clinical visit from anywhere (appointment, queue, profile) and keeps
 * appointment + waiting-list status in sync so the front desk sees one truth.
 */
export function useStartVisit() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: { patient_id: string; appointment_id?: string | null; waiting_id?: string | null }) => {
      const db = supabase as any;
      const orgId = currentOrg?.org_id;
      let appointmentId = input.appointment_id || null;
      if (!appointmentId) {
        const { data } = await db
          .from("appointments")
          .select("id")
          .eq("org_id", orgId)
          .eq("patient_id", input.patient_id)
          .eq("appointment_date", today())
          .in("status", ["scheduled", "confirmed", "in-progress"])
          .order("appointment_time", { ascending: true })
          .limit(1);
        appointmentId = data?.[0]?.id || null;
      }
      if (appointmentId) {
        await db.from("appointments").update({ status: "in-progress" }).eq("id", appointmentId);
      }
      // Move any open queue entry for this patient into the chair.
      const now = new Date().toISOString();
      let q = db
        .from("waiting_list")
        .update({ status: "in_progress", seen_time: now })
        .eq("org_id", orgId)
        .in("status", ["waiting", "called"]);
      q = input.waiting_id ? q.eq("id", input.waiting_id) : q.eq("patient_id", input.patient_id).gte("created_at", `${today()}T00:00:00`);
      await q;
      setActiveVisit({ patientId: input.patient_id, appointmentId });
      return appointmentId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["waiting-list"] });
      qc.invalidateQueries({ queryKey: ["active-visit-appointment"] });
    },
    onError: (e: any) => toast({ title: "Could not start visit", description: e.message, variant: "destructive" }),
  });
}

/** Marks today's queue entries for a patient as done when the visit finishes. */
export async function completeQueueForPatient(orgId: string | undefined, patientId: string) {
  await (supabase as any)
    .from("waiting_list")
    .update({ status: "completed", completed_time: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("patient_id", patientId)
    .neq("status", "completed")
    .gte("created_at", `${today()}T00:00:00`);
}

/** True when the patient has a signed general (intake) consent on file. Signed once, not per visit. */
export async function hasIntakeConsent(orgId?: string | null, patientId?: string | null): Promise<boolean> {
  if (!orgId || !patientId) return false;
  const { count, error } = await (supabase as any)
    .from("patient_consent_forms")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("patient_id", patientId)
    .eq("status", "signed")
    .ilike("title", "%general%");
  if (error) return false;
  return (count || 0) > 0;
}

/** True when the visit's consent step is done: intake consent on file, or a consent created today. */
export function useConsentToday(patientId?: string | null) {
  const { currentOrg } = useOrg();
  return useQuery({
    queryKey: ["consent-today", patientId, currentOrg?.org_id],
    enabled: !!patientId && !!currentOrg?.org_id,
    queryFn: async () => {
      if (await hasIntakeConsent(currentOrg?.org_id, patientId)) return true;
      const { count, error } = await (supabase as any)
        .from("patient_consent_forms")
        .select("id", { count: "exact", head: true })
        .eq("org_id", currentOrg?.org_id)
        .eq("patient_id", patientId)
        .gte("created_at", `${today()}T00:00:00`);
      if (error) throw error;
      return (count || 0) > 0;
    },
  });
}
