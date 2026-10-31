ALTER TABLE public.lab_cases ALTER COLUMN qc_status SET DEFAULT 'pending';
UPDATE public.lab_cases SET qc_status = 'pending' WHERE qc_status IS NULL;
ALTER TABLE public.lab_case_history ADD COLUMN IF NOT EXISTS field_changed text NOT NULL DEFAULT 'status';
CREATE INDEX IF NOT EXISTS idx_lab_cases_org_due ON public.lab_cases(org_id, due_date);

CREATE OR REPLACE FUNCTION public.log_lab_case_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lab_case_history(org_id, case_id, field_changed, from_status, to_status, changed_by)
    VALUES (NEW.org_id, NEW.id, 'status', NULL, NEW.status, auth.uid());
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lab_case_history(org_id, case_id, field_changed, from_status, to_status, changed_by, reason)
    VALUES (NEW.org_id, NEW.id, CASE WHEN NEW.status='on_hold' OR OLD.status='on_hold' THEN 'hold_status' ELSE 'status' END,
            OLD.status, NEW.status, auth.uid(), CASE WHEN NEW.status = 'on_hold' THEN NEW.hold_reason END);
  END IF;
  IF NEW.technician_id IS DISTINCT FROM OLD.technician_id THEN
    INSERT INTO public.lab_case_history(org_id, case_id, field_changed, from_status, to_status, changed_by)
    VALUES (NEW.org_id, NEW.id, 'technician_id', OLD.technician_id::text, NEW.technician_id::text, auth.uid());
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.log_lab_case_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_log_lab_case_status ON public.lab_cases;
CREATE TRIGGER trg_log_lab_case_status AFTER INSERT OR UPDATE OF status, technician_id ON public.lab_cases
  FOR EACH ROW EXECUTE FUNCTION public.log_lab_case_status();