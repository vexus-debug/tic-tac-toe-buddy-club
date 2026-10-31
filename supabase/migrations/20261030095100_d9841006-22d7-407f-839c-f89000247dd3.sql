ALTER TABLE public.associate_contracts DROP COLUMN IF EXISTS allowed_chairs;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS allowed_chairs text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.enforce_provider_chairs() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE allowed text[];
BEGIN
  IF NEW.chair IS NULL OR NEW.chair = '' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.chair IS NOT DISTINCT FROM OLD.chair AND NEW.staff_id = OLD.staff_id THEN RETURN NEW; END IF;
  SELECT allowed_chairs INTO allowed FROM public.staff WHERE id = NEW.staff_id;
  IF allowed IS NOT NULL AND array_length(allowed, 1) > 0 AND NOT (NEW.chair = ANY(allowed)) THEN
    RAISE EXCEPTION 'This dentist may only work in: %', array_to_string(allowed, ', ');
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_provider_chairs() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_enforce_provider_chairs BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.enforce_provider_chairs();