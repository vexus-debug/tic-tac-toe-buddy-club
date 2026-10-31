import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  calculatePayStatement,
  type AssociateContract,
  type LabCharge,
  type PayStatement,
  type ProducedLine,
} from "@/lib/associatePay";

const db = supabase as any;

export interface ContractRow extends AssociateContract {
  id?: string;
  staff_id: string;
  payout_frequency: "biweekly" | "monthly";
  start_date: string | null;
  notes: string | null;
  is_active: boolean;
  end_date?: string | null;
  contract_status?: "draft" | "active" | "suspended" | "ended";
}

export const DEFAULT_CONTRACT: Omit<ContractRow, "staff_id"> = {
  compensation_basis: "production",
  commission_rate: 35,
  lab_fee_share: 50,
  daily_minimum: 0,
  payout_frequency: "monthly",
  start_date: null,
  notes: null,
  is_active: true,
  end_date: null,
  contract_status: "active",
};

export function useAssociateContracts() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["associate-contracts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("associate_contracts").select("*").eq("org_id", orgId);
      if (error) throw error;
      return (data || []) as ContractRow[];
    },
  });
}

export function useSaveAssociateContract() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (c: ContractRow) => {
      const { id, ...rest } = c;
      const { error } = await db
        .from("associate_contracts")
        .upsert({ ...rest, org_id: currentOrg?.org_id }, { onConflict: "staff_id" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["associate-contracts"] }); toast.success("Contract saved"); },
    onError: (e: any) => toast.error(e.message),
  });
}

/** The signed-in user's own staff record in this clinic. */
export function useMyStaffId() {
  const { currentOrg } = useOrg();
  const { user } = useAuth() as any;
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["my-staff-id", orgId, user?.id],
    enabled: !!orgId && !!user?.id,
    queryFn: async () => {
      const { data } = await db.from("staff").select("id, full_name").eq("org_id", orgId).eq("user_id", user.id).maybeSingle();
      return (data as { id: string; full_name: string } | null) ?? null;
    },
  });
}

async function loadProduction(orgId: string, staffId: string, from: string, to: string) {
  const { data: items, error } = await db
    .from("invoice_items")
    .select("id, description, line_total, invoice_id, provider_id, secondary_provider_id, split_ratio, invoices!inner(id, org_id, invoice_date, patient_id, subtotal, discount, total, status)")
    .or(`provider_id.eq.${staffId},secondary_provider_id.eq.${staffId}`)
    .eq("invoices.org_id", orgId)
    .gte("invoices.invoice_date", from)
    .lte("invoices.invoice_date", to)
    .neq("invoices.status", "cancelled")
    .neq("invoices.status", "void");
  if (error) throw error;
  const invoiceIds = [...new Set((items || []).map((i: any) => i.invoice_id))];
  const paid: Record<string, number> = {};
  if (invoiceIds.length) {
    const { data: pays } = await db.from("payments").select("invoice_id, amount").in("invoice_id", invoiceIds);
    (pays || []).forEach((p: any) => { paid[p.invoice_id] = (paid[p.invoice_id] || 0) + Number(p.amount); });
  }
  const produced: ProducedLine[] = (items || []).map((i: any) => ({
    id: i.id,
    invoice_id: i.invoice_id,
    invoice_date: i.invoices.invoice_date,
    patient_id: i.invoices.patient_id,
    description: i.description,
    line_total: Number(i.line_total),
    invoice_subtotal: Number(i.invoices.subtotal),
    invoice_discount: Number(i.invoices.discount),
    invoice_total: Number(i.invoices.total),
    invoice_paid: paid[i.invoice_id] || 0,
    attribution: !i.secondary_provider_id
      ? 100
      : i.provider_id === staffId ? Number(i.split_ratio ?? 100) : 100 - Number(i.split_ratio ?? 100),
  }));

  const { data: cases } = await db
    .from("lab_cases")
    .select("id, work_type, job_description, lab_fee, patient_id, start_date, created_at, status")
    .eq("org_id", orgId)
    .eq("dentist_id", staffId)
    .gt("lab_fee", 0);
  const labs: LabCharge[] = (cases || [])
    .map((c: any) => ({ ...c, date: c.start_date || String(c.created_at).slice(0, 10) }))
    .filter((c: any) => c.status !== "cancelled" && c.date >= from && c.date <= to)
    .map((c: any) => ({
      id: c.id, date: c.date, patient_id: c.patient_id,
      description: c.job_description || c.work_type || "Lab case", lab_fee: Number(c.lab_fee),
    }));
  return { produced, labs };
}

export function usePayStatement(staffId: string | undefined, contract: AssociateContract | undefined, from: string, to: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["pay-statement", orgId, staffId, from, to, contract],
    enabled: !!orgId && !!staffId && !!contract,
    queryFn: async (): Promise<PayStatement> => {
      const { produced, labs } = await loadProduction(orgId!, staffId!, from, to);
      return calculatePayStatement(contract!, produced, labs);
    },
  });
}

export function useCreatePayoutFromStatement() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (p: { staffId: string; from: string; to: string; statement: PayStatement; notes?: string }) => {
      const orgId = currentOrg?.org_id;
      const { data: payout, error } = await db
        .from("commission_payouts")
        .insert({
          org_id: orgId, staff_id: p.staffId, period_start: p.from, period_end: p.to,
          calculated_amount: p.statement.totalPayable, status: "pending", notes: p.notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (p.statement.lines.length) {
        const { error: e2 } = await db
          .from("commission_payout_items")
          .insert(p.statement.lines.map(({ attribution: _a, ...l }) => ({ ...l, payout_id: payout.id, org_id: orgId })));
        if (e2) throw e2;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commission-payouts"] }); toast.success("Payout created with itemised statement"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useMyPayouts(staffId: string | undefined) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["my-payouts", orgId, staffId],
    enabled: !!orgId && !!staffId,
    queryFn: async () => {
      const { data, error } = await db
        .from("commission_payouts")
        .select("*")
        .eq("org_id", orgId)
        .eq("staff_id", staffId)
        .order("period_start", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function usePayoutItems(payoutId: string | null) {
  return useQuery({
    queryKey: ["payout-items", payoutId],
    enabled: !!payoutId,
    queryFn: async () => {
      const { data, error } = await db
        .from("commission_payout_items")
        .select("*")
        .eq("payout_id", payoutId)
        .order("item_date", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

/** Finalize & lock: marks payouts immutable (database blocks later edits). */
export function useLockPayouts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await db.from("commission_payouts")
        .update({ locked_at: new Date().toISOString(), status: "approved" })
        .in("id", ids).is("locked_at", null).neq("status", "paid");
      if (error) throw error;
      const { error: e2 } = await db.from("commission_payouts")
        .update({ locked_at: new Date().toISOString() })
        .in("id", ids).is("locked_at", null);
      if (e2) throw e2;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commission-payouts"] }); toast.success("Pay period settled and locked"); },
    onError: (e: any) => toast.error(e.message),
  });
}
