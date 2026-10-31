CREATE TABLE public.clinic_wallets (
  org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clinic_wallets TO authenticated;
GRANT ALL ON public.clinic_wallets TO service_role;
ALTER TABLE public.clinic_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view wallet" ON public.clinic_wallets FOR SELECT TO authenticated USING (public.has_org_access(auth.uid(), org_id));

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  patient_id uuid,
  reference_id uuid,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wallet_tx_org_patient ON public.wallet_transactions(org_id, patient_id, created_at DESC);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view wallet ledger" ON public.wallet_transactions FOR SELECT TO authenticated USING (public.has_org_access(auth.uid(), org_id));

CREATE OR REPLACE FUNCTION public.charge_case_credit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_type clinic_type; v_bal integer; v_billing uuid;
BEGIN
  SELECT clinic_type, coalesce(parent_org_id, id) INTO v_type, v_billing FROM organizations WHERE id = NEW.org_id;
  IF v_type IS DISTINCT FROM 'dental' THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM wallet_transactions WHERE org_id = v_billing AND patient_id = NEW.patient_id
             AND type = 'case_deduction' AND created_at > now() - interval '30 days') THEN RETURN NEW; END IF;
  INSERT INTO clinic_wallets(org_id) VALUES (v_billing) ON CONFLICT DO NOTHING;
  SELECT balance INTO v_bal FROM clinic_wallets WHERE org_id = v_billing FOR UPDATE;
  IF v_bal < 1 THEN RAISE EXCEPTION 'NO_CASE_CREDITS: Your clinic has no case credits left. Top up to start new visits.'; END IF;
  UPDATE clinic_wallets SET balance = balance - 1, updated_at = now() WHERE org_id = v_billing;
  INSERT INTO wallet_transactions(org_id, amount, type, patient_id, reference_id, created_by)
  VALUES (v_billing, -1, 'case_deduction', NEW.patient_id, NEW.id, auth.uid());
  RETURN NEW;
END $$;

CREATE TRIGGER trg_charge_case_appt BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.charge_case_credit();
CREATE TRIGGER trg_charge_case_wait BEFORE INSERT ON public.waiting_list FOR EACH ROW EXECUTE FUNCTION public.charge_case_credit();

CREATE OR REPLACE FUNCTION public.lock_visit_patient()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.patient_id IS DISTINCT FROM OLD.patient_id THEN RAISE EXCEPTION 'The patient on a visit cannot be changed'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_lock_patient_appt BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.lock_visit_patient();
CREATE TRIGGER trg_lock_patient_wait BEFORE UPDATE ON public.waiting_list FOR EACH ROW EXECUTE FUNCTION public.lock_visit_patient();

CREATE OR REPLACE FUNCTION public.admin_topup_wallet(p_org_id uuid, p_credits integer, p_note text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_bal integer;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Only platform admins can add credits'; END IF;
  IF p_credits IS NULL OR p_credits <= 0 OR p_credits > 100000 THEN RAISE EXCEPTION 'Invalid credit amount'; END IF;
  INSERT INTO clinic_wallets(org_id) VALUES (p_org_id) ON CONFLICT DO NOTHING;
  UPDATE clinic_wallets SET balance = balance + p_credits, updated_at = now() WHERE org_id = p_org_id RETURNING balance INTO v_bal;
  INSERT INTO wallet_transactions(org_id, amount, type, note, created_by) VALUES (p_org_id, p_credits, 'topup', p_note, auth.uid());
  RETURN v_bal;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_topup_wallet(uuid, integer, text) FROM anon;

INSERT INTO public.clinic_wallets(org_id, balance)
SELECT id, 10 FROM public.organizations WHERE clinic_type = 'dental' AND parent_org_id IS NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.wallet_transactions(org_id, amount, type, note)
SELECT id, 10, 'topup', 'Starter credits' FROM public.organizations WHERE clinic_type = 'dental' AND parent_org_id IS NULL;