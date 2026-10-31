import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";
import type { LabCaseRow } from "@/hooks/useLabCases";

export const clientOf = (c: Partial<LabCaseRow>) => c.external_client_name || c.clinic_code || "Walk-in client";
export const patientOf = (c: Partial<LabCaseRow>) =>
  c.external_patient_name || (c.patients ? `${c.patients.first_name} ${c.patients.last_name}` : "—");
export const isRush = (c: Partial<LabCaseRow>) => !!(c.is_urgent || c.urgency === "urgent");
export const isCancelled = (c: Partial<LabCaseRow>) => c.status === "cancelled";
export const isOverdue = (c: Partial<LabCaseRow>) =>
  !!c.due_date && new Date(c.due_date) < new Date(new Date().toDateString()) && !["ready", "delivered", "cancelled", "on_hold"].includes(c.status || "");

export function useMoveCase() {
  const qc = useQueryClient();
  return useMutation({
    // Start/finish/delivery dates, hold time and the QC gate are enforced by the database.
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("lab_cases").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_cases"] }),
    onError: (e: any) => toast({ title: "Could not move case", description: e.message, variant: "destructive" }),
  });
}

/** Owner/admin/manager only: ship past a failed or missing QC, with a logged reason. */
export function useOverrideQcMove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason: string }) => {
      const { error } = await (supabase as any).rpc("lab_override_qc_move", { p_case_id: id, p_status: status, p_reason: reason });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab_cases"] }); toast({ title: "QC override recorded" }); },
    onError: (e: any) => toast({ title: "Override refused", description: e.message, variant: "destructive" }),
  });
}

/** Move many cases in one all-or-nothing step. */
export function useBatchMove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (moves: { id: string; status: string }[]) => {
      const { data, error } = await (supabase as any).rpc("lab_batch_move", { p_moves: moves });
      if (error) throw error;
      return Number(data || 0);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["lab_cases"] }),
  });
}

/** Put a case on hold, or release it back to the stage it was in. */
export function useHoldCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string | null }) => {
      const sb = supabase as any;
      if (reason) {
        const { error } = await sb.from("lab_cases").update({ status: "on_hold", hold_reason: reason, hold_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
        return;
      }
      const { data: h } = await sb.from("lab_case_history").select("from_status").eq("case_id", id).eq("to_status", "on_hold")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      const back = h?.from_status && h.from_status !== "on_hold" ? h.from_status : "pending";
      const { error } = await sb.from("lab_cases").update({ status: back, hold_reason: null, hold_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["lab_cases"] }); toast({ title: v.reason ? "Case on hold" : "Hold released" }); },
    onError: (e: any) => toast({ title: "Could not update hold", description: e.message, variant: "destructive" }),
  });
}

export function useCreateDentalLabCase() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (v: Record<string, any>) => {
      const { data, error } = await (supabase as any).from("lab_cases").insert({
        org_id: currentOrg?.org_id, client_type: "external", status: "pending",
        external_client_name: v.client, clinic_doctor_name: v.doctor || "", external_patient_name: v.patient || "",
        work_type: v.work_type, shade: v.shade || "", material: v.material || "",
        instructions: v.instructions || "", shade_map: v.shade_map || {}, teeth: Array.isArray(v.teeth) ? v.teeth : [],
        ...(v.tooth_roles && Object.keys(v.tooth_roles).length ? { tooth_roles: v.tooth_roles } : {}),
        due_date: v.due_date || null, urgency: v.rush ? "urgent" : "normal", is_urgent: !!v.rush,
        lab_fee: Number(v.fee || 0),
        technician_id: v.technician_id || null, assigned_technician_id: v.technician_id || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab_cases"] }); toast({ title: "Case received" }); },
    onError: (e: any) => toast({ title: "Could not create case", description: e.message, variant: "destructive" }),
  });
}
