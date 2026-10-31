
-- =============================================
-- BATCH 3: Lab Tables, Supporting Tables, Storage
-- =============================================

-- 19. lab_orders
CREATE TABLE public.lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  treatment_id uuid REFERENCES public.treatments(id),
  dentist_id uuid NOT NULL REFERENCES public.staff(id),
  lab_work_type text NOT NULL,
  lab_name text NOT NULL,
  due_date date,
  sent_date date,
  received_date date,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lab_orders_org ON public.lab_orders(org_id);
CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view lab orders" ON public.lab_orders FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Clinical staff can manage lab orders" ON public.lab_orders FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','lab_technician') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','lab_technician') OR is_super_admin(auth.uid())
);

-- 20. lab_cases
CREATE TABLE public.lab_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  case_number text NOT NULL,
  patient_id uuid REFERENCES public.patients(id),
  dentist_id uuid REFERENCES public.staff(id),
  technician_id uuid REFERENCES public.staff(id),
  work_type text NOT NULL,
  instructions text,
  material text,
  shade text,
  urgency text DEFAULT 'normal',
  lab_fee numeric(10,2) DEFAULT 0,
  clinic_fee numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  start_date date,
  due_date date,
  completed_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lab_cases_org ON public.lab_cases(org_id);
CREATE TRIGGER update_lab_cases_updated_at BEFORE UPDATE ON public.lab_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view lab cases" ON public.lab_cases FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Lab staff can manage cases" ON public.lab_cases FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','lab_technician') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','lab_technician') OR is_super_admin(auth.uid())
);

-- 21. lab_invoices
CREATE TABLE public.lab_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  clinic_code text,
  patient_name text,
  lab_case_id uuid REFERENCES public.lab_cases(id),
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lab_invoices_org ON public.lab_invoices(org_id);
CREATE TRIGGER update_lab_invoices_updated_at BEFORE UPDATE ON public.lab_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view lab invoices" ON public.lab_invoices FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Lab/finance staff can manage lab invoices" ON public.lab_invoices FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','lab_technician') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','lab_technician') OR is_super_admin(auth.uid())
);

-- 22. lab_allocation_rules
CREATE TABLE public.lab_allocation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category text NOT NULL,
  percentage numeric(5,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lab_alloc_rules_org ON public.lab_allocation_rules(org_id);
CREATE TRIGGER update_lab_alloc_rules_updated_at BEFORE UPDATE ON public.lab_allocation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view lab allocation rules" ON public.lab_allocation_rules FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage lab allocation rules" ON public.lab_allocation_rules FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
);

-- 23. clinic_chairs
CREATE TABLE public.clinic_chairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  room text,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinic_chairs_org ON public.clinic_chairs(org_id);
CREATE TRIGGER update_clinic_chairs_updated_at BEFORE UPDATE ON public.clinic_chairs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view chairs" ON public.clinic_chairs FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage chairs" ON public.clinic_chairs FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
);

-- 24. consent_form_templates
CREATE TABLE public.consent_form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_consent_templates_org ON public.consent_form_templates(org_id);
CREATE TRIGGER update_consent_templates_updated_at BEFORE UPDATE ON public.consent_form_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view consent templates" ON public.consent_form_templates FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage consent templates" ON public.consent_form_templates FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
);

-- 25. patient_consent_forms
CREATE TABLE public.patient_consent_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.consent_form_templates(id),
  title text NOT NULL,
  content text,
  signed_by text,
  signed_date date,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_patient_consent_org ON public.patient_consent_forms(org_id);
CREATE TRIGGER update_patient_consent_updated_at BEFORE UPDATE ON public.patient_consent_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view patient consent forms" ON public.patient_consent_forms FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Staff can manage patient consent forms" ON public.patient_consent_forms FOR ALL USING (
  has_org_access(auth.uid(), org_id)
) WITH CHECK (
  has_org_access(auth.uid(), org_id)
);

-- 26. clinic_documents
CREATE TABLE public.clinic_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  file_url text NOT NULL,
  file_type text,
  expiry_date date,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinic_docs_org ON public.clinic_documents(org_id);
CREATE TRIGGER update_clinic_docs_updated_at BEFORE UPDATE ON public.clinic_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view clinic documents" ON public.clinic_documents FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage clinic documents" ON public.clinic_documents FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
);

-- 27. patient_documents
CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  file_url text NOT NULL,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_patient_docs_org ON public.patient_documents(org_id);
CREATE TRIGGER update_patient_docs_updated_at BEFORE UPDATE ON public.patient_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view patient documents" ON public.patient_documents FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Staff can manage patient documents" ON public.patient_documents FOR ALL USING (
  has_org_access(auth.uid(), org_id)
) WITH CHECK (
  has_org_access(auth.uid(), org_id)
);

-- 28. patient_images
CREATE TABLE public.patient_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text,
  tooth_number text,
  description text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_patient_images_org ON public.patient_images(org_id);

CREATE POLICY "Members can view patient images" ON public.patient_images FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Clinical staff can manage patient images" ON public.patient_images FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','hygienist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','hygienist') OR is_super_admin(auth.uid())
);

-- 29. patient_reviews
CREATE TABLE public.patient_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id),
  staff_id uuid REFERENCES public.staff(id),
  rating integer NOT NULL DEFAULT 5,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_patient_reviews_org ON public.patient_reviews(org_id);

CREATE POLICY "Members can view reviews" ON public.patient_reviews FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Staff can manage reviews" ON public.patient_reviews FOR ALL USING (
  has_org_access(auth.uid(), org_id)
) WITH CHECK (
  has_org_access(auth.uid(), org_id)
);

-- 30. activity_log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users(id),
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_org ON public.activity_log(org_id);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);

CREATE POLICY "Members can view activity log" ON public.activity_log FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "System can insert activity log" ON public.activity_log FOR INSERT WITH CHECK (has_org_access(auth.uid(), org_id));

-- 31. notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_org ON public.notifications(org_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (
  user_id = auth.uid() AND has_org_access(auth.uid(), org_id)
);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (has_org_access(auth.uid(), org_id));

-- 32. messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  subject text NOT NULL,
  body text NOT NULL,
  is_urgent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_org ON public.messages(org_id);

CREATE POLICY "Members can view messages" ON public.messages FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND has_org_access(auth.uid(), org_id)
);

-- message_recipients
CREATE TABLE public.message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id),
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz
);

CREATE POLICY "Recipients can view their messages" ON public.message_recipients FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Recipients can update read status" ON public.message_recipients FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "Senders can add recipients" ON public.message_recipients FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND m.sender_id = auth.uid())
);

-- message_attachments
CREATE TABLE public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE POLICY "Members can view message attachments" ON public.message_attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND has_org_access(auth.uid(), m.org_id))
);
CREATE POLICY "Senders can add attachments" ON public.message_attachments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND m.sender_id = auth.uid())
);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-images', 'patient-images', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-documents', 'clinic-documents', false);

-- Storage policies for patient-images
CREATE POLICY "Org members can view patient images" ON storage.objects FOR SELECT USING (
  bucket_id = 'patient-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Clinical staff can upload patient images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'patient-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Clinical staff can delete patient images" ON storage.objects FOR DELETE USING (
  bucket_id = 'patient-images' AND auth.role() = 'authenticated'
);

-- Storage policies for clinic-documents
CREATE POLICY "Org members can view clinic documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'clinic-documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "Staff can upload clinic documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'clinic-documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "Staff can delete clinic documents" ON storage.objects FOR DELETE USING (
  bucket_id = 'clinic-documents' AND auth.role() = 'authenticated'
);
