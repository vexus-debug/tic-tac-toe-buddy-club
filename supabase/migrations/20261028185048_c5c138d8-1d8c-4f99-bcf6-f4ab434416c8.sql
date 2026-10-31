CREATE TABLE public.perio_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  exam_date date NOT NULL DEFAULT CURRENT_DATE,
  teeth jsonb NOT NULL DEFAULT '{}'::jsonb,
  bop_percent numeric,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perio_charts TO authenticated, service_role;
ALTER TABLE public.perio_charts ENABLE ROW LEVEL SECURITY;
CREATE INDEX perio_charts_patient_idx ON public.perio_charts(patient_id, exam_date DESC);
CREATE TRIGGER update_perio_charts_updated_at BEFORE UPDATE ON public.perio_charts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE POLICY "Members can view perio charts" ON public.perio_charts FOR SELECT TO authenticated USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Clinical staff can manage perio charts" ON public.perio_charts FOR ALL TO authenticated USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','hygienist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','dentist','hygienist') OR is_super_admin(auth.uid())
);