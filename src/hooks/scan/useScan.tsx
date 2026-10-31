import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

const db = supabase as any;

export interface ScanPatient {
  id: string; org_id: string; mrn: string; full_name: string; age: string | null;
  sex: string | null; phone: string | null; email: string | null; address: string | null;
  notes: string | null; created_at: string;
}

export interface Scan {
  id: string; org_id: string; serial: string; scan_patient_id: string | null;
  modality: string; body_part: string | null; clinical_indication: string | null;
  referring_doctor: string | null; is_urgent: boolean; status: string; price: number;
  findings: string | null; impression: string | null; recommendation: string | null;
  reported_at: string | null; reported_by: string | null;
  approved_at: string | null; approved_by: string | null;
  invoice_id: string | null; created_at: string;
}

export const MODALITIES = ["X-Ray", "Ultrasound", "CT Scan", "MRI", "Mammography", "Fluoroscopy", "ECG", "Echocardiography"];
export const SCAN_STATUSES = ["scheduled", "in_progress", "reported", "approved"];

function toasts(qc: ReturnType<typeof useQueryClient>, keys: string[], msg: string) {
  return {
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast({ title: msg });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  };
}

async function logScan(orgId?: string, scanId?: string | null, serial?: string | null, action?: string, details: any = {}) {
  const { data: user } = await supabase.auth.getUser();
  await db.from("scan_activity_log").insert({
    org_id: orgId, scan_id: scanId || null, serial: serial || null,
    action, actor_id: user?.user?.id || null, details,
  });
}

/* ── Patients ── */

export function useScanPatients(search?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["scan_patients", orgId, search || ""],
    enabled: !!orgId,
    queryFn: async () => {
      let q = db.from("scan_patients").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
      if (search && search.trim().length > 1) {
        const t = `%${search.trim()}%`;
        q = q.or(`full_name.ilike.${t},mrn.ilike.${t},phone.ilike.${t}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ScanPatient[];
    },
  });
}

export function useScanPatient(id?: string) {
  return useQuery({
    queryKey: ["scan_patient", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from("scan_patients").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as ScanPatient | null;
    },
  });
}

export function useSaveScanPatient() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: Partial<ScanPatient>) => {
      const orgId = currentOrg?.org_id;
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await db.from("scan_patients").update(rest).eq("id", id);
        if (error) throw error;
        return input.id;
      }
      const { data: mrn, error: mrnErr } = await db.rpc("next_lab_serial", {
        _org_id: orgId, _kind: "mrn", _prefix: "MRN",
      });
      if (mrnErr) throw mrnErr;
      const { data, error } = await db.from("scan_patients")
        .insert({ ...input, org_id: orgId, mrn }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    ...toasts(qc, ["scan_patients"], "Patient saved"),
  });
}

/* ── Scans ── */

export function useScans(opts?: { status?: string; patientId?: string }) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["scans", orgId, opts?.status || "all", opts?.patientId || "all"],
    enabled: !!orgId,
    queryFn: async () => {
      let q = db.from("scans")
        .select("*, scan_patients(full_name, mrn, age, sex)")
        .eq("org_id", orgId).order("created_at", { ascending: false });
      if (opts?.status) q = q.eq("status", opts.status);
      if (opts?.patientId) q = q.eq("scan_patient_id", opts.patientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useCreateScan() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: { scan: Partial<Scan>; createInvoice?: boolean; patientName?: string }) => {
      const orgId = currentOrg?.org_id;
      const { data: user } = await supabase.auth.getUser();
      const { data: serial, error: serialErr } = await db.rpc("next_lab_serial", {
        _org_id: orgId, _kind: "scan", _prefix: "SC",
      });
      if (serialErr) throw serialErr;

      let invoiceId: string | null = null;
      const price = Number(input.scan.price || 0);
      if (input.createInvoice && price > 0) {
        const { data: inv, error: invErr } = await db.from("invoices").insert({
          org_id: orgId, invoice_number: serial, subtotal: price, total: price,
          status: "unpaid", notes: `Imaging — ${serial}`,
        }).select("id").single();
        if (!invErr) {
          invoiceId = inv.id;
          await db.from("invoice_items").insert({
            org_id: orgId, invoice_id: inv.id,
            description: `${input.scan.modality} ${input.scan.body_part || ""}`.trim(),
            quantity: 1, unit_price: price, total: price,
          });
        }
      }

      const { data, error } = await db.from("scans").insert({
        ...input.scan, org_id: orgId, serial, invoice_id: invoiceId,
        created_by: user?.user?.id || null, status: input.scan.status || "scheduled",
      }).select("*").single();
      if (error) throw error;
      await logScan(orgId, data.id, serial, "registered", { modality: data.modality });
      return data as Scan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scans"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Scan registered" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateScan() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: { scan: Scan; patch: Partial<Scan>; action?: string }) => {
      const orgId = currentOrg?.org_id;
      const { data: user } = await supabase.auth.getUser();
      const uid = user?.user?.id || null;
      const patch: any = { ...input.patch };
      if (patch.status === "reported") { patch.reported_at = new Date().toISOString(); patch.reported_by = uid; }
      if (patch.status === "approved") { patch.approved_at = new Date().toISOString(); patch.approved_by = uid; }
      const { error } = await db.from("scans").update(patch).eq("id", input.scan.id);
      if (error) throw error;
      await logScan(orgId, input.scan.id, input.scan.serial, input.action || "updated", patch.status ? { status: patch.status } : {});
    },
    ...toasts(qc, ["scans", "scan_activity_log"], "Scan updated"),
  });
}

export function useDeleteScan() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (scan: Scan) => {
      await logScan(currentOrg?.org_id, null, scan.serial, "deleted", {});
      const { error } = await db.from("scans").delete().eq("id", scan.id);
      if (error) throw error;
    },
    ...toasts(qc, ["scans", "scan_activity_log"], "Scan deleted"),
  });
}

/* ── Images ── */

export function useScanImages(scanId?: string) {
  return useQuery({
    queryKey: ["scan_images", scanId],
    enabled: !!scanId,
    queryFn: async () => {
      const { data, error } = await db.from("scan_images").select("*").eq("scan_id", scanId).order("created_at");
      if (error) throw error;
      const withUrls = await Promise.all(
        (data || []).map(async (img: any) => {
          const { data: signed } = await supabase.storage.from("scan-images").createSignedUrl(img.storage_path, 3600);
          return { ...img, url: signed?.signedUrl || null };
        })
      );
      return withUrls;
    },
  });
}

export function useUploadScanImage() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: { scanId: string; file: File; caption?: string }) => {
      const orgId = currentOrg?.org_id;
      const { data: user } = await supabase.auth.getUser();
      const path = `${orgId}/${input.scanId}/${Date.now()}-${input.file.name}`;
      const { error: upErr } = await supabase.storage.from("scan-images").upload(path, input.file);
      if (upErr) throw upErr;
      const { error } = await db.from("scan_images").insert({
        org_id: orgId, scan_id: input.scanId, storage_path: path,
        caption: input.caption || null, uploaded_by: user?.user?.id || null,
      });
      if (error) throw error;
    },
    ...toasts(qc, ["scan_images"], "Image uploaded"),
  });
}

/* ── Appointments ── */

export function useScanAppointments() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["scan_appointments", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("scan_appointments").select("*").eq("org_id", orgId).order("scheduled_at");
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useSaveScanAppointment() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: any) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await db.from("scan_appointments").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await db.from("scan_appointments").insert({ ...input, org_id: currentOrg?.org_id });
        if (error) throw error;
      }
    },
    ...toasts(qc, ["scan_appointments"], "Appointment saved"),
  });
}

export function useDeleteScanAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("scan_appointments").delete().eq("id", id);
      if (error) throw error;
    },
    ...toasts(qc, ["scan_appointments"], "Appointment removed"),
  });
}

/* ── Activity log ── */

export function useScanActivity() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["scan_activity_log", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db.from("scan_activity_log").select("*")
        .eq("org_id", orgId).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRealtimeScans() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`scans_${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "scans" }, () => {
        qc.invalidateQueries({ queryKey: ["scans"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId, qc]);
}
