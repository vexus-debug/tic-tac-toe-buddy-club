
-- Treatment Plans
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  total_cost NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read treatment_plans" ON public.treatment_plans FOR SELECT USING (true);
CREATE POLICY "Staff can insert treatment_plans" ON public.treatment_plans FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role));
CREATE POLICY "Staff can update treatment_plans" ON public.treatment_plans FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role));
CREATE POLICY "Admins can delete treatment_plans" ON public.treatment_plans FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Treatment Plan Procedures
CREATE TABLE public.treatment_plan_procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  procedure_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_plan_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read treatment_plan_procedures" ON public.treatment_plan_procedures FOR SELECT USING (true);
CREATE POLICY "Staff can insert treatment_plan_procedures" ON public.treatment_plan_procedures FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role));
CREATE POLICY "Staff can update treatment_plan_procedures" ON public.treatment_plan_procedures FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role));
CREATE POLICY "Admins can delete treatment_plan_procedures" ON public.treatment_plan_procedures FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Dental Chart Entries
CREATE TABLE public.dental_chart_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL,
  procedure TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  dentist_id UUID REFERENCES public.staff(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_chart_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read dental_chart_entries" ON public.dental_chart_entries FOR SELECT USING (true);
CREATE POLICY "Staff can insert dental_chart_entries" ON public.dental_chart_entries FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role) OR has_role(auth.uid(), 'hygienist'::app_role));
CREATE POLICY "Staff can update dental_chart_entries" ON public.dental_chart_entries FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dentist'::app_role) OR has_role(auth.uid(), 'hygienist'::app_role));
CREATE POLICY "Admins can delete dental_chart_entries" ON public.dental_chart_entries FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_dental_chart_entries_updated_at BEFORE UPDATE ON public.dental_chart_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity Log
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read activity_log" ON public.activity_log FOR SELECT USING (true);
CREATE POLICY "System can insert activity_log" ON public.activity_log FOR INSERT WITH CHECK (true);
