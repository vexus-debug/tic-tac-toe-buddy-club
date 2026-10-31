ALTER TABLE public.lab_cases
  ADD COLUMN IF NOT EXISTS teeth text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hold_reason text,
  ADD COLUMN IF NOT EXISTS hold_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_case_id uuid REFERENCES public.lab_cases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS remake_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qc_status text;

CREATE INDEX IF NOT EXISTS idx_lab_cases_parent_case_id ON public.lab_cases(parent_case_id) WHERE parent_case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lab_cases_org_status ON public.lab_cases(org_id, status);

ALTER TABLE public.lab_records
  ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES public.lab_cases(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lab_records_case_id ON public.lab_records(case_id) WHERE case_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.lab_case_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  case_id uuid NOT NULL REFERENCES public.lab_cases(id) ON DELETE CASCADE,
  from_status text,
  to_status text,
  changed_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lab_case_history TO authenticated;
GRANT ALL ON public.lab_case_history TO service_role;
ALTER TABLE public.lab_case_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view lab case history" ON public.lab_case_history
  FOR SELECT TO authenticated USING (public.has_org_access(auth.uid(), org_id));
CREATE INDEX IF NOT EXISTS idx_lab_case_history_case ON public.lab_case_history(case_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_lab_case_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lab_case_history(org_id, case_id, from_status, to_status, changed_by)
    VALUES (NEW.org_id, NEW.id, NULL, NEW.status, auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lab_case_history(org_id, case_id, from_status, to_status, changed_by, reason)
    VALUES (NEW.org_id, NEW.id, OLD.status, NEW.status, auth.uid(),
            CASE WHEN NEW.status = 'on_hold' THEN NEW.hold_reason END);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_lab_case_status ON public.lab_cases;
CREATE TRIGGER trg_log_lab_case_status AFTER INSERT OR UPDATE OF status ON public.lab_cases
  FOR EACH ROW EXECUTE FUNCTION public.log_lab_case_status();