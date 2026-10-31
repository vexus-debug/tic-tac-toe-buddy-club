import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { toast } from "@/hooks/use-toast";

const db = supabase as any;

/* ── Shared types ── */

export interface EyeExam {
  id: string; org_id: string; patient_id: string; appointment_id: string | null;
  exam_date: string; examiner_id: string | null; chief_complaint: string | null;
  va_unaided_od: string | null; va_unaided_os: string | null;
  va_aided_od: string | null; va_aided_os: string | null;
  va_pinhole_od: string | null; va_pinhole_os: string | null;
  iop_od: number | null; iop_os: number | null; iop_method: string | null;
  pupils_od: string | null; pupils_os: string | null;
  anterior_segment_od: string | null; anterior_segment_os: string | null;
  fundus_od: string | null; fundus_os: string | null;
  cd_ratio_od: number | null; cd_ratio_os: number | null;
  dilated: boolean | null; diagnosis: string | null; plan: string | null; notes: string | null;
  created_at: string;
  patients?: { first_name: string; last_name: string; phone?: string | null } | null;
}

export interface OpticalPrescription {
  id: string; org_id: string; patient_id: string; eye_exam_id: string | null;
  prescriber_id: string | null; rx_type: string | null; issue_date: string; expiry_date: string | null;
  sphere_od: number | null; cylinder_od: number | null; axis_od: number | null; add_od: number | null; prism_od: string | null;
  sphere_os: number | null; cylinder_os: number | null; axis_os: number | null; add_os: number | null; prism_os: string | null;
  pd: number | null; base_curve: number | null; diameter: number | null; lens_brand: string | null;
  notes: string | null; created_at: string;
  patients?: { first_name: string; last_name: string; phone?: string | null } | null;
}

export interface ContactLensFitting {
  id: string; org_id: string; patient_id: string; fitter_id: string | null;
  fitting_date: string; lens_brand: string | null; lens_type: string | null; modality: string | null;
  base_curve: number | null; diameter: number | null; power_od: number | null; power_os: number | null;
  fit_assessment: string | null; aftercare_date: string | null; status: string;
  notes: string | null; created_at: string;
  patients?: { first_name: string; last_name: string } | null;
}

export interface OpticalOrder {
  id: string; org_id: string; patient_id: string; prescription_id: string | null;
  order_number: string | null; frame_brand: string | null; frame_model: string | null; frame_price: number | null;
  lens_type: string | null; lens_coatings: string | null; lens_price: number | null; lab_name: string | null;
  order_date: string; promised_date: string | null; delivered_date: string | null;
  total_amount: number | null; amount_paid: number | null; status: string; notes: string | null;
  created_at: string;
  patients?: { first_name: string; last_name: string } | null;
}

export interface EyeDiagnostic {
  id: string; org_id: string; patient_id: string; eye_exam_id: string | null;
  study_type: string; eye: string; study_date: string; findings: string | null;
  file_url: string | null; file_name: string | null; performed_by: string | null; created_at: string;
  patients?: { first_name: string; last_name: string } | null;
}

export interface SurgeryBooking {
  id: string; org_id: string; patient_id: string; surgeon_id: string | null;
  procedure_name: string; eye: string; scheduled_date: string; scheduled_time: string | null;
  theatre: string | null; iol_model: string | null; iol_power: number | null;
  biometry_notes: string | null; preop_checklist: any; consent_signed: boolean | null;
  status: string; outcome_notes: string | null; created_at: string;
  patients?: { first_name: string; last_name: string } | null;
}

/* ── Reference data ── */

export const EYE_SIDES = ["right", "left", "both"];
export const IOP_METHODS = ["Goldmann applanation", "Non-contact (air puff)", "iCare rebound", "Perkins", "Tono-Pen"];
export const RX_TYPES = ["Distance", "Reading", "Bifocal", "Progressive", "Computer", "Contact Lens"];
export const LENS_TYPES = ["Single Vision", "Bifocal", "Progressive", "Photochromic", "High Index", "Blue-light Filter", "Polarised"];
export const LENS_COATINGS = ["Anti-reflective", "Scratch resistant", "UV protection", "Blue-light block", "Hydrophobic"];
export const CL_MODALITIES = ["Daily disposable", "Two-weekly", "Monthly", "Quarterly", "Yearly / RGP"];
export const CL_TYPES = ["Soft spherical", "Soft toric", "Multifocal", "RGP", "Scleral", "Ortho-K", "Therapeutic bandage"];
export const CL_STATUSES = ["trial", "dispensed", "aftercare", "discontinued"];
export const OPTICAL_ORDER_STATUSES = ["ordered", "at_lab", "ready", "collected", "cancelled"];
export const DIAGNOSTIC_STUDIES = [
  "OCT — Macula", "OCT — Optic Nerve (RNFL)", "Visual Field (Humphrey)", "Fundus Photography",
  "Fluorescein Angiography", "Corneal Topography", "Pachymetry", "Biometry (IOL Master)",
  "B-Scan Ultrasound", "Specular Microscopy", "Anterior Segment Photography",
];
export const EYE_PROCEDURES = [
  "Phacoemulsification + IOL", "ECCE + IOL", "SICS + IOL", "YAG Capsulotomy", "YAG Peripheral Iridotomy",
  "Trabeculectomy", "Glaucoma Drainage Implant", "Pterygium Excision + Graft", "Chalazion Incision & Curettage",
  "Intravitreal Injection (Anti-VEGF)", "Pan-Retinal Photocoagulation", "Focal Laser", "Vitrectomy",
  "Squint (Strabismus) Surgery", "Dacryocystorhinostomy (DCR)", "Ptosis Repair", "Corneal Transplant (PK/DSAEK)",
];
export const SURGERY_STATUSES = ["booked", "confirmed", "completed", "cancelled", "postponed"];
export const PREOP_CHECKLIST = [
  "Consent signed", "Biometry done", "Blood pressure checked", "Blood sugar checked",
  "Fasting confirmed", "Pupil dilated", "Antibiotic drops started", "Anaesthetic review", "IOL available",
];

/* ── helpers ── */

function toasts(qc: ReturnType<typeof useQueryClient>, keys: string[], msg: string) {
  return {
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast({ title: msg });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  };
}

function useList<T>(table: string, key: string, patientId?: string, orderCol = "created_at") {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: [key, orgId, patientId || "all"],
    enabled: !!orgId,
    queryFn: async () => {
      let q = db.from(table).select("*, patients(first_name, last_name, phone)").eq("org_id", orgId)
        .order(orderCol, { ascending: false });
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as T[];
    },
  });
}

function useSave(table: string, key: string, msg: string) {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async (input: any) => {
      const clean: any = { ...input };
      delete clean.patients;
      delete clean.created_at;
      delete clean.updated_at;
      if (clean.id) {
        const { id, ...rest } = clean;
        const { error } = await db.from(table).update(rest).eq("id", id);
        if (error) throw error;
        return id as string;
      }
      const { data, error } = await db.from(table)
        .insert({ ...clean, org_id: currentOrg?.org_id }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    ...toasts(qc, [key], msg),
  });
}

function useRemove(table: string, key: string, msg: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    ...toasts(qc, [key], msg),
  });
}

/* ── Eye exams ── */
export const useEyeExams = (patientId?: string) => useList<EyeExam>("eye_exams", "eye_exams", patientId, "exam_date");
export const useSaveEyeExam = () => useSave("eye_exams", "eye_exams", "Eye exam saved");
export const useDeleteEyeExam = () => useRemove("eye_exams", "eye_exams", "Eye exam deleted");

/* ── Optical prescriptions ── */
export const useOpticalPrescriptions = (patientId?: string) =>
  useList<OpticalPrescription>("optical_prescriptions", "optical_prescriptions", patientId, "issue_date");
export const useSaveOpticalPrescription = () => useSave("optical_prescriptions", "optical_prescriptions", "Prescription saved");
export const useDeleteOpticalPrescription = () => useRemove("optical_prescriptions", "optical_prescriptions", "Prescription deleted");

/* ── Contact lens fittings ── */
export const useContactLensFittings = (patientId?: string) =>
  useList<ContactLensFitting>("contact_lens_fittings", "contact_lens_fittings", patientId, "fitting_date");
export const useSaveContactLensFitting = () => useSave("contact_lens_fittings", "contact_lens_fittings", "Fitting saved");
export const useDeleteContactLensFitting = () => useRemove("contact_lens_fittings", "contact_lens_fittings", "Fitting deleted");

/* ── Optical orders ── */
export const useOpticalOrders = (patientId?: string) =>
  useList<OpticalOrder>("optical_orders", "optical_orders", patientId, "order_date");
export const useSaveOpticalOrder = () => useSave("optical_orders", "optical_orders", "Order saved");
export const useDeleteOpticalOrder = () => useRemove("optical_orders", "optical_orders", "Order deleted");

/* ── Eye diagnostics ── */
export const useEyeDiagnostics = (patientId?: string) =>
  useList<EyeDiagnostic>("eye_diagnostics", "eye_diagnostics", patientId, "study_date");
export const useSaveEyeDiagnostic = () => useSave("eye_diagnostics", "eye_diagnostics", "Study saved");
export const useDeleteEyeDiagnostic = () => useRemove("eye_diagnostics", "eye_diagnostics", "Study deleted");

/* ── Surgery bookings ── */
export const useSurgeryBookings = (patientId?: string) =>
  useList<SurgeryBooking>("surgery_bookings", "surgery_bookings", patientId, "scheduled_date");
export const useSaveSurgeryBooking = () => useSave("surgery_bookings", "surgery_bookings", "Surgery booking saved");
export const useDeleteSurgeryBooking = () => useRemove("surgery_bookings", "surgery_bookings", "Surgery booking deleted");

/* ── Patient picker ── */
export function useEyePatients(search?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.org_id;
  return useQuery({
    queryKey: ["eye_patient_options", orgId, search || ""],
    enabled: !!orgId,
    queryFn: async () => {
      let q = db.from("patients").select("id, first_name, last_name, phone, date_of_birth")
        .eq("org_id", orgId).order("first_name").limit(200);
      if (search && search.trim().length > 1) {
        const t = `%${search.trim()}%`;
        q = q.or(`first_name.ilike.${t},last_name.ilike.${t},phone.ilike.${t}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

/* ── Formatting helpers ── */

export const patientName = (r: { patients?: { first_name: string; last_name: string } | null }) =>
  r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : "Unknown patient";

export function formatRxEye(sph: number | null, cyl: number | null, axis: number | null, add: number | null) {
  const s = (n: number | null) => (n === null || n === undefined ? "—" : `${n > 0 ? "+" : ""}${Number(n).toFixed(2)}`);
  let out = s(sph);
  if (cyl !== null && cyl !== undefined) out += ` / ${s(cyl)} x ${axis ?? "—"}°`;
  if (add !== null && add !== undefined) out += ` Add ${s(add)}`;
  return out;
}

export const iopFlag = (v: number | null | undefined) =>
  v === null || v === undefined ? null : v > 21 ? "high" : v < 8 ? "low" : "normal";
