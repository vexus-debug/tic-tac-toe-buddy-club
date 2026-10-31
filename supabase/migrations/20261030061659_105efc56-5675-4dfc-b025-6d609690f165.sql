CREATE TABLE public.associate_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL UNIQUE REFERENCES public.staff(id) ON DELETE CASCADE,
  compensation_basis text NOT NULL DEFAULT 'production',
  commission_rate numeric(5,2) NOT NULL DEFAULT 35,
  lab_fee_share numeric(5,2) NOT NULL DEFAULT 50,
  daily_minimum numeric(12,2) NOT NULL DEFAULT 0,
  payout_frequency text NOT NULL DEFAULT 'monthly',
  start_date date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.associate_contracts TO authenticated;
GRANT ALL ON public.associate_contracts TO service_role;
ALTER TABLE public.associate_contracts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_associate_contracts_org ON public.associate_contracts(org_id);

CREATE OR REPLACE FUNCTION public.validate_associate_contract() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.compensation_basis NOT IN ('production','collections') THEN RAISE EXCEPTION 'Invalid compensation basis'; END IF;
  IF NEW.payout_frequency NOT IN ('biweekly','monthly') THEN RAISE EXCEPTION 'Invalid payout frequency'; END IF;
  IF NEW.commission_rate < 0 OR NEW.commission_rate > 100 OR NEW.lab_fee_share < 0 OR NEW.lab_fee_share > 100 OR NEW.daily_minimum < 0 THEN RAISE EXCEPTION 'Invalid contract values'; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_associate_contract BEFORE INSERT OR UPDATE ON public.associate_contracts FOR EACH ROW EXECUTE FUNCTION public.validate_associate_contract();

CREATE POLICY "Finance leads manage contracts" ON public.associate_contracts FOR ALL TO authenticated
  USING ((get_org_role(auth.uid(), org_id)::text IN ('owner','admin','accountant')) OR is_super_admin(auth.uid()))
  WITH CHECK ((get_org_role(auth.uid(), org_id)::text IN ('owner','admin','accountant')) OR is_super_admin(auth.uid()));
CREATE POLICY "Dentists view own contract" ON public.associate_contracts FOR SELECT TO authenticated
  USING (staff_id = get_staff_id_for_user(auth.uid(), org_id));

CREATE TABLE public.commission_payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.commission_payouts(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'procedure',
  source_id uuid,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  item_date date,
  description text NOT NULL,
  gross_amount numeric(12,2) NOT NULL DEFAULT 0,
  deduction_amount numeric(12,2) NOT NULL DEFAULT 0,
  net_amount numeric(12,2) NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 0,
  earned_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_payout_items TO authenticated;
GRANT ALL ON public.commission_payout_items TO service_role;
ALTER TABLE public.commission_payout_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payout_items_payout ON public.commission_payout_items(payout_id);

CREATE POLICY "Finance leads manage payout items" ON public.commission_payout_items FOR ALL TO authenticated
  USING ((get_org_role(auth.uid(), org_id)::text IN ('owner','admin','accountant')) OR is_super_admin(auth.uid()))
  WITH CHECK ((get_org_role(auth.uid(), org_id)::text IN ('owner','admin','accountant')) OR is_super_admin(auth.uid()));
CREATE POLICY "Dentists view own payout items" ON public.commission_payout_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.commission_payouts p WHERE p.id = payout_id AND p.staff_id = get_staff_id_for_user(auth.uid(), p.org_id)));

DROP POLICY IF EXISTS "Users can manage commission payouts in their org" ON public.commission_payouts;
CREATE POLICY "Finance leads manage payouts" ON public.commission_payouts FOR ALL TO authenticated
  USING ((get_org_role(auth.uid(), org_id)::text IN ('owner','admin','accountant')) OR is_super_admin(auth.uid()))
  WITH CHECK ((get_org_role(auth.uid(), org_id)::text IN ('owner','admin','accountant')) OR is_super_admin(auth.uid()));
CREATE POLICY "Dentists view own payouts" ON public.commission_payouts FOR SELECT TO authenticated
  USING (staff_id = get_staff_id_for_user(auth.uid(), org_id));

CREATE INDEX IF NOT EXISTS idx_invoice_items_provider ON public.invoice_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_dentist ON public.lab_cases(dentist_id);