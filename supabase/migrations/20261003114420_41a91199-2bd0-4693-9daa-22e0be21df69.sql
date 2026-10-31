-- Helper: is the user a dentist in this org?
CREATE OR REPLACE FUNCTION public.is_org_dentist(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_org_role(_user_id, _org_id) = 'dentist'::org_role
$$;

-- Helper: the staff id linked to this user in this org
CREATE OR REPLACE FUNCTION public.get_staff_id_for_user(_user_id uuid, _org_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.staff WHERE user_id = _user_id AND org_id = _org_id LIMIT 1
$$;

-- SELECT: dentists only see their own appointments
DROP POLICY "Members can view appointments" ON public.appointments;
CREATE POLICY "Members can view appointments" ON public.appointments
FOR SELECT TO authenticated
USING (
  has_org_access(auth.uid(), org_id)
  AND (
    NOT public.is_org_dentist(auth.uid(), org_id)
    OR staff_id = public.get_staff_id_for_user(auth.uid(), org_id)
  )
);

-- INSERT: dentists cannot create appointments
DROP POLICY "Members can insert appointments" ON public.appointments;
CREATE POLICY "Members can insert appointments" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (
  has_org_access(auth.uid(), org_id)
  AND NOT public.is_org_dentist(auth.uid(), org_id)
);

-- UPDATE: dentists can only update their own appointments
DROP POLICY "Members can update appointments" ON public.appointments;
CREATE POLICY "Members can update appointments" ON public.appointments
FOR UPDATE TO authenticated
USING (
  has_org_access(auth.uid(), org_id)
  AND (
    NOT public.is_org_dentist(auth.uid(), org_id)
    OR staff_id = public.get_staff_id_for_user(auth.uid(), org_id)
  )
);

-- Trigger: dentists cannot reassign an appointment to another dentist
CREATE OR REPLACE FUNCTION public.prevent_dentist_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_org_dentist(auth.uid(), NEW.org_id)
     AND NEW.staff_id IS DISTINCT FROM OLD.staff_id THEN
    RAISE EXCEPTION 'Dentists cannot change the assigned dentist of an appointment';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_dentist_reassignment ON public.appointments;
CREATE TRIGGER prevent_dentist_reassignment
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.prevent_dentist_reassignment();