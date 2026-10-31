import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/useOrg";

export interface LabInvoiceRow {
  id: string;
  invoice_number: string;
  clinic_code: string;
  clinic_doctor_name: string;
  patient_name: string;
  lab_case_id: string | null;
  invoice_date: string;
  subtotal: number;
  discount: number;
  total: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useLabInvoices() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["lab_invoices", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lab_invoices")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((inv: any) => ({
        ...inv,
        total_amount: inv.total || 0,
        amount_paid: Number(inv.amount_paid || 0),
        clinic_doctor_name: inv.clinic_doctor_name || inv.clinic_code || "",
      })) as unknown as LabInvoiceRow[];
    },
  });
}

export function useLabInvoiceStats() {
  const { data: invoices = [], isLoading } = useLabInvoices();
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid), 0);
  const totalOutstanding = totalRevenue - totalPaid;
  const unpaidCount = invoices.filter((i) => i.status !== "paid").length;
  return { invoices, totalRevenue, totalPaid, totalOutstanding, unpaidCount, isLoading };
}

export function useCreateLabInvoice() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (invoice: any) => {
      const disc = invoice.discount || 0;
      const total = Math.max(invoice.subtotal - disc, 0);
      const paid = Number(invoice.amount_paid || 0);
      const status = paid <= 0 ? "unpaid" : paid >= total ? "paid" : "partial";
      const { data, error } = await (supabase as any)
        .from("lab_invoices")
        .insert({
          invoice_number: `LAB-${Date.now()}`, clinic_code: invoice.clinic_code || "",
          clinic_doctor_name: invoice.clinic_doctor_name || "",
          patient_name: invoice.patient_name || "", lab_case_id: invoice.lab_case_id || null,
          subtotal: invoice.subtotal, discount: disc, total, amount_paid: paid, status, notes: invoice.notes || "",
          org_id: currentOrg?.org_id,
        })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab_invoices"] }); toast({ title: "Lab invoice created" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });
}

export function useUpdateLabInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await (supabase as any).from("lab_invoices").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab_invoices"] }); toast({ title: "Lab invoice updated" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });
}
