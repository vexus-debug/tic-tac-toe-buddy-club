
-- =============================================
-- BATCH 1: Core Clinical Tables
-- =============================================

-- 1. patients
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  gender text,
  phone text,
  email text,
  blood_group text,
  allergies text,
  medical_history text,
  emergency_contact_name text,
  emergency_contact_phone text,
  referral_source text,
  address text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_org ON public.patients(org_id);
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view patients" ON public.patients FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Members can insert patients" ON public.patients FOR INSERT WITH CHECK (has_org_access(auth.uid(), org_id));
CREATE POLICY "Members can update patients" ON public.patients FOR UPDATE USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can delete patients" ON public.patients FOR DELETE USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
);

-- 2. staff
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'assistant',
  phone text,
  email text,
  specialty text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_org ON public.staff(org_id);
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view staff" ON public.staff FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage staff" ON public.staff FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
);

-- 3. treatments
CREATE TABLE public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration integer DEFAULT 30,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_treatments_org ON public.treatments(org_id);
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view treatments" ON public.treatments FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage treatments" ON public.treatments FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist') OR is_super_admin(auth.uid())
);

-- 4. appointments
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  treatment_id uuid REFERENCES public.treatments(id),
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  chair text,
  status text NOT NULL DEFAULT 'scheduled',
  is_walk_in boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_org ON public.appointments(org_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view appointments" ON public.appointments FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Members can insert appointments" ON public.appointments FOR INSERT WITH CHECK (has_org_access(auth.uid(), org_id));
CREATE POLICY "Members can update appointments" ON public.appointments FOR UPDATE USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
);

-- 5. dental_chart_entries
CREATE TABLE public.dental_chart_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number text NOT NULL,
  procedure text NOT NULL,
  surface text,
  condition text,
  dentist_id uuid REFERENCES public.staff(id),
  notes text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dental_chart_org ON public.dental_chart_entries(org_id);
CREATE TRIGGER update_dental_chart_updated_at BEFORE UPDATE ON public.dental_chart_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view dental charts" ON public.dental_chart_entries FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Clinical staff can manage dental charts" ON public.dental_chart_entries FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','hygienist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','hygienist') OR is_super_admin(auth.uid())
);

-- 6. clinical_notes
CREATE TABLE public.clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id),
  subjective text,
  objective text,
  assessment text,
  plan text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinical_notes_org ON public.clinical_notes(org_id);
CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON public.clinical_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view clinical notes" ON public.clinical_notes FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Clinical staff can manage notes" ON public.clinical_notes FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','hygienist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','hygienist') OR is_super_admin(auth.uid())
);

-- 7. prescriptions
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  dentist_id uuid REFERENCES public.staff(id),
  prescription_date date NOT NULL DEFAULT CURRENT_DATE,
  diagnosis text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_prescriptions_org ON public.prescriptions(org_id);
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view prescriptions" ON public.prescriptions FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Clinical staff can manage prescriptions" ON public.prescriptions FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist') OR is_super_admin(auth.uid())
);

-- 8. prescription_medications
CREATE TABLE public.prescription_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE POLICY "Members can view medications" ON public.prescription_medications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id AND has_org_access(auth.uid(), p.org_id))
);
CREATE POLICY "Clinical staff can manage medications" ON public.prescription_medications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id AND (
    get_org_role(auth.uid(), p.org_id) IN ('owner','admin','dentist') OR is_super_admin(auth.uid())
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id AND (
    get_org_role(auth.uid(), p.org_id) IN ('owner','admin','dentist') OR is_super_admin(auth.uid())
  ))
);
