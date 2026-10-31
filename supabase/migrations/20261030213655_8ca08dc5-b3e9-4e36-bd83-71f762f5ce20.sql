ALTER TABLE public.lab_cases
  ADD COLUMN IF NOT EXISTS delivered_date date,
  ADD COLUMN IF NOT EXISTS hold_days_total numeric NOT NULL DEFAULT 0;

ALTER TABLE public.lab_settings
  ADD COLUMN IF NOT EXISTS daily_capacity integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS working_days smallint[] NOT NULL DEFAULT '{1,2,3,4,5}',
  ADD COLUMN IF NOT EXISTS holidays date[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS lab_settings_org_id_key ON public.lab_settings(org_id);
CREATE INDEX IF NOT EXISTS lab_case_history_case_idx ON public.lab_case_history(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lab_records_case_kind_idx ON public.lab_records(case_id, kind);

CREATE OR REPLACE FUNCTION public.is_lab_manager(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_org_role(_user_id, _org_id) IN ('owner','admin','manager') OR public.is_super_admin(_user_id)
$$;

-- Server-side stage rules: dates, hold time, QC gate, org lock.
CREATE OR REPLACE FUNCTION public.enforce_lab_case_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  stages text[] := ARRAY['pending','design','milling','ceramics','qc','ready','delivered'];
  fi int; ti int; qi int := 5;
BEGIN
  IF NEW.org_id IS DISTINCT FROM OLD.org_id THEN
    RAISE EXCEPTION 'A lab case cannot be moved to another organisation';
  END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  fi := array_position(stages, OLD.status);
  ti := array_position(stages, NEW.status);

  -- QC gate: leaving QC (or skipping it) needs a passed inspection or an admin override.
  IF ti IS NOT NULL AND ti > qi AND (fi IS NULL OR fi <= qi) AND COALESCE(NEW.qc_status,'') <> 'passed'
     AND OLD.status <> 'on_hold' THEN
    IF COALESCE(current_setting('app.qc_override', true), '') <> 'on' THEN
      RAISE EXCEPTION 'Quality check has not passed yet for case %', NEW.case_number;
    END IF;
  END IF;

  -- Hold time accounting.
  IF OLD.status = 'on_hold' AND OLD.hold_at IS NOT NULL THEN
    NEW.hold_days_total := COALESCE(OLD.hold_days_total,0) + round((extract(epoch FROM (now() - OLD.hold_at)) / 86400.0)::numeric, 2);
  END IF;

  -- Dates.
  IF NEW.status = 'pending' THEN NEW.start_date := NULL;
  ELSIF NEW.start_date IS NULL AND NEW.status NOT IN ('cancelled','on_hold') THEN NEW.start_date := current_date;
  END IF;
  IF NEW.status IN ('ready','delivered') THEN NEW.completed_date := COALESCE(OLD.completed_date, current_date);
  ELSIF NEW.status NOT IN ('cancelled','on_hold') THEN NEW.completed_date := NULL;
  END IF;
  IF NEW.status = 'delivered' THEN NEW.delivered_date := COALESCE(OLD.delivered_date, current_date);
  ELSIF NEW.status NOT IN ('cancelled','on_hold') THEN NEW.delivered_date := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_lab_case_rules ON public.lab_cases;
CREATE TRIGGER trg_enforce_lab_case_rules BEFORE UPDATE ON public.lab_cases
FOR EACH ROW EXECUTE FUNCTION public.enforce_lab_case_rules();

-- Admin override past a failed/missing QC, with mandatory reason, logged.
CREATE OR REPLACE FUNCTION public.lab_override_qc_move(p_case_id uuid, p_status text, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.lab_cases;
BEGIN
  SELECT * INTO c FROM public.lab_cases WHERE id = p_case_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Case not found'; END IF;
  IF NOT public.is_lab_manager(auth.uid(), c.org_id) THEN
    RAISE EXCEPTION 'Only an owner, admin or manager can override quality control';
  END IF;
  IF length(trim(coalesce(p_reason,''))) < 5 THEN RAISE EXCEPTION 'Give a reason for the override'; END IF;
  IF p_status NOT IN ('ready','delivered') THEN RAISE EXCEPTION 'Override only applies to Ready or Delivered'; END IF;
  PERFORM set_config('app.qc_override', 'on', true);
  UPDATE public.lab_cases SET status = p_status WHERE id = p_case_id;
  PERFORM set_config('app.qc_override', 'off', true);
  INSERT INTO public.lab_case_history(org_id, case_id, field_changed, from_status, to_status, changed_by, reason)
  VALUES (c.org_id, c.id, 'qc_override', c.status, p_status, auth.uid(), trim(p_reason));
END $$;

-- Atomic QC inspection: case update + inspection record in one transaction.
CREATE OR REPLACE FUNCTION public.lab_submit_qc(p_case_id uuid, p_qc_status text, p_status text, p_record_status text, p_data jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.lab_cases; rid uuid;
BEGIN
  SELECT * INTO c FROM public.lab_cases WHERE id = p_case_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Case not found'; END IF;
  IF NOT (public.get_org_role(auth.uid(), c.org_id) IN ('owner','admin','manager','dentist','lab_technician') OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'You do not have permission to inspect lab cases';
  END IF;
  IF c.status <> 'qc' THEN RAISE EXCEPTION 'Case % is not in the QC stage', c.case_number; END IF;
  IF p_qc_status NOT IN ('passed','rework_needed','pending') THEN RAISE EXCEPTION 'Invalid QC result'; END IF;
  IF p_qc_status = 'passed' AND p_status <> 'ready' THEN RAISE EXCEPTION 'A passed case must go to Ready'; END IF;
  IF p_qc_status <> 'passed' AND p_status NOT IN ('qc','design','milling','ceramics') THEN RAISE EXCEPTION 'Invalid rework stage'; END IF;

  UPDATE public.lab_cases SET qc_status = p_qc_status, status = p_status WHERE id = p_case_id;
  INSERT INTO public.lab_records(org_id, kind, case_id, title, status, amount, record_date, data)
  VALUES (c.org_id, 'qc', c.id, c.case_number, p_record_status, 0, current_date, coalesce(p_data,'{}'::jsonb))
  RETURNING id INTO rid;
  RETURN rid;
END $$;

-- All-or-nothing batch move (QC gate still enforced by trigger).
CREATE OR REPLACE FUNCTION public.lab_batch_move(p_moves jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE m jsonb; n int := 0;
BEGIN
  FOR m IN SELECT * FROM jsonb_array_elements(p_moves) LOOP
    UPDATE public.lab_cases SET status = m->>'status' WHERE id = (m->>'id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Case % not found or not permitted', m->>'id'; END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.lab_override_qc_move(uuid,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.lab_submit_qc(uuid,text,text,text,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.lab_batch_move(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lab_override_qc_move(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lab_submit_qc(uuid,text,text,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lab_batch_move(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lab_manager(uuid,uuid) TO authenticated;