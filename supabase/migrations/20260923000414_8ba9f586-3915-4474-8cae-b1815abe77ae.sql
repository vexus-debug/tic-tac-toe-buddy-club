-- lab_cases extra fields
ALTER TABLE public.lab_cases
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remark text DEFAULT '',
  ADD COLUMN IF NOT EXISTS clinic_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS clinic_doctor_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS job_instructions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS job_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_technician_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS treatment_id uuid REFERENCES public.treatments(id) ON DELETE SET NULL;

-- keep technician_id and assigned_technician_id aligned
UPDATE public.lab_cases SET assigned_technician_id = technician_id WHERE assigned_technician_id IS NULL AND technician_id IS NOT NULL;

-- auto case numbers
ALTER TABLE public.lab_cases ALTER COLUMN case_number DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.set_lab_case_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
    INSERT INTO public.lab_serial_counters (org_id, kind, year, last_number)
    VALUES (NEW.org_id, 'lab_case', EXTRACT(YEAR FROM now())::int, 1)
    ON CONFLICT (org_id, kind, year) DO UPDATE SET last_number = lab_serial_counters.last_number + 1
    RETURNING last_number INTO n;
    NEW.case_number := 'LC-' || EXTRACT(YEAR FROM now())::int || '-' || lpad(n::text, 4, '0');
  END IF;
  IF NEW.assigned_technician_id IS NULL AND NEW.technician_id IS NOT NULL THEN
    NEW.assigned_technician_id := NEW.technician_id;
  END IF;
  IF NEW.technician_id IS NULL AND NEW.assigned_technician_id IS NOT NULL THEN
    NEW.technician_id := NEW.assigned_technician_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_lab_case_number ON public.lab_cases;
CREATE TRIGGER trg_set_lab_case_number
BEFORE INSERT OR UPDATE ON public.lab_cases
FOR EACH ROW EXECUTE FUNCTION public.set_lab_case_number();

-- lab_invoices payment tracking
ALTER TABLE public.lab_invoices
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clinic_doctor_name text DEFAULT '';

-- default lab allocation rules for every org
CREATE OR REPLACE FUNCTION public.seed_lab_allocation_rules(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.lab_allocation_rules WHERE org_id = _org_id) THEN
    INSERT INTO public.lab_allocation_rules (org_id, category, percentage) VALUES
      (_org_id, 'Materials & Consumables', 30),
      (_org_id, 'Technician Commission', 30),
      (_org_id, 'Equipment & Maintenance', 10),
      (_org_id, 'Lab Operations', 15),
      (_org_id, 'Overhead & Profit', 15);
  END IF;
END;
$$;

DO $$
DECLARE o record;
BEGIN
  FOR o IN SELECT id FROM public.organizations LOOP
    PERFORM public.seed_lab_allocation_rules(o.id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.seed_lab_rules_for_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_lab_allocation_rules(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_lab_rules ON public.organizations;
CREATE TRIGGER trg_seed_lab_rules
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.seed_lab_rules_for_new_org();
