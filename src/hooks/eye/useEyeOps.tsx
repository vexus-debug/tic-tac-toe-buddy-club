import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

const db = supabase as any;
export const todayISO = () => new Date().toISOString().slice(0, 10);

export interface EyeFrame {
  id: string; org_id: string; brand: string; model: string | null; colour: string | null; size: string | null;
  material: string | null; gender: string | null; sku: string | null; cost_price: number | null; sell_price: number | null;
  quantity: number; reorder_level: number; created_at: string;
}
export interface EyeLens {
  id: string; org_id: string; lens_type: string; lens_index: string | null; coating: string | null; power_range: string | null;
  supplier: string | null; cost_price: number | null; sell_price: number | null; quantity: number; reorder_level: number; created_at: string;
}
export interface EyeReferral {
  id: string; org_id: string; patient_id: string; direction: "in" | "out"; specialty: string | null; practitioner: string | null;
  facility: string | null; contact: string | null; reason: string | null; urgency: string; referral_date: string;
  status: string; feedback: string | null; created_at: string;
  patients?: { first_name: string; last_name: string; phone?: string | null } | null;
}

export const FLOW_STAGES = [
  { key: "check_in", label: "Check-in" },
  { key: "pre_test", label: "Pre-test" },
  { key: "doctor", label: "Doctor" },
  { key: "optical", label: "Optical" },
  { key: "pay", label: "Pay" },
] as const;
export type FlowStage = (typeof FLOW_STAGES)[number]["key"];

export const REFERRAL_SPECIALTIES = [
  "Retina specialist", "Glaucoma specialist", "Cornea specialist", "Paediatric ophthalmologist",
  "Oculoplastics", "Neuro-ophthalmology", "Low vision", "General physician", "Endocrinologist / Diabetes", "Other",
];
export const REFERRAL_STATUSES = ["sent", "received", "appointment_booked", "seen", "report_received", "closed"];
export const FRAME_MATERIALS = ["Acetate", "Metal", "Titanium", "TR90", "Rimless", "Semi-rimless", "Wood"];
export const POSTOP_CHECKLIST = [
  "Day 1 review done", "Eye shield / pad advice given", "Post-op drops dispensed", "Drop schedule explained",
  "Week 1 review done", "IOP checked post-op", "Month 1 review done", "Refraction for final glasses", "Discharged",
];

function useOrgId() {
  const { currentOrg } = useOrg();
  return currentOrg?.org_id;
}

function onDone(qc: ReturnType<typeof useQueryClient>, keys: string[], msg?: string) {
  return {
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      if (msg) toast({ title: msg });
    },
    onError: (e: any) => toast({ title: "Something went wrong", description: e.message, variant: "destructive" }),
  };
}

function useTable<T>(table: string, key: string, select = "*", order = "created_at") {
  const orgId = useOrgId();
  return useQuery({
    queryKey: [key, orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from(table).select(select).eq("org_id", orgId).order(order, { ascending: false });
      if (error) throw error;
      return (data || []) as T[];
    },
  });
}

function useUpsert(table: string, keys: string[], msg?: string) {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: any) => {
      const clean: any = { ...input };
      delete clean.patients; delete clean.created_at; delete clean.updated_at;
      if (clean.id) {
        const { id, ...rest } = clean;
        const { error } = await db.from(table).update(rest).eq("id", id);
        if (error) throw error;
        return id as string;
      }
      delete clean.id;
      const { data, error } = await db.from(table).insert({ ...clean, org_id: orgId }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    ...onDone(qc, keys, msg),
  });
}

function useDelete(table: string, keys: string[], msg: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    ...onDone(qc, keys, msg),
  });
}

/* Stock */
export const useFrames = () => useTable<EyeFrame>("eye_frames", "eye_frames", "*", "brand");
export const useSaveFrame = () => useUpsert("eye_frames", ["eye_frames"], "Frame saved");
export const useDeleteFrame = () => useDelete("eye_frames", ["eye_frames"], "Frame removed");
export const useLenses = () => useTable<EyeLens>("eye_lens_stock", "eye_lens_stock", "*", "lens_type");
export const useSaveLens = () => useUpsert("eye_lens_stock", ["eye_lens_stock"], "Lens stock saved");
export const useDeleteLens = () => useDelete("eye_lens_stock", ["eye_lens_stock"], "Lens stock removed");

export function useAdjustStock(table: "eye_frames" | "eye_lens_stock") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await db.from(table).update({ quantity: Math.max(0, quantity) }).eq("id", id);
      if (error) throw error;
    },
    ...onDone(qc, [table]),
  });
}

/* Referrals */
export const useReferrals = () =>
  useTable<EyeReferral>("eye_referrals", "eye_referrals", "*, patients(first_name, last_name, phone)", "referral_date");
export const useSaveReferral = () => useUpsert("eye_referrals", ["eye_referrals"], "Referral saved");
export const useDeleteReferral = () => useDelete("eye_referrals", ["eye_referrals"], "Referral deleted");

/* Patient flow (today's queue) */
export interface FlowEntry {
  id: string; patient_id: string; stage: FlowStage; status: string; check_in_time: string; notes: string | null;
  patients?: { first_name: string; last_name: string; phone: string | null } | null;
}

export function useTodayFlow() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["eye_flow", orgId, todayISO()],
    enabled: !!orgId,
    refetchInterval: 30000,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data, error } = await db.from("waiting_list")
        .select("id, patient_id, stage, status, check_in_time, notes, patients(first_name, last_name, phone)")
        .eq("org_id", orgId).gte("check_in_time", start.toISOString()).order("check_in_time");
      if (error) throw error;
      return (data || []) as FlowEntry[];
    },
  });
}

export function useCheckInPatient() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async ({ patient_id, notes }: { patient_id: string; notes?: string }) => {
      const { error } = await db.from("waiting_list").insert({
        org_id: orgId, patient_id, status: "waiting", stage: "check_in", notes: notes || null,
        check_in_time: new Date().toISOString(),
      });
      if (error) throw error;
    },
    ...onDone(qc, ["eye_flow", "waiting_list"], "Patient checked in"),
  });
}

export function useMoveFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage, done }: { id: string; stage?: FlowStage; done?: boolean }) => {
      const patch: any = {};
      if (stage) {
        patch.stage = stage;
        patch.status = stage === "check_in" ? "waiting" : "in_progress";
        if (stage !== "check_in") patch.seen_time = new Date().toISOString();
      }
      if (done) { patch.status = "completed"; patch.completed_time = new Date().toISOString(); }
      const { error } = await db.from("waiting_list").update(patch).eq("id", id);
      if (error) throw error;
    },
    ...onDone(qc, ["eye_flow", "waiting_list"]),
  });
}

/* Unpaid bills */
export function useUnpaidInvoices() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["eye_unpaid_invoices", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("invoices")
        .select("id, invoice_number, total, status, invoice_date, patient_id, patients(first_name, last_name, phone)")
        .eq("org_id", orgId).in("status", ["pending", "unpaid", "overdue", "partial", "draft", "sent"])
        .order("invoice_date", { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, method }: { id: string; method: string }) => {
      const { error } = await db.from("invoices").update({ status: "paid", payment_method: method }).eq("id", id);
      if (error) throw error;
    },
    ...onDone(qc, ["eye_unpaid_invoices", "invoices"], "Bill marked as paid"),
  });
}

/* Create a bill with line items */
export function useCreateBill() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async ({ patient_id, items, notes }: {
      patient_id: string; notes?: string;
      items: { description: string; quantity: number; unit_price: number }[];
    }) => {
      const lines = items.filter((i) => i.description && i.unit_price > 0);
      const subtotal = lines.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const { data, error } = await db.from("invoices").insert({
        org_id: orgId, patient_id, invoice_number: `INV-${Date.now()}`, invoice_date: todayISO(),
        subtotal, tax: 0, discount: 0, total: subtotal, status: "pending", notes: notes || null,
      }).select("id").single();
      if (error) throw error;
      if (lines.length) {
        const { error: e2 } = await db.from("invoice_items").insert(lines.map((l) => ({
          invoice_id: data.id, description: l.description, quantity: l.quantity, unit_price: l.unit_price,
          line_total: l.quantity * l.unit_price,
        })));
        if (e2) throw e2;
      }
      return data.id as string;
    },
    ...onDone(qc, ["eye_unpaid_invoices", "invoices"]),
  });
}

/* Glasses pickup */
export function usePickupOrders() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["optical_orders", orgId, "pickup"],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("optical_orders")
        .select("*, patients(first_name, last_name, phone)")
        .eq("org_id", orgId).in("status", ["ordered", "at_lab", "ready"])
        .order("promised_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: any) => {
      const { error } = await db.from("optical_orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    ...onDone(qc, ["optical_orders"]),
  });
}

/* Quick patient search (phone or name) */
export function usePatientSearch(term: string) {
  const orgId = useOrgId();
  const t = term.trim();
  return useQuery({
    queryKey: ["patient_quick_search", orgId, t],
    enabled: !!orgId && t.length >= 2,
    queryFn: async () => {
      const digits = t.replace(/\D/g, "");
      const like = `%${t}%`;
      const ors = [`first_name.ilike.${like}`, `last_name.ilike.${like}`, `phone.ilike.${like}`, `email.ilike.${like}`];
      if (digits.length >= 3) ors.push(`phone.ilike.%${digits.slice(-7)}%`);
      const { data, error } = await db.from("patients").select("id, first_name, last_name, phone")
        .eq("org_id", orgId).or(ors.join(",")).limit(8);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

/* Messaging helpers — open WhatsApp / SMS on this device with a ready-made message */
export function normalisePhone(phone?: string | null) {
  if (!phone) return "";
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) return p.slice(1);
  if (p.startsWith("0")) p = "234" + p.slice(1); // default: Nigeria
  return p;
}
export const whatsappLink = (phone: string | null | undefined, text: string) =>
  `https://wa.me/${normalisePhone(phone)}?text=${encodeURIComponent(text)}`;
export const smsLink = (phone: string | null | undefined, text: string) =>
  `sms:${phone ? "+" + normalisePhone(phone) : ""}?body=${encodeURIComponent(text)}`;
