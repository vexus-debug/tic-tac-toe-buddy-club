CREATE OR REPLACE FUNCTION public.ensure_case_credit(p_org uuid, p_patient uuid, p_ref uuid, p_is_visit boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_type clinic_type; v_bal integer; v_billing uuid; v_last timestamptz; v_visits integer;
BEGIN
  IF p_patient IS NULL THEN RETURN; END IF;
  SELECT clinic_type, coalesce(parent_org_id, id) INTO v_type, v_billing FROM organizations WHERE id = p_org;
  IF v_type IS DISTINCT FROM 'dental' THEN RETURN; END IF;
  SELECT max(created_at) INTO v_last FROM wallet_transactions
   WHERE org_id = v_billing AND patient_id = p_patient AND type = 'case_deduction' AND created_at > now() - interval '30 days';
  IF v_last IS NOT NULL THEN
    IF NOT p_is_visit THEN RETURN; END IF;
    SELECT (SELECT count(*) FROM appointments WHERE patient_id = p_patient AND created_at >= v_last AND id <> coalesce(p_ref, gen_random_uuid()))
         + (SELECT count(*) FROM waiting_list WHERE patient_id = p_patient AND created_at >= v_last AND id <> coalesce(p_ref, gen_random_uuid()))
      INTO v_visits;
    IF v_visits < 3 THEN RETURN; END IF;
  END IF;
  INSERT INTO clinic_wallets(org_id) VALUES (v_billing) ON CONFLICT DO NOTHING;
  SELECT balance INTO v_bal FROM clinic_wallets WHERE org_id = v_billing FOR UPDATE;
  IF v_bal < 1 THEN RAISE EXCEPTION 'NO_CASE_CREDITS: Your clinic has no case credits left. Top up to continue.'; END IF;
  UPDATE clinic_wallets SET balance = balance - 1, updated_at = now() WHERE org_id = v_billing;
  INSERT INTO wallet_transactions(org_id, amount, type, patient_id, reference_id, created_by)
  VALUES (v_billing, -1, 'case_deduction', p_patient, p_ref, auth.uid());
END $$;

CREATE OR REPLACE FUNCTION public.charge_case_credit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM ensure_case_credit(NEW.org_id, NEW.patient_id, NEW.id, TG_TABLE_NAME IN ('appointments','waiting_list'));
  RETURN NEW;
END $$;

-- Reschedule
CREATE OR REPLACE FUNCTION public.charge_on_reschedule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.appointment_date IS DISTINCT FROM OLD.appointment_date OR (OLD.status IN ('completed','cancelled','no_show') AND NEW.status IS DISTINCT FROM OLD.status) THEN
    PERFORM ensure_case_credit(NEW.org_id, NEW.patient_id, NEW.id, false);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_charge_reschedule ON public.appointments;
CREATE TRIGGER trg_charge_reschedule BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION charge_on_reschedule();

-- More gated modules
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['invoices','prescriptions','lab_orders','patient_documents','patient_images'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_charge_case ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_charge_case BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION charge_case_credit()', t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_lock_patient ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_lock_patient BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION lock_visit_patient()', t);
  END LOOP;
END $$;

-- Child items
CREATE OR REPLACE FUNCTION public.charge_child_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_org uuid; v_patient uuid;
BEGIN
  IF TG_TABLE_NAME = 'treatment_plan_items' THEN
    SELECT org_id, patient_id INTO v_org, v_patient FROM treatment_plans WHERE id = NEW.plan_id;
  ELSE
    SELECT org_id, patient_id INTO v_org, v_patient FROM prescriptions WHERE id = NEW.prescription_id;
  END IF;
  IF v_org IS NOT NULL THEN PERFORM ensure_case_credit(v_org, v_patient, NEW.id, false); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_charge_child ON public.treatment_plan_items;
CREATE TRIGGER trg_charge_child BEFORE INSERT ON public.treatment_plan_items FOR EACH ROW EXECUTE FUNCTION charge_child_item();
DROP TRIGGER IF EXISTS trg_charge_child ON public.prescription_medications;
CREATE TRIGGER trg_charge_child BEFORE INSERT ON public.prescription_medications FOR EACH ROW EXECUTE FUNCTION charge_child_item();

-- Patient identity lock
CREATE OR REPLACE FUNCTION public.lock_patient_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF (NEW.first_name IS DISTINCT FROM OLD.first_name OR NEW.last_name IS DISTINCT FROM OLD.last_name OR NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth)
     AND NOT is_super_admin(auth.uid())
     AND EXISTS (SELECT 1 FROM wallet_transactions WHERE patient_id = OLD.id AND type = 'case_deduction') THEN
    RAISE EXCEPTION 'A patient''s name and date of birth cannot be changed after their first case. Contact support to correct mistakes.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lock_patient_identity ON public.patients;
CREATE TRIGGER trg_lock_patient_identity BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION lock_patient_identity();

-- Clinic type lock
CREATE OR REPLACE FUNCTION public.lock_clinic_type()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.clinic_type IS DISTINCT FROM OLD.clinic_type AND OLD.parent_org_id IS NULL AND NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can change the clinic type';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lock_clinic_type ON public.organizations;
CREATE TRIGGER trg_lock_clinic_type BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION lock_clinic_type();

-- Waiting list recycling
CREATE OR REPLACE FUNCTION public.block_waitlist_recycle()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status IN ('completed','in_chair','in_progress','done') AND NEW.status = 'waiting' THEN
    RAISE EXCEPTION 'A finished check-in cannot be reopened. Check the patient in again.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_block_waitlist_recycle ON public.waiting_list;
CREATE TRIGGER trg_block_waitlist_recycle BEFORE UPDATE ON public.waiting_list FOR EACH ROW EXECUTE FUNCTION block_waitlist_recycle();

REVOKE EXECUTE ON FUNCTION public.ensure_case_credit(uuid, uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;