ALTER TABLE public.lab_cases
  ADD COLUMN IF NOT EXISTS tooth_roles jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS labor_seconds_total integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.lab_log_labor(p_case_id uuid, p_seconds integer, p_stage text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.lab_cases;
BEGIN
  SELECT * INTO c FROM public.lab_cases WHERE id = p_case_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Case not found'; END IF;
  IF NOT (public.get_org_role(auth.uid(), c.org_id) IN ('owner','admin','manager','dentist','lab_technician') OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'You do not have permission to log work on this case';
  END IF;
  IF p_seconds IS NULL OR p_seconds < 1 OR p_seconds > 86400 THEN RAISE EXCEPTION 'Work time must be between 1 second and 24 hours'; END IF;
  UPDATE public.lab_cases SET labor_seconds_total = COALESCE(labor_seconds_total,0) + p_seconds WHERE id = p_case_id;
  INSERT INTO public.lab_case_history(org_id, case_id, field_changed, from_status, to_status, changed_by, reason)
  VALUES (c.org_id, c.id, 'labor', p_stage, p_stage, auth.uid(), p_seconds::text);
END $$;

REVOKE ALL ON FUNCTION public.lab_log_labor(uuid,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lab_log_labor(uuid,integer,text) TO authenticated;