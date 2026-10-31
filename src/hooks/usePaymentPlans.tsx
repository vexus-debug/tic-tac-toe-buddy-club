import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";
import { addDays, addWeeks, addMonths } from "date-fns";

export interface PaymentPlan {
  id: string;
  org_id: string;
  invoice_id: string;
  patient_id: string | null;
  plan_name: string;
  total_amount: number;
  installment_count: number;
  installment_amount: number;
  frequency: string;
  start_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanInstallment {
  id: string;
  plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  payment_id: string | null;
  status: string;
  created_at: string;
}

export function usePaymentPlans(invoiceId?: string | null) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["payment-plans", orgId, invoiceId],
    enabled: !!orgId,
    queryFn: async () => {
      let query = (supabase as any)
        .from("payment_plans")
        .select("*, invoices(invoice_number, total), patients(first_name, last_name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (invoiceId) query = query.eq("invoice_id", invoiceId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        invoice_number: p.invoices?.invoice_number || "",
        patient_name: p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : "Unknown",
      }));
    },
  });
}

export function usePlanInstallments(planId: string | null) {
  return useQuery({
    queryKey: ["plan-installments", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payment_plan_installments")
        .select("*")
        .eq("plan_id", planId)
        .order("installment_number");
      if (error) throw error;
      return (data || []) as PlanInstallment[];
    },
  });
}

function getNextDate(start: Date, frequency: string, index: number): Date {
  switch (frequency) {
    case "weekly": return addWeeks(start, index);
    case "biweekly": return addWeeks(start, index * 2);
    default: return addMonths(start, index);
  }
}

export function useCreatePaymentPlan() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      invoice_id: string;
      patient_id: string | null;
      total_amount: number;
      installment_count: number;
      frequency: string;
      start_date: string;
      notes?: string;
    }) => {
      const installmentAmount = Math.round((input.total_amount / input.installment_count) * 100) / 100;
      const { data: plan, error } = await (supabase as any)
        .from("payment_plans")
        .insert({
          org_id: currentOrg?.org_id,
          invoice_id: input.invoice_id,
          patient_id: input.patient_id,
          total_amount: input.total_amount,
          installment_count: input.installment_count,
          installment_amount: installmentAmount,
          frequency: input.frequency,
          start_date: input.start_date,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) throw error;

      const startDate = new Date(input.start_date);
      const installments = Array.from({ length: input.installment_count }, (_, i) => ({
        plan_id: plan.id,
        installment_number: i + 1,
        amount: i === input.installment_count - 1
          ? Math.round((input.total_amount - installmentAmount * (input.installment_count - 1)) * 100) / 100
          : installmentAmount,
        due_date: getNextDate(startDate, input.frequency, i).toISOString().split("T")[0],
        status: "pending",
      }));

      const { error: instError } = await (supabase as any)
        .from("payment_plan_installments")
        .insert(installments);
      if (instError) throw instError;

      return plan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-plans"] });
      toast({ title: "Payment plan created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useMarkInstallmentPaid() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: { installment_id: string; plan_id: string; invoice_id: string; amount: number; payment_method: string }) => {
      // Record payment
      const { data: payment, error: payErr } = await (supabase as any)
        .from("payments")
        .insert({
          invoice_id: input.invoice_id,
          amount: input.amount,
          payment_method: input.payment_method,
          org_id: currentOrg?.org_id,
        })
        .select()
        .single();
      if (payErr) throw payErr;

      // Mark installment
      const { error: instErr } = await (supabase as any)
        .from("payment_plan_installments")
        .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0], payment_id: payment.id })
        .eq("id", input.installment_id);
      if (instErr) throw instErr;

      // Check if all installments are paid
      const { data: remaining } = await (supabase as any)
        .from("payment_plan_installments")
        .select("id")
        .eq("plan_id", input.plan_id)
        .eq("status", "pending");

      if (!remaining || remaining.length === 0) {
        await (supabase as any).from("payment_plans").update({ status: "completed" }).eq("id", input.plan_id);
      }

      // Update invoice status
      const { data: payments } = await (supabase as any).from("payments").select("amount").eq("invoice_id", input.invoice_id);
      const totalPaid = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      const { data: invoice } = await (supabase as any).from("invoices").select("total").eq("id", input.invoice_id).single();
      const newStatus = totalPaid >= Number(invoice?.total || 0) ? "paid" : "partial";
      await (supabase as any).from("invoices").update({ status: newStatus }).eq("id", input.invoice_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-plans"] });
      qc.invalidateQueries({ queryKey: ["plan-installments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["billing_stats"] });
      toast({ title: "Installment marked as paid" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
