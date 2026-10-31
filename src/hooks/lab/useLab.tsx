import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

const db = supabase as any;

export interface TestCategory {
  id: string; org_id: string; name: string; sort_order: number; is_active: boolean;
}
export interface LabTest {
  id: string; org_id: string; category_id: string | null; name: string; unit: string | null;
  reference_range: string | null; input_type: string; options: any; price: number;
  sort_order: number; is_active: boolean;
}
export interface TestForm {
  id: string; org_id: string; serial: string; patient_id: string | null; patient_name: string;
  patient_age: string | null; patient_sex: string | null; patient_phone: string | null;
  referring_doctor: string | null; referring_institution: string | null; specimen: string | null;
  billing_type: string; billing_entity: string | null; clinical_notes: string | null;
  status: string; is_locked: boolean; assigned_to: string | null; invoice_id: string | null;
  total_amount: number; collected_at: string; completed_at: string | null; approved_at: string | null;
  approved_by: string | null; created_at: string; created_by: string | null;
}
export interface TestFormItem {
  id: string; form_id: string; test_id: string | null; test_name: string;
  category_name: string | null; price: number; sort_order: number;
}
export interface TestResult {
  id: string; form_id: string; item_id: string | null; test_name: string;
  values: Record<string, any>; comment: string | null; entered_by: string | null; updated_at: string;
}

/* ── Categories & tests ── */

export function useTestCategories() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["test_categories", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("test_categories").select("*").eq("org_id", orgId).order("sort_order");
      if (error) throw error;
      return (data || []) as TestCategory[];
    },
  });
}

export function useLabTests() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["lab_tests", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("lab_tests").select("*").eq("org_id", orgId).order("sort_order");
      if (error) throw error;
      return (data || []) as LabTest[];
    },
  });
}

function mutationToast(qc: ReturnType<typeof useQueryClient>, keys: string[], msg: string) {
  return {
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast({ title: msg });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  };
}

export function useSaveCategory() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: Partial<TestCategory>) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await db.from("test_categories").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await db.from("test_categories").insert({ ...input, org_id: currentOrg?.org_id });
        if (error) throw error;
      }
    },
    ...mutationToast(qc, ["test_categories"], "Category saved"),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("test_categories").delete().eq("id", id);
      if (error) throw error;
    },
    ...mutationToast(qc, ["test_categories", "lab_tests"], "Category deleted"),
  });
}

export function useSaveTest() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: Partial<LabTest>) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await db.from("lab_tests").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await db.from("lab_tests").insert({ ...input, org_id: currentOrg?.org_id });
        if (error) throw error;
      }
    },
    ...mutationToast(qc, ["lab_tests"], "Test saved"),
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("lab_tests").delete().eq("id", id);
      if (error) throw error;
    },
    ...mutationToast(qc, ["lab_tests"], "Test deleted"),
  });
}

export function useSeedLabMenu() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (menu: { name: string; tests: { name: string; unit?: string; reference_range?: string; price?: number }[] }[]) => {
      const orgId = currentOrg?.org_id;
      for (let ci = 0; ci < menu.length; ci++) {
        const cat = menu[ci];
        const { data: created, error } = await db
          .from("test_categories")
          .insert({ org_id: orgId, name: cat.name, sort_order: ci })
          .select("id")
          .single();
        if (error) throw error;
        const rows = cat.tests.map((t, ti) => ({
          org_id: orgId, category_id: created.id, name: t.name, unit: t.unit || null,
          reference_range: t.reference_range || null, price: t.price || 0, sort_order: ti,
        }));
        const { error: e2 } = await db.from("lab_tests").insert(rows);
        if (e2) throw e2;
      }
    },
    ...mutationToast(qc, ["test_categories", "lab_tests"], "Test menu imported"),
  });
}

/* ── Forms ── */

export function useTestForms(status?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["test_forms", orgId, status || "all"],
    enabled: !!orgId,
    queryFn: async () => {
      let q = db.from("test_forms").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as TestForm[];
    },
  });
}

export function useTestFormBySerial(serial?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["test_form", orgId, serial],
    enabled: !!orgId && !!serial,
    queryFn: async () => {
      const { data, error } = await db
        .from("test_forms").select("*").eq("org_id", orgId).eq("serial", serial).maybeSingle();
      if (error) throw error;
      return data as TestForm | null;
    },
  });
}

export function useFormItems(formId?: string) {
  return useQuery({
    queryKey: ["test_form_items", formId],
    enabled: !!formId,
    queryFn: async () => {
      const { data, error } = await db.from("test_form_items").select("*").eq("form_id", formId).order("sort_order");
      if (error) throw error;
      return (data || []) as TestFormItem[];
    },
  });
}

export function useFormResults(formId?: string) {
  return useQuery({
    queryKey: ["test_results", formId],
    enabled: !!formId,
    queryFn: async () => {
      const { data, error } = await db.from("test_results").select("*").eq("form_id", formId);
      if (error) throw error;
      return (data || []) as TestResult[];
    },
  });
}

export function useCreateTestForm() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      form: Partial<TestForm>;
      items: { test_id?: string | null; test_name: string; category_name?: string | null; price: number }[];
      createInvoice?: boolean;
    }) => {
      const orgId = currentOrg?.org_id;
      const { data: settings } = await db.from("lab_settings").select("serial_prefix").eq("org_id", orgId).maybeSingle();
      const prefix = settings?.serial_prefix || "MV";
      const { data: serial, error: serialErr } = await db.rpc("next_lab_serial", {
        _org_id: orgId, _kind: "test_form", _prefix: prefix,
      });
      if (serialErr) throw serialErr;

      const total = input.items.reduce((s, i) => s + Number(i.price || 0), 0);
      const { data: user } = await supabase.auth.getUser();

      let invoiceId: string | null = null;
      if (input.createInvoice && total > 0) {
        const { data: inv, error: invErr } = await db.from("invoices").insert({
          org_id: orgId,
          patient_id: input.form.patient_id || null,
          invoice_number: serial,
          subtotal: total, total, status: "unpaid",
          notes: `Laboratory tests — ${serial}`,
        }).select("id").single();
        if (!invErr) {
          invoiceId = inv.id;
          await db.from("invoice_items").insert(
            input.items.map((i) => ({
              org_id: orgId, invoice_id: inv.id, description: i.test_name,
              quantity: 1, unit_price: i.price, total: i.price,
            }))
          );
        }
      }

      const { data: form, error } = await db.from("test_forms").insert({
        ...input.form, org_id: orgId, serial, total_amount: total,
        invoice_id: invoiceId, created_by: user?.user?.id || null, status: "pending",
      }).select("*").single();
      if (error) throw error;

      const { error: itemErr } = await db.from("test_form_items").insert(
        input.items.map((i, idx) => ({
          org_id: orgId, form_id: form.id, test_id: i.test_id || null,
          test_name: i.test_name, category_name: i.category_name || null,
          price: i.price || 0, sort_order: idx,
        }))
      );
      if (itemErr) throw itemErr;

      await db.from("result_audit_log").insert({
        org_id: orgId, form_id: form.id, serial, action: "created",
        actor_id: user?.user?.id || null, details: { items: input.items.length },
      });

      return form as TestForm;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test_forms"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Test form created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useSaveResults() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      form: TestForm;
      results: { item_id: string; test_name: string; values: Record<string, any>; comment?: string }[];
      status: "processing" | "completed";
    }) => {
      const orgId = currentOrg?.org_id;
      const { data: user } = await supabase.auth.getUser();
      const uid = user?.user?.id || null;

      for (const r of input.results) {
        const { data: existing } = await db
          .from("test_results").select("id").eq("form_id", input.form.id).eq("item_id", r.item_id).maybeSingle();
        const payload = {
          org_id: orgId, form_id: input.form.id, item_id: r.item_id, test_name: r.test_name,
          values: r.values, comment: r.comment || null, entered_by: uid,
        };
        if (existing) {
          const { error } = await db.from("test_results").update(payload).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await db.from("test_results").insert(payload);
          if (error) throw error;
        }
      }

      const update: any = { status: input.status, assigned_to: input.form.assigned_to || uid };
      if (input.status === "completed") update.completed_at = new Date().toISOString();
      const { error: fErr } = await db.from("test_forms").update(update).eq("id", input.form.id);
      if (fErr) throw fErr;

      await db.from("result_audit_log").insert({
        org_id: orgId, form_id: input.form.id, serial: input.form.serial,
        action: input.status === "completed" ? "completed" : "draft_saved", actor_id: uid, details: {},
      });
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["test_results"] });
      qc.invalidateQueries({ queryKey: ["test_forms"] });
      qc.invalidateQueries({ queryKey: ["test_form"] });
      toast({ title: v.status === "completed" ? "Marked completed" : "Draft saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useFormAdminAction() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: { form: TestForm; action: "approve" | "reopen" | "delete"; reason?: string }) => {
      const orgId = currentOrg?.org_id;
      const { data: user } = await supabase.auth.getUser();
      const uid = user?.user?.id || null;

      if (input.action === "approve") {
        const { error } = await db.from("test_forms").update({
          status: "approved", is_locked: true, approved_at: new Date().toISOString(), approved_by: uid,
        }).eq("id", input.form.id);
        if (error) throw error;
      } else if (input.action === "reopen") {
        const { error } = await db.from("test_forms").update({
          status: "processing", is_locked: false, approved_at: null, approved_by: null, completed_at: null,
        }).eq("id", input.form.id);
        if (error) throw error;
      }

      await db.from("result_audit_log").insert({
        org_id: orgId, form_id: input.action === "delete" ? null : input.form.id,
        serial: input.form.serial, action: input.action, actor_id: uid,
        reason: input.reason || null, details: { patient: input.form.patient_name },
      });

      if (input.action === "delete") {
        const { error } = await db.from("test_forms").delete().eq("id", input.form.id);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["test_forms"] });
      qc.invalidateQueries({ queryKey: ["test_form"] });
      qc.invalidateQueries({ queryKey: ["result_audit_log"] });
      toast({ title: `Form ${v.action === "approve" ? "approved" : v.action === "reopen" ? "reopened" : "deleted"}` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useResultAuditLog(formId?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["result_audit_log", orgId, formId || "all"],
    enabled: !!orgId,
    queryFn: async () => {
      let q = db.from("result_audit_log").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(200);
      if (formId) q = q.eq("form_id", formId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useLabSettings() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["lab_settings", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("lab_settings").select("*").eq("org_id", orgId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveLabSettings() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: any) => {
      const orgId = currentOrg?.org_id;
      const { data: existing } = await db.from("lab_settings").select("id").eq("org_id", orgId).maybeSingle();
      if (existing) {
        const { error } = await db.from("lab_settings").update(input).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from("lab_settings").insert({ ...input, org_id: orgId });
        if (error) throw error;
      }
    },
    ...mutationToast(qc, ["lab_settings"], "Settings saved"),
  });
}

/* ── Realtime ── */

export function useRealtimeTestForms() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`test_forms_${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "test_forms" }, () => {
        qc.invalidateQueries({ queryKey: ["test_forms"] });
        qc.invalidateQueries({ queryKey: ["test_form"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId, qc]);
}

/* ── Search across results ── */

export function useResultsSearch(term: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["results_search", orgId, term],
    enabled: !!orgId && term.trim().length > 1,
    queryFn: async () => {
      const t = `%${term.trim()}%`;
      const { data: forms, error } = await db
        .from("test_forms")
        .select("*")
        .eq("org_id", orgId)
        .in("status", ["processing", "completed", "approved"])
        .or(`serial.ilike.${t},patient_name.ilike.${t}`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const { data: byTest } = await db
        .from("test_results")
        .select("form_id, test_name, values")
        .eq("org_id", orgId)
        .ilike("test_name", t)
        .limit(50);

      const extraIds = (byTest || []).map((r: any) => r.form_id).filter((id: string) => !(forms || []).some((f: any) => f.id === id));
      let extra: any[] = [];
      if (extraIds.length) {
        const { data } = await db.from("test_forms").select("*").in("id", extraIds);
        extra = data || [];
      }
      const all = [...(forms || []), ...extra];
      const { data: results } = await db
        .from("test_results").select("form_id, test_name, values").in("form_id", all.map((f: any) => f.id).slice(0, 60));
      return all.map((f: any) => ({ ...f, results: (results || []).filter((r: any) => r.form_id === f.id) }));
    },
  });
}
