import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePatientDetail(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-detail", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("patients")
        .select("*")
        .eq("id", patientId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePatientVisits(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-visits", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("appointments")
        .select("*, staff(full_name), treatments(name, price)")
        .eq("patient_id", patientId!)
        .eq("status", "completed")
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        id: a.id,
        date: a.appointment_date,
        treatment: a.treatments?.name || "General Visit",
        dentist: a.staff?.full_name || "Unknown",
        dentistId: a.staff_id || null,
        notes: a.notes || "",
        cost: Number(a.treatments?.price || 0),
      }));
    },
  });
}

export function usePatientTreatmentPlans(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-treatment-plans", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("treatment_plans")
        .select("*, treatment_plan_items(*)")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePatientInvoices(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-invoices", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("invoices")
        .select("*")
        .eq("patient_id", patientId!)
        .order("invoice_date", { ascending: false });
      if (error) throw error;

      const invoiceIds = (data || []).map((invoice: any) => invoice.id);
      const { data: payments, error: paymentsError } = invoiceIds.length
        ? await (supabase as any)
            .from("payments")
            .select("invoice_id, amount")
            .in("invoice_id", invoiceIds)
        : { data: [], error: null };
      if (paymentsError) throw paymentsError;

      const paidByInvoice = (payments || []).reduce((totals: Record<string, number>, payment: any) => {
        totals[payment.invoice_id] = (totals[payment.invoice_id] || 0) + Number(payment.amount || 0);
        return totals;
      }, {});

      return (data || []).map((invoice: any) => ({
        ...invoice,
        discount_percent: Number(invoice.discount || 0),
        total_amount: Number(invoice.total || 0),
        subtotal: Number(invoice.subtotal || 0),
        amount_paid: paidByInvoice[invoice.id] || 0,
        notes: invoice.notes || "",
        patient_name: "",
      }));
    },
  });
}

export function usePatientPrescriptions(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient-prescriptions", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("prescriptions")
        .select("*, staff:dentist_id(full_name), prescription_medications(*)")
        .eq("patient_id", patientId!)
        .order("prescription_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
