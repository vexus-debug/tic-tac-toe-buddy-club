import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";

const db = supabase as any;

function useInvalidateBilling() {
  const qc = useQueryClient();
  return () => {
    ["invoices", "billing_stats", "invoice_adjustments", "billing_audit", "patient_credits", "insurance_claims", "payments"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );
  };
}

/* ── Adjustments ─────────────────────────────── */
export function useInvoiceAdjustments(invoiceId: string | null) {
  return useQuery({
    queryKey: ["invoice_adjustments", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await db.from("invoice_adjustments").select("*").eq("invoice_id", invoiceId).order("created_at");
      if (error) throw error;
      return (data || []) as { id: string; kind: string; amount: number; reason: string; created_at: string }[];
    },
  });
}

export function useAddAdjustment() {
  const { currentOrg } = useOrg();
  const invalidate = useInvalidateBilling();
  return useMutation({
    mutationFn: async (input: { invoice_id: string; kind: string; amount: number; reason: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await db.from("invoice_adjustments").insert({ ...input, org_id: currentOrg?.org_id, created_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* ── Audit log ───────────────────────────────── */
export function useBillingAudit(invoiceId: string | null) {
  return useQuery({
    queryKey: ["billing_audit", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await db.from("billing_audit_log").select("*").eq("invoice_id", invoiceId).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      const rows = (data || []) as { id: string; entity: string; action: string; created_at: string; user_id: string | null; details: any }[];
      const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
      const names: Record<string, string> = {};
      if (ids.length) {
        const { data: p } = await db.from("profiles").select("id, full_name").in("id", ids);
        (p || []).forEach((x: any) => (names[x.id] = x.full_name));
      }
      return rows.map((r) => ({ ...r, user_name: r.user_id ? names[r.user_id] || "Staff" : "System" }));
    },
  });
}

/* ── Patient credits ─────────────────────────── */
export function usePatientCredits(patientId: string | null | undefined) {
  return useQuery({
    queryKey: ["patient_credits", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await db.from("patient_credits").select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as { id: string; amount: number; kind: string; notes: string | null; payment_method: string | null; created_at: string; invoice_id: string | null }[];
      const balance = rows.reduce((s, r) => s + Number(r.amount), 0);
      return { rows, balance };
    },
  });
}

export function useAddDeposit() {
  const { currentOrg } = useOrg();
  const invalidate = useInvalidateBilling();
  return useMutation({
    mutationFn: async (input: { patient_id: string; amount: number; payment_method: string; notes?: string }) => {
      if (!(input.amount > 0)) throw new Error("Enter an amount above zero");
      const { data: u } = await supabase.auth.getUser();
      const { error } = await db.from("patient_credits").insert({ ...input, kind: "deposit", org_id: currentOrg?.org_id, created_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Applies part of a patient's credit balance to an invoice as a payment. */
export function useApplyCredit() {
  const { currentOrg } = useOrg();
  const invalidate = useInvalidateBilling();
  return useMutation({
    mutationFn: async (input: { patient_id: string; invoice_id: string; amount: number }) => {
      if (!(input.amount > 0)) throw new Error("Enter an amount above zero");
      const { data: u } = await supabase.auth.getUser();
      const { error: pe } = await db.from("payments").insert({
        org_id: currentOrg?.org_id, invoice_id: input.invoice_id, amount: input.amount, payment_method: "credit", notes: "Applied from patient credit",
      });
      if (pe) throw pe;
      const { error } = await db.from("patient_credits").insert({
        org_id: currentOrg?.org_id, patient_id: input.patient_id, invoice_id: input.invoice_id, amount: -input.amount, kind: "applied", created_by: u.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* ── Insurance claims ────────────────────────── */
export const CLAIM_STATUSES = ["draft", "submitted", "pending", "paid", "denied"] as const;

export function useInsuranceClaims() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["insurance_claims", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("insurance_claims").select("*, invoices(invoice_number), patients(first_name, last_name)").eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useCreateClaim() {
  const { currentOrg } = useOrg();
  const invalidate = useInvalidateBilling();
  return useMutation({
    mutationFn: async (input: { invoice_id: string; patient_id: string | null; insurer_name: string; policy_number?: string; amount_claimed: number; notes?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await db.from("insurance_claims").insert({ ...input, status: "draft", org_id: currentOrg?.org_id, created_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateClaim() {
  const invalidate = useInvalidateBilling();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; amount_paid?: number; claim_number?: string; submitted_date?: string | null; paid_date?: string | null; notes?: string | null }) => {
      const { error } = await db.from("insurance_claims").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Claims attached to one invoice (indexed lookup by invoice_id). */
export function useInvoiceClaims(invoiceId: string | null) {
  return useQuery({
    queryKey: ["insurance_claims", "invoice", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await db.from("insurance_claims").select("id, insurer_name, policy_number, amount_claimed, amount_paid, status, created_at").eq("invoice_id", invoiceId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

/** Mark a claim paid and post the insurer's money as an "insurance" payment on the invoice. */
export function useSettleClaim() {
  const { currentOrg } = useOrg();
  const invalidate = useInvalidateBilling();
  return useMutation({
    mutationFn: async ({ claim, amount, reference }: { claim: any; amount: number; reference?: string }) => {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await db.from("insurance_claims").update({ status: "paid", amount_paid: amount, paid_date: today, submitted_date: claim.submitted_date || today }).eq("id", claim.id);
      if (error) throw error;
      if (amount <= 0) return;
      const { error: pErr } = await db.from("payments").insert({ invoice_id: claim.invoice_id, amount, payment_method: "insurance", reference: reference || `Claim ${claim.insurer_name}`, notes: `Insurance claim settlement (${claim.insurer_name})`, org_id: currentOrg?.org_id });
      if (pErr) throw pErr;
      const [{ data: pays }, { data: inv }] = await Promise.all([
        db.from("payments").select("amount").eq("invoice_id", claim.invoice_id),
        db.from("invoices").select("total").eq("id", claim.invoice_id).single(),
      ]);
      const paid = (pays || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      const { invoiceStatusAfterPayment } = await import("@/lib/claims");
      await db.from("invoices").update({ status: invoiceStatusAfterPayment(paid, Number(inv?.total || 0)) }).eq("id", claim.invoice_id);
    },
    onSuccess: invalidate,
  });
}
