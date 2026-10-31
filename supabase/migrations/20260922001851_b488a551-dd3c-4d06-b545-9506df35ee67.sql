CREATE TABLE public.offline_dental_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  history_date DATE NOT NULL DEFAULT CURRENT_DATE,
  procedure TEXT NOT NULL,
  treatment TEXT,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  dentist_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offline_dental_history TO authenticated;
GRANT ALL ON public.offline_dental_history TO service_role;

ALTER TABLE public.offline_dental_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view offline dental history"
  ON public.offline_dental_history
  FOR SELECT
  USING (public.has_org_access(auth.uid(), org_id));

CREATE POLICY "Clinical staff can manage offline dental history"
  ON public.offline_dental_history
  FOR ALL
  USING (
    public.get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::public.org_role, 'admin'::public.org_role, 'dentist'::public.org_role, 'hygienist'::public.org_role])
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::public.org_role, 'admin'::public.org_role, 'dentist'::public.org_role, 'hygienist'::public.org_role])
    OR public.is_super_admin(auth.uid())
  );

CREATE OR REPLACE FUNCTION public.update_offline_dental_history_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_offline_dental_history_updated_at
  BEFORE UPDATE ON public.offline_dental_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_offline_dental_history_updated_at();