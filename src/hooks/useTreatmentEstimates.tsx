import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

export interface TreatmentEstimate {
  id: string;
  estimate_number: string;
  patient_id: string;
  estimate_date: string;
  status: string;
  valid_until: string | null;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  converted_invoice_id: string | null;
  created_at: string;
  patient_name: string;
}

export interface EstimateItem {
  id: string;
  estimate_id: string;
  treatment_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export function useTreatmentEstimates() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["treatment-estimates", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("treatment_estimates")
        .select("*, patients(first_name, last_name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        patient_name: e.patients ? `${e.patients.first_name} ${e.patients.last_name}` : "Unknown",
      })) as TreatmentEstimate[];
    },
  });
}

export function useEstimateItems(estimateId: string | null) {
  return useQuery({
    queryKey: ["estimate-items", estimateId],
    enabled: !!estimateId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("treatment_estimate_items")
        .select("*")
        .eq("estimate_id", estimateId);
      if (error) throw error;
      return (data || []) as EstimateItem[];
    },
  });
}

export function useCreateEstimate() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      patient_id: string;
      valid_until?: string;
      discount_percent: number;
      notes?: string;
      treatment_plan_id?: string | null;
      line_items: { treatment_id?: string; description: string; quantity: number; unit_price: number; line_total: number }[];
    }) => {
      const subtotal = input.line_items.reduce((s, i) => s + i.line_total, 0);
      const discountAmount = (subtotal * input.discount_percent) / 100;
      const total = subtotal - discountAmount;

      const { data: estimate, error } = await (supabase as any)
        .from("treatment_estimates")
        .insert({
          org_id: currentOrg?.org_id,
          patient_id: input.patient_id,
          estimate_number: `EST-${Date.now()}`,
          valid_until: input.valid_until || null,
          subtotal,
          discount: discountAmount,
          total,
          notes: input.notes || null,
          treatment_plan_id: input.treatment_plan_id || null,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      const items = input.line_items.map((li) => ({
        estimate_id: estimate.id,
        treatment_id: li.treatment_id || null,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        line_total: li.line_total,
      }));
      const { error: itemsErr } = await (supabase as any).from("treatment_estimate_items").insert(items);
      if (itemsErr) throw itemsErr;

      return estimate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-estimates"] });
      toast({ title: "Estimate created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateEstimateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("treatment_estimates").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "accepted") await approvePlanFromEstimate(id, false);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-estimates"] });
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["patient-plan-items"] });
      toast({ title: "Estimate status updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useConvertEstimateToInvoice() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (estimateId: string) => {
      // Get estimate + items
      const { data: estimate } = await (supabase as any).from("treatment_estimates").select("*").eq("id", estimateId).single();
      const { data: items } = await (supabase as any).from("treatment_estimate_items").select("*").eq("estimate_id", estimateId);

      if (!estimate) throw new Error("Estimate not found");

      // Create invoice
      const { data: invoice, error: invErr } = await (supabase as any)
        .from("invoices")
        .insert({
          invoice_number: `INV-${Date.now()}`,
          patient_id: estimate.patient_id,
          discount: estimate.discount,
          subtotal: estimate.subtotal,
          total: estimate.total,
          status: "pending",
          org_id: currentOrg?.org_id,
        })
        .select()
        .single();
      if (invErr) throw invErr;

      // Create invoice items
      if (items?.length) {
        const invoiceItems = items.map((i: any) => ({
          invoice_id: invoice.id,
          treatment_id: i.treatment_id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          line_total: i.line_total,
        }));
        await (supabase as any).from("invoice_items").insert(invoiceItems);
      }

      // Update estimate
      await (supabase as any).from("treatment_estimates").update({ status: "converted", converted_invoice_id: invoice.id }).eq("id", estimateId);
      await approvePlanFromEstimate(estimateId, true);

      return invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatment-estimates"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["treatment-plans"] });
      qc.invalidateQueries({ queryKey: ["patient-plan-items"] });
      toast({ title: "Estimate converted to invoice" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export const APPROVED_TAG = "[approved]";

/**
 * When a plan-based estimate is accepted, its plan items are approved and
 * scheduled; when converted to an invoice they're also tagged invoiced so the
 * visit hand-off doesn't bill them twice.
 */
async function approvePlanFromEstimate(estimateId: string, invoiced: boolean) {
  const db = supabase as any;
  const { data: est } = await db.from("treatment_estimates").select("treatment_plan_id").eq("id", estimateId).maybeSingle();
  if (!est?.treatment_plan_id) return;
  const { data: items } = await db.from("treatment_plan_items").select("id, notes, scheduled_date, status").eq("plan_id", est.treatment_plan_id);
  const today = new Date().toISOString().split("T")[0];
  for (const i of items || []) {
    if (i.status === "skipped") continue;
    let notes: string = i.notes || "";
    if (!notes.includes(APPROVED_TAG)) notes = `${notes ? notes + " " : ""}${APPROVED_TAG} ${today}`;
    if (invoiced && !notes.includes("[invoiced]")) notes = `${notes} [invoiced] ${today}`;
    await db.from("treatment_plan_items").update({ notes, scheduled_date: i.scheduled_date || today }).eq("id", i.id);
  }
}
