ALTER TYPE public.clinic_type ADD VALUE IF NOT EXISTS 'dental_lab';

CREATE TABLE public.lab_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  amount numeric NOT NULL DEFAULT 0,
  record_date date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lab_records_org_kind_idx ON public.lab_records(org_id, kind);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_records TO authenticated;
GRANT ALL ON public.lab_records TO service_role;
ALTER TABLE public.lab_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view lab records" ON public.lab_records FOR SELECT TO authenticated USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Members add lab records" ON public.lab_records FOR INSERT TO authenticated WITH CHECK (has_org_access(auth.uid(), org_id));
CREATE POLICY "Members edit lab records" ON public.lab_records FOR UPDATE TO authenticated USING (has_org_access(auth.uid(), org_id)) WITH CHECK (has_org_access(auth.uid(), org_id));
CREATE POLICY "Managers delete lab records" ON public.lab_records FOR DELETE TO authenticated USING (get_org_role(auth.uid(), org_id) IN ('owner','admin','manager') OR is_super_admin(auth.uid()));