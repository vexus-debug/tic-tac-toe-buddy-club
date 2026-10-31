
-- Treatment Plans: groups multiple treatments into a patient plan with visit tracking
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  plan_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'normal',
  total_estimated_cost NUMERIC NOT NULL DEFAULT 0,
  start_date DATE DEFAULT CURRENT_DATE,
  target_end_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Treatment Plan Items: each planned treatment/visit within a plan
CREATE TABLE public.treatment_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id),
  description TEXT NOT NULL,
  tooth_number TEXT,
  visit_number INTEGER NOT NULL DEFAULT 1,
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treatment_plans
CREATE POLICY "Members can view treatment plans"
  ON public.treatment_plans FOR SELECT
  USING (has_org_access(auth.uid(), org_id));

CREATE POLICY "Clinical staff can manage treatment plans"
  ON public.treatment_plans FOR ALL
  USING ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'dentist'::org_role, 'hygienist'::org_role])) OR is_super_admin(auth.uid()))
  WITH CHECK ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'dentist'::org_role, 'hygienist'::org_role])) OR is_super_admin(auth.uid()));

-- RLS Policies for treatment_plan_items
CREATE POLICY "Members can view treatment plan items"
  ON public.treatment_plan_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.treatment_plans tp
    WHERE tp.id = treatment_plan_items.plan_id
    AND has_org_access(auth.uid(), tp.org_id)
  ));

CREATE POLICY "Clinical staff can manage treatment plan items"
  ON public.treatment_plan_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.treatment_plans tp
    WHERE tp.id = treatment_plan_items.plan_id
    AND ((get_org_role(auth.uid(), tp.org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'dentist'::org_role, 'hygienist'::org_role])) OR is_super_admin(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.treatment_plans tp
    WHERE tp.id = treatment_plan_items.plan_id
    AND ((get_org_role(auth.uid(), tp.org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'dentist'::org_role, 'hygienist'::org_role])) OR is_super_admin(auth.uid()))
  ));

-- Triggers for updated_at
CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_treatment_plan_items_updated_at
  BEFORE UPDATE ON public.treatment_plan_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
