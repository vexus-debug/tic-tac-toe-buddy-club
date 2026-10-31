
-- 1. Create lab_cases table
CREATE TABLE public.lab_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL DEFAULT '',
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  dentist_id uuid NOT NULL REFERENCES public.staff(id),
  assigned_technician_id uuid REFERENCES public.staff(id),
  treatment_id uuid REFERENCES public.treatments(id),
  tooth_number integer,
  work_type text NOT NULL,
  instructions text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  is_urgent boolean NOT NULL DEFAULT false,
  due_date date,
  sent_date date DEFAULT CURRENT_DATE,
  completed_date date,
  delivered_date date,
  delivery_method text DEFAULT '',
  lab_fee numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create lab_case_images table
CREATE TABLE public.lab_case_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_case_id uuid NOT NULL REFERENCES public.lab_cases(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  description text DEFAULT '',
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create lab_case_notes table
CREATE TABLE public.lab_case_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_case_id uuid NOT NULL REFERENCES public.lab_cases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create lab_case_history table
CREATE TABLE public.lab_case_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_case_id uuid NOT NULL REFERENCES public.lab_cases(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES auth.users(id),
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Case number sequence + trigger
CREATE SEQUENCE IF NOT EXISTS public.lab_case_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_lab_case_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.case_number := 'LAB-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.lab_case_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_lab_case_number
  BEFORE INSERT ON public.lab_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_lab_case_number();

-- 6. Auto-update updated_at
CREATE TRIGGER update_lab_cases_updated_at
  BEFORE UPDATE ON public.lab_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable RLS
ALTER TABLE public.lab_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_case_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_case_history ENABLE ROW LEVEL SECURITY;

-- 8. lab_cases policies
CREATE POLICY "Authenticated users can read lab_cases"
  ON public.lab_cases FOR SELECT USING (true);

CREATE POLICY "Clinic and lab staff can insert lab_cases"
  ON public.lab_cases FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'dentist') OR
    has_role(auth.uid(), 'lab_technician')
  );

CREATE POLICY "Clinic and lab staff can update lab_cases"
  ON public.lab_cases FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'dentist') OR
    has_role(auth.uid(), 'lab_technician')
  );

CREATE POLICY "Admins can delete lab_cases"
  ON public.lab_cases FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- 9. lab_case_images policies
CREATE POLICY "Authenticated users can read lab_case_images"
  ON public.lab_case_images FOR SELECT USING (true);

CREATE POLICY "Staff can insert lab_case_images"
  ON public.lab_case_images FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'dentist') OR
    has_role(auth.uid(), 'lab_technician')
  );

CREATE POLICY "Admins can delete lab_case_images"
  ON public.lab_case_images FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- 10. lab_case_notes policies
CREATE POLICY "Authenticated users can read lab_case_notes"
  ON public.lab_case_notes FOR SELECT USING (true);

CREATE POLICY "Staff can insert lab_case_notes"
  ON public.lab_case_notes FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'dentist') OR
    has_role(auth.uid(), 'lab_technician')
  );

CREATE POLICY "Admins can delete lab_case_notes"
  ON public.lab_case_notes FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- 11. lab_case_history policies
CREATE POLICY "Authenticated users can read lab_case_history"
  ON public.lab_case_history FOR SELECT USING (true);

CREATE POLICY "System can insert lab_case_history"
  ON public.lab_case_history FOR INSERT
  WITH CHECK (true);

-- 12. Storage bucket for lab images
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-case-images', 'lab-case-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload lab images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lab-case-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view lab images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lab-case-images');

CREATE POLICY "Admins can delete lab images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lab-case-images' AND has_role(auth.uid(), 'admin'));
