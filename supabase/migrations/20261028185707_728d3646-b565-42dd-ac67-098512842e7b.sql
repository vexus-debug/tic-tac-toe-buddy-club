ALTER TABLE public.treatment_plans
  ADD COLUMN IF NOT EXISTS option_group uuid,
  ADD COLUMN IF NOT EXISTS option_label text,
  ADD COLUMN IF NOT EXISTS acceptance_status text NOT NULL DEFAULT 'proposed',
  ADD COLUMN IF NOT EXISTS insurer_name text,
  ADD COLUMN IF NOT EXISTS coverage_percent numeric NOT NULL DEFAULT 0;
ALTER TABLE public.treatment_plan_items
  ADD COLUMN IF NOT EXISTS phase smallint,
  ADD COLUMN IF NOT EXISTS insurance_amount numeric NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.validate_plan_phase3() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'treatment_plans' THEN
    IF NEW.acceptance_status NOT IN ('proposed','accepted','declined','referred') THEN RAISE EXCEPTION 'Invalid acceptance status'; END IF;
    IF NEW.coverage_percent < 0 OR NEW.coverage_percent > 100 THEN RAISE EXCEPTION 'Coverage must be 0-100'; END IF;
  ELSE
    IF NEW.phase IS NOT NULL AND NEW.phase NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'Phase must be 1-4'; END IF;
    IF NEW.insurance_amount < 0 THEN RAISE EXCEPTION 'Coverage cannot be negative'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_plan_phase3 ON public.treatment_plans;
CREATE TRIGGER trg_validate_plan_phase3 BEFORE INSERT OR UPDATE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.validate_plan_phase3();
DROP TRIGGER IF EXISTS trg_validate_item_phase3 ON public.treatment_plan_items;
CREATE TRIGGER trg_validate_item_phase3 BEFORE INSERT OR UPDATE ON public.treatment_plan_items FOR EACH ROW EXECUTE FUNCTION public.validate_plan_phase3();