
-- Step 1: Assign admin role
INSERT INTO public.user_roles (user_id, role) VALUES ('5d20a3a0-01bd-492c-8f70-c3585e790728', 'admin');

-- Step 2: Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  chair TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled',
  is_walk_in BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read appointments"
  ON public.appointments FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dentist') OR
    has_role(auth.uid(), 'receptionist') OR has_role(auth.uid(), 'assistant') OR
    has_role(auth.uid(), 'hygienist')
  );

CREATE POLICY "Staff can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dentist') OR
    has_role(auth.uid(), 'receptionist') OR has_role(auth.uid(), 'assistant') OR
    has_role(auth.uid(), 'hygienist')
  );

CREATE POLICY "Admins can delete appointments"
  ON public.appointments FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 3: Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnosis TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read prescriptions"
  ON public.prescriptions FOR SELECT USING (true);

CREATE POLICY "Staff can insert prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dentist')
  );

CREATE POLICY "Staff can update prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dentist'));

CREATE POLICY "Admins can delete prescriptions"
  ON public.prescriptions FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 4: Create prescription_medications table
CREATE TABLE public.prescription_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prescription_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read prescription_medications"
  ON public.prescription_medications FOR SELECT USING (true);

CREATE POLICY "Staff can insert prescription_medications"
  ON public.prescription_medications FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dentist')
  );

CREATE POLICY "Staff can update prescription_medications"
  ON public.prescription_medications FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dentist'));

CREATE POLICY "Admins can delete prescription_medications"
  ON public.prescription_medications FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Step 5: Create lab_orders table
CREATE TABLE public.lab_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  dentist_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  lab_work_type TEXT NOT NULL,
  lab_name TEXT NOT NULL DEFAULT '',
  due_date DATE,
  sent_date DATE,
  received_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lab_orders"
  ON public.lab_orders FOR SELECT USING (true);

CREATE POLICY "Staff can insert lab_orders"
  ON public.lab_orders FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dentist') OR
    has_role(auth.uid(), 'assistant') OR has_role(auth.uid(), 'hygienist')
  );

CREATE POLICY "Staff can update lab_orders"
  ON public.lab_orders FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dentist') OR
    has_role(auth.uid(), 'assistant') OR has_role(auth.uid(), 'hygienist')
  );

CREATE POLICY "Admins can delete lab_orders"
  ON public.lab_orders FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_lab_orders_updated_at
  BEFORE UPDATE ON public.lab_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
