ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS provider_type text NOT NULL DEFAULT 'in_house';
ALTER TABLE public.staff ADD CONSTRAINT staff_provider_type_chk CHECK (provider_type IN ('owner','in_house','associate','locum'));

ALTER TABLE public.associate_contracts
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS contract_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS allowed_chairs text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.associate_contracts ADD CONSTRAINT associate_contract_status_chk CHECK (contract_status IN ('draft','active','suspended','ended'));

ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS secondary_provider_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS split_ratio numeric(5,2) NOT NULL DEFAULT 100;
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_split_chk CHECK (split_ratio >= 0 AND split_ratio <= 100);
CREATE INDEX IF NOT EXISTS idx_invoice_items_secondary_provider ON public.invoice_items(secondary_provider_id);

ALTER TABLE public.commission_payouts
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by uuid;
CREATE INDEX IF NOT EXISTS idx_commission_payouts_staff_period ON public.commission_payouts(staff_id, period_start, period_end);

-- Locked payouts are immutable
CREATE OR REPLACE FUNCTION public.guard_locked_payout() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.locked_at IS NOT NULL THEN RAISE EXCEPTION 'This pay period is locked and cannot be deleted'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.locked_at IS NOT NULL THEN RAISE EXCEPTION 'This pay period is locked and cannot be changed'; END IF;
  IF NEW.locked_at IS NOT NULL THEN NEW.locked_by := auth.uid(); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_locked_payout BEFORE UPDATE OR DELETE ON public.commission_payouts FOR EACH ROW EXECUTE FUNCTION public.guard_locked_payout();

CREATE OR REPLACE FUNCTION public.guard_locked_payout_items() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE pid uuid := COALESCE(NEW.payout_id, OLD.payout_id);
BEGIN
  IF EXISTS (SELECT 1 FROM public.commission_payouts WHERE id = pid AND locked_at IS NOT NULL) THEN
    RAISE EXCEPTION 'This pay period is locked';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_guard_locked_payout_items BEFORE INSERT OR UPDATE OR DELETE ON public.commission_payout_items FOR EACH ROW EXECUTE FUNCTION public.guard_locked_payout_items();

-- Block retroactive edits to production inside a locked period
CREATE OR REPLACE FUNCTION public.guard_locked_production() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; d date;
BEGIN
  FOR r IN SELECT * FROM (SELECT OLD.invoice_id AS inv, OLD.provider_id AS p1, OLD.secondary_provider_id AS p2 WHERE TG_OP <> 'INSERT'
                          UNION ALL SELECT NEW.invoice_id, NEW.provider_id, NEW.secondary_provider_id WHERE TG_OP <> 'DELETE') x LOOP
    SELECT invoice_date INTO d FROM public.invoices WHERE id = r.inv;
    IF d IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.commission_payouts cp
      WHERE cp.locked_at IS NOT NULL AND cp.staff_id IN (r.p1, r.p2) AND d BETWEEN cp.period_start AND cp.period_end
    ) THEN
      RAISE EXCEPTION 'This bill falls in a settled pay period and cannot be changed';
    END IF;
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_guard_locked_production BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.guard_locked_production();