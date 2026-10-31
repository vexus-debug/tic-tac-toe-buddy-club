
-- =====================================================
-- VISTA DENTAL CLINIC — FULL FEATURE EXPANSION MIGRATION
-- =====================================================

-- 1. CLINICAL NOTES (SOAP Notes)
CREATE TABLE public.clinical_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  subjective TEXT DEFAULT '',
  objective TEXT DEFAULT '',
  assessment TEXT DEFAULT '',
  plan TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clinical_notes" ON public.clinical_notes FOR SELECT USING (true);
CREATE POLICY "Clinical staff can insert clinical_notes" ON public.clinical_notes FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role) OR has_role(auth.uid(), 'hygienist'::app_role)
);
CREATE POLICY "Clinical staff can update clinical_notes" ON public.clinical_notes FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role) OR has_role(auth.uid(), 'hygienist'::app_role)
);
CREATE POLICY "Admins can delete clinical_notes" ON public.clinical_notes FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON public.clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. PATIENT IMAGES
CREATE TABLE public.patient_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'other', -- x-ray, intra-oral, other
  tooth_number INTEGER,
  description TEXT DEFAULT '',
  date_taken DATE DEFAULT CURRENT_DATE,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read patient_images" ON public.patient_images FOR SELECT USING (true);
CREATE POLICY "Clinical staff can insert patient_images" ON public.patient_images FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role) OR has_role(auth.uid(), 'hygienist'::app_role)
);
CREATE POLICY "Admins can delete patient_images" ON public.patient_images FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for patient images
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-images', 'patient-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload patient images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patient-images' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view patient images" ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-images');
CREATE POLICY "Admins can delete patient images" ON storage.objects FOR DELETE
  USING (bucket_id = 'patient-images' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));

-- 3. PATIENT REVIEWS
CREATE TABLE public.patient_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  dentist_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT DEFAULT '',
  service_categories TEXT[] DEFAULT '{}',
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read patient_reviews" ON public.patient_reviews FOR SELECT USING (true);
CREATE POLICY "Staff can insert patient_reviews" ON public.patient_reviews FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'receptionist'::app_role) OR has_role(auth.uid(), 'dentist'::app_role)
);
CREATE POLICY "Admins can delete patient_reviews" ON public.patient_reviews FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. CLINIC CHAIRS
CREATE TABLE public.clinic_chairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  room TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_chairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clinic_chairs" ON public.clinic_chairs FOR SELECT USING (true);
CREATE POLICY "Admins can insert clinic_chairs" ON public.clinic_chairs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update clinic_chairs" ON public.clinic_chairs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete clinic_chairs" ON public.clinic_chairs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_clinic_chairs_updated_at BEFORE UPDATE ON public.clinic_chairs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default chairs
INSERT INTO public.clinic_chairs (name, room) VALUES
  ('Chair 1', 'Room A'),
  ('Chair 2', 'Room A'),
  ('Chair 3', 'Room B');

-- 5. RECURRING APPOINTMENTS
CREATE TABLE public.recurring_appointment_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id),
  treatment_id UUID REFERENCES public.treatments(id),
  chair TEXT DEFAULT '',
  frequency TEXT NOT NULL DEFAULT 'monthly', -- weekly, bi-weekly, monthly, quarterly, semi-annually
  day_of_week INTEGER, -- 0-6 for weekly/bi-weekly
  occurrences INTEGER DEFAULT 4,
  end_date DATE,
  notes TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_appointment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read recurring_appointment_rules" ON public.recurring_appointment_rules FOR SELECT USING (true);
CREATE POLICY "Staff can insert recurring_appointment_rules" ON public.recurring_appointment_rules FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role) OR has_role(auth.uid(), 'receptionist'::app_role)
);
CREATE POLICY "Staff can update recurring_appointment_rules" ON public.recurring_appointment_rules FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role) OR has_role(auth.uid(), 'receptionist'::app_role)
);
CREATE POLICY "Admins can delete recurring_appointment_rules" ON public.recurring_appointment_rules FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add series_id to appointments for linking recurring ones
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.recurring_appointment_rules(id) ON DELETE SET NULL;

-- 6. EXPENSES
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other', -- supplies, rent, utilities, equipment, salaries, other
  description TEXT DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  receipt_reference TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance staff can read expenses" ON public.expenses FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role)
);
CREATE POLICY "Finance staff can insert expenses" ON public.expenses FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role)
);
CREATE POLICY "Finance staff can update expenses" ON public.expenses FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role)
);
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. CONSENT FORM TEMPLATES
CREATE TABLE public.consent_form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general', -- general, anesthesia, surgical, orthodontic
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read consent_form_templates" ON public.consent_form_templates FOR SELECT USING (true);
CREATE POLICY "Admins can insert consent_form_templates" ON public.consent_form_templates FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update consent_form_templates" ON public.consent_form_templates FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete consent_form_templates" ON public.consent_form_templates FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_consent_form_templates_updated_at BEFORE UPDATE ON public.consent_form_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. PATIENT CONSENT FORMS
CREATE TABLE public.patient_consent_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.consent_form_templates(id) ON DELETE SET NULL,
  treatment_plan_id UUID REFERENCES public.treatment_plans(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, signed, expired
  signed_at TIMESTAMPTZ,
  signer_name TEXT DEFAULT '',
  witnessed_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_consent_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read patient_consent_forms" ON public.patient_consent_forms FOR SELECT USING (true);
CREATE POLICY "Staff can insert patient_consent_forms" ON public.patient_consent_forms FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role)
);
CREATE POLICY "Staff can update patient_consent_forms" ON public.patient_consent_forms FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role)
);
CREATE POLICY "Admins can delete patient_consent_forms" ON public.patient_consent_forms FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_patient_consent_forms_updated_at BEFORE UPDATE ON public.patient_consent_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. CLINIC DOCUMENTS
CREATE TABLE public.clinic_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other', -- license, certificate, contract, policy, other
  file_url TEXT NOT NULL,
  expiry_date DATE,
  notes TEXT DEFAULT '',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read clinic_documents" ON public.clinic_documents FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert clinic_documents" ON public.clinic_documents FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update clinic_documents" ON public.clinic_documents FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete clinic_documents" ON public.clinic_documents FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_clinic_documents_updated_at BEFORE UPDATE ON public.clinic_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. PATIENT DOCUMENTS
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other', -- insurance, referral, consent, lab, other
  file_url TEXT NOT NULL,
  notes TEXT DEFAULT '',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read patient_documents" ON public.patient_documents FOR SELECT USING (true);
CREATE POLICY "Staff can insert patient_documents" ON public.patient_documents FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role) OR has_role(auth.uid(), 'receptionist'::app_role)
);
CREATE POLICY "Admins can delete patient_documents" ON public.patient_documents FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for clinic documents
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-documents', 'clinic-documents', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload clinic documents" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clinic-documents' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can view clinic documents" ON storage.objects FOR SELECT
  USING (bucket_id = 'clinic-documents' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can delete clinic documents" ON storage.objects FOR DELETE
  USING (bucket_id = 'clinic-documents' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));

-- Add consent_status to treatment_plans for consent tracking
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS consent_status TEXT DEFAULT 'pending';
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ;

-- Add estimated_cost and tooth_number to treatment_plan_procedures
ALTER TABLE public.treatment_plan_procedures ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC DEFAULT 0;
ALTER TABLE public.treatment_plan_procedures ADD COLUMN IF NOT EXISTS tooth_number INTEGER;
