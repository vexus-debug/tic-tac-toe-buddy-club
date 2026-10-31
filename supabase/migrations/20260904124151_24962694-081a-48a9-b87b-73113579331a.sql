-- Clinic type
ALTER TYPE public.clinic_type ADD VALUE IF NOT EXISTS 'diagnostic';

-- ============ LAB ============
CREATE TABLE public.test_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_categories TO authenticated;
GRANT ALL ON public.test_categories TO service_role;
ALTER TABLE public.test_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage test_categories" ON public.test_categories FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.test_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit text,
  reference_range text,
  input_type text NOT NULL DEFAULT 'text',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  price numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_tests TO authenticated;
GRANT ALL ON public.lab_tests TO service_role;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage lab_tests" ON public.lab_tests FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.lab_serial_counters (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind text NOT NULL,
  year int NOT NULL,
  last_number int NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id, kind, year)
);
GRANT SELECT ON public.lab_serial_counters TO authenticated;
GRANT ALL ON public.lab_serial_counters TO service_role;
ALTER TABLE public.lab_serial_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read counters" ON public.lab_serial_counters FOR SELECT TO authenticated
  USING (public.has_org_access(auth.uid(), org_id));

CREATE OR REPLACE FUNCTION public.next_lab_serial(_org_id uuid, _kind text, _prefix text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_year int := EXTRACT(YEAR FROM now())::int;
  v_num int;
BEGIN
  INSERT INTO public.lab_serial_counters (org_id, kind, year, last_number)
  VALUES (_org_id, _kind, v_year, 1)
  ON CONFLICT (org_id, kind, year) DO UPDATE SET last_number = public.lab_serial_counters.last_number + 1
  RETURNING last_number INTO v_num;
  RETURN _prefix || '-' || v_year::text || '-' || lpad(v_num::text, 5, '0');
END;
$$;

CREATE TABLE public.test_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  serial text NOT NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  patient_age text,
  patient_sex text,
  patient_phone text,
  referring_doctor text,
  referring_institution text,
  specimen text,
  billing_type text NOT NULL DEFAULT 'Patient',
  billing_entity text,
  clinical_notes text,
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid,
  is_locked boolean NOT NULL DEFAULT false,
  total_amount numeric NOT NULL DEFAULT 0,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, serial)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_forms TO authenticated;
GRANT ALL ON public.test_forms TO service_role;
ALTER TABLE public.test_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage test_forms" ON public.test_forms FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.test_form_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.test_forms(id) ON DELETE CASCADE,
  test_id uuid REFERENCES public.lab_tests(id) ON DELETE SET NULL,
  test_name text NOT NULL,
  category_name text,
  price numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_form_items TO authenticated;
GRANT ALL ON public.test_form_items TO service_role;
ALTER TABLE public.test_form_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage test_form_items" ON public.test_form_items FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.test_forms(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.test_form_items(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  comment text,
  entered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, test_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_results TO authenticated;
GRANT ALL ON public.test_results TO service_role;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage test_results" ON public.test_results FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.result_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_id uuid,
  serial text,
  action text NOT NULL,
  reason text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.result_audit_log TO authenticated;
GRANT ALL ON public.result_audit_log TO service_role;
ALTER TABLE public.result_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read audit" ON public.result_audit_log FOR SELECT TO authenticated
  USING (public.has_org_access(auth.uid(), org_id));
CREATE POLICY "org members append audit" ON public.result_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.lab_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  sla_hours int NOT NULL DEFAULT 24,
  require_approval boolean NOT NULL DEFAULT true,
  serial_prefix text NOT NULL DEFAULT 'MV',
  report_header text,
  report_footer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_settings TO authenticated;
GRANT ALL ON public.lab_settings TO service_role;
ALTER TABLE public.lab_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage lab_settings" ON public.lab_settings FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

-- ============ IMAGING ============
CREATE TABLE public.scan_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mrn text NOT NULL,
  full_name text NOT NULL,
  age text,
  sex text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, mrn)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scan_patients TO authenticated;
GRANT ALL ON public.scan_patients TO service_role;
ALTER TABLE public.scan_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage scan_patients" ON public.scan_patients FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scan_patient_id uuid REFERENCES public.scan_patients(id) ON DELETE CASCADE,
  serial text NOT NULL,
  modality text NOT NULL,
  body_part text,
  is_urgent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  clinical_indication text,
  referring_doctor text,
  findings text,
  impression text,
  recommendation text,
  price numeric NOT NULL DEFAULT 0,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  reported_by uuid,
  reported_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, serial)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage scans" ON public.scans FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.scan_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scan_images TO authenticated;
GRANT ALL ON public.scan_images TO service_role;
ALTER TABLE public.scan_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage scan_images" ON public.scan_images FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.scan_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scan_patient_id uuid REFERENCES public.scan_patients(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  phone text,
  modality text NOT NULL,
  body_part text,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scan_appointments TO authenticated;
GRANT ALL ON public.scan_appointments TO service_role;
ALTER TABLE public.scan_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage scan_appointments" ON public.scan_appointments FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.scan_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scan_id uuid,
  serial text,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.scan_activity_log TO authenticated;
GRANT ALL ON public.scan_activity_log TO service_role;
ALTER TABLE public.scan_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read scan activity" ON public.scan_activity_log FOR SELECT TO authenticated
  USING (public.has_org_access(auth.uid(), org_id));
CREATE POLICY "org members append scan activity" ON public.scan_activity_log FOR INSERT TO authenticated
  WITH CHECK (public.has_org_access(auth.uid(), org_id));

-- ============ PHARMACY ============
CREATE TABLE public.pharmacy_drugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  generic_name text,
  form text,
  strength text,
  unit_price numeric NOT NULL DEFAULT 0,
  stock_quantity int NOT NULL DEFAULT 0,
  reorder_level int NOT NULL DEFAULT 10,
  batch_number text,
  expiry_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pharmacy_drugs TO authenticated;
GRANT ALL ON public.pharmacy_drugs TO service_role;
ALTER TABLE public.pharmacy_drugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage pharmacy_drugs" ON public.pharmacy_drugs FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.pharmacy_dispenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  notes text,
  dispensed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pharmacy_dispenses TO authenticated;
GRANT ALL ON public.pharmacy_dispenses TO service_role;
ALTER TABLE public.pharmacy_dispenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage pharmacy_dispenses" ON public.pharmacy_dispenses FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.pharmacy_dispense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dispense_id uuid NOT NULL REFERENCES public.pharmacy_dispenses(id) ON DELETE CASCADE,
  drug_id uuid REFERENCES public.pharmacy_drugs(id) ON DELETE SET NULL,
  drug_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pharmacy_dispense_items TO authenticated;
GRANT ALL ON public.pharmacy_dispense_items TO service_role;
ALTER TABLE public.pharmacy_dispense_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage pharmacy_dispense_items" ON public.pharmacy_dispense_items FOR ALL TO authenticated
  USING (public.has_org_access(auth.uid(), org_id)) WITH CHECK (public.has_org_access(auth.uid(), org_id));

-- ============ PUBLIC LOOKUPS ============
CREATE OR REPLACE FUNCTION public.get_public_result(_serial text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'serial', f.serial,
    'patient_name', f.patient_name,
    'patient_age', f.patient_age,
    'patient_sex', f.patient_sex,
    'specimen', f.specimen,
    'referring_doctor', f.referring_doctor,
    'status', f.status,
    'collected_at', f.collected_at,
    'completed_at', f.completed_at,
    'approved_at', f.approved_at,
    'clinic_name', o.name,
    'results', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('test_name', r.test_name, 'values', r.values, 'comment', r.comment) ORDER BY r.test_name)
      FROM public.test_results r WHERE r.form_id = f.id
    ), '[]'::jsonb)
  )
  FROM public.test_forms f
  JOIN public.organizations o ON o.id = f.org_id
  WHERE upper(f.serial) = upper(_serial)
    AND f.status IN ('completed', 'approved')
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_result(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_scan(_serial text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'serial', s.serial,
    'patient_name', p.full_name,
    'age', p.age,
    'sex', p.sex,
    'modality', s.modality,
    'body_part', s.body_part,
    'status', s.status,
    'findings', s.findings,
    'impression', s.impression,
    'recommendation', s.recommendation,
    'reported_at', s.reported_at,
    'approved_at', s.approved_at,
    'clinic_name', o.name
  )
  FROM public.scans s
  JOIN public.organizations o ON o.id = s.org_id
  LEFT JOIN public.scan_patients p ON p.id = s.scan_patient_id
  WHERE upper(s.serial) = upper(_serial)
    AND s.status IN ('reported', 'approved', 'completed')
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_scan(text) TO anon, authenticated;

-- ============ TRIGGERS & REALTIME ============
CREATE TRIGGER update_test_categories_updated_at BEFORE UPDATE ON public.test_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON public.lab_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_test_forms_updated_at BEFORE UPDATE ON public.test_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_test_results_updated_at BEFORE UPDATE ON public.test_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_lab_settings_updated_at BEFORE UPDATE ON public.lab_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_scan_patients_updated_at BEFORE UPDATE ON public.scan_patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON public.scans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_scan_appointments_updated_at BEFORE UPDATE ON public.scan_appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_pharmacy_drugs_updated_at BEFORE UPDATE ON public.pharmacy_drugs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_pharmacy_dispenses_updated_at BEFORE UPDATE ON public.pharmacy_dispenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.test_forms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;
