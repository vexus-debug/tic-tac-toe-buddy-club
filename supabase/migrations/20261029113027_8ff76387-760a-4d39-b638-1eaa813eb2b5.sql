
-- 1. Dental detail + provider on invoice lines
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS tooth_number text,
  ADD COLUMN IF NOT EXISTS surfaces text,
  ADD COLUMN IF NOT EXISTS cdt_code text,
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.staff(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS invoice_items_provider_idx ON public.invoice_items(provider_id);

-- 2. Estimates: insurance + e-signature
ALTER TABLE public.treatment_estimates
  ADD COLUMN IF NOT EXISTS insurer_name text,
  ADD COLUMN IF NOT EXISTS insurance_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signed_name text,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS signature_data text;

-- 3. Expenses: link to patient/invoice + recurring
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_due_date date;
CREATE INDEX IF NOT EXISTS expenses_patient_idx ON public.expenses(patient_id);
CREATE INDEX IF NOT EXISTS expenses_invoice_idx ON public.expenses(invoice_id);

-- 4. Adjustments (write-offs, courtesy, bad debt)
CREATE TABLE public.invoice_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'courtesy',
  amount numeric NOT NULL,
  reason text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_adjustments TO authenticated;
GRANT ALL ON public.invoice_adjustments TO service_role;
ALTER TABLE public.invoice_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view adjustments" ON public.invoice_adjustments FOR SELECT TO authenticated USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Leaders add adjustments" ON public.invoice_adjustments FOR INSERT TO authenticated
  WITH CHECK ((get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant')) OR is_super_admin(auth.uid()));
CREATE INDEX invoice_adjustments_invoice_idx ON public.invoice_adjustments(invoice_id);

-- 5. Patient credits / deposits (positive = money in, negative = applied/refunded)
CREATE TABLE public.patient_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'deposit',
  amount numeric NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  payment_method text,
  reference text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_credits TO authenticated;
GRANT ALL ON public.patient_credits TO service_role;
ALTER TABLE public.patient_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view credits" ON public.patient_credits FOR SELECT TO authenticated USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Finance add credits" ON public.patient_credits FOR INSERT TO authenticated
  WITH CHECK ((get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','receptionist')) OR is_super_admin(auth.uid()));
CREATE INDEX patient_credits_patient_idx ON public.patient_credits(patient_id);

-- 6. Insurance claims
CREATE TABLE public.insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  insurer_name text NOT NULL,
  policy_number text,
  claim_number text,
  amount_claimed numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  submitted_date date,
  paid_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_claims TO authenticated;
GRANT ALL ON public.insurance_claims TO service_role;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view claims" ON public.insurance_claims FOR SELECT TO authenticated USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Finance manage claims" ON public.insurance_claims FOR ALL TO authenticated
  USING ((get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','receptionist')) OR is_super_admin(auth.uid()))
  WITH CHECK ((get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','receptionist')) OR is_super_admin(auth.uid()));
CREATE INDEX insurance_claims_invoice_idx ON public.insurance_claims(invoice_id);
CREATE TRIGGER insurance_claims_updated BEFORE UPDATE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 7. Billing audit trail (written only by triggers)
CREATE TABLE public.billing_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  invoice_id uuid,
  entity text NOT NULL,
  action text NOT NULL,
  details jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_audit_log TO authenticated;
GRANT ALL ON public.billing_audit_log TO service_role;
ALTER TABLE public.billing_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaders view billing audit" ON public.billing_audit_log FOR SELECT TO authenticated
  USING ((get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','manager')) OR is_super_admin(auth.uid()));
CREATE INDEX billing_audit_invoice_idx ON public.billing_audit_log(invoice_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_billing_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb; v_org uuid; v_inv uuid;
BEGIN
  r := to_jsonb(coalesce(NEW, OLD));
  IF TG_TABLE_NAME = 'invoice_items' THEN
    v_inv := (r->>'invoice_id')::uuid;
    SELECT org_id INTO v_org FROM invoices WHERE id = v_inv;
  ELSIF TG_TABLE_NAME = 'invoices' THEN
    v_inv := (r->>'id')::uuid; v_org := (r->>'org_id')::uuid;
  ELSE
    v_inv := nullif(r->>'invoice_id','')::uuid; v_org := (r->>'org_id')::uuid;
  END IF;
  IF v_org IS NULL THEN RETURN coalesce(NEW, OLD); END IF;
  INSERT INTO billing_audit_log (org_id, invoice_id, entity, action, details, user_id)
  VALUES (v_org, v_inv, TG_TABLE_NAME, lower(TG_OP),
    CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW))
         ELSE r END, auth.uid());
  RETURN coalesce(NEW, OLD);
END $$;

CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.log_billing_change();
CREATE TRIGGER audit_invoice_items AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.log_billing_change();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.log_billing_change();
CREATE TRIGGER audit_adjustments AFTER INSERT OR UPDATE OR DELETE ON public.invoice_adjustments FOR EACH ROW EXECUTE FUNCTION public.log_billing_change();

-- 8. Anti-skimming: only owner/admin may delete payments or invoices that have money on them
CREATE OR REPLACE FUNCTION public.guard_billing_delete() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN OLD; END IF;
  IF coalesce(get_org_role(auth.uid(), OLD.org_id)::text,'') IN ('owner','admin') OR is_super_admin(auth.uid()) THEN RETURN OLD; END IF;
  IF TG_TABLE_NAME = 'payments' THEN
    RAISE EXCEPTION 'Only an owner or admin can remove a payment';
  END IF;
  IF EXISTS (SELECT 1 FROM payments WHERE invoice_id = OLD.id) THEN
    RAISE EXCEPTION 'This invoice has payments. Ask an owner or admin to void it';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER guard_payments_delete BEFORE DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.guard_billing_delete();
CREATE TRIGGER guard_invoices_delete BEFORE DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.guard_billing_delete();

-- 9. Walkout invoice now carries tooth, surfaces, code and provider
CREATE OR REPLACE FUNCTION public.create_visit_invoice(p_org_id uuid, p_patient_id uuid, p_lines jsonb, p_plan_item_ids uuid[] DEFAULT '{}'::uuid[], p_note text DEFAULT NULL::text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_id uuid; v_sub numeric := 0; v_line jsonb; v_qty integer; v_price numeric; v_patient text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF NOT (coalesce(get_org_role(auth.uid(), p_org_id)::text,'') IN ('owner','admin','dentist','hygienist','receptionist','nurse') OR is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Not allowed to create visit invoices'; END IF;
  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = p_patient_id AND org_id = p_org_id) THEN RAISE EXCEPTION 'Patient not found'; END IF;
  IF jsonb_array_length(coalesce(p_lines,'[]'::jsonb)) = 0 THEN RAISE EXCEPTION 'Nothing to bill'; END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_qty := greatest(coalesce((v_line->>'quantity')::integer, 1), 1);
    v_price := greatest(coalesce((v_line->>'unit_price')::numeric, 0), 0);
    v_sub := v_sub + v_qty * v_price;
  END LOOP;

  INSERT INTO invoices (org_id, patient_id, invoice_number, status, subtotal, total, notes, due_date)
  VALUES (p_org_id, p_patient_id, 'INV-' || (extract(epoch from clock_timestamp())*1000)::bigint, 'pending', v_sub, v_sub,
          coalesce(nullif(trim(p_note),''), 'Ready for payment — sent from visit'), CURRENT_DATE + 30)
  RETURNING id INTO v_id;

  INSERT INTO invoice_items (invoice_id, treatment_id, description, quantity, unit_price, line_total, tooth_number, surfaces, cdt_code, provider_id)
  SELECT v_id,
    CASE WHEN l->>'treatment_id' ~* '^[0-9a-f-]{36}$' AND EXISTS (SELECT 1 FROM treatments t WHERE t.id = (l->>'treatment_id')::uuid AND t.org_id = p_org_id) THEN (l->>'treatment_id')::uuid END,
    left(coalesce(nullif(trim(l->>'description'),''),'Treatment'), 300),
    greatest(coalesce((l->>'quantity')::integer,1),1),
    greatest(coalesce((l->>'unit_price')::numeric,0),0),
    greatest(coalesce((l->>'quantity')::integer,1),1) * greatest(coalesce((l->>'unit_price')::numeric,0),0),
    nullif(trim(l->>'tooth_number'),''), nullif(trim(l->>'surfaces'),''), nullif(upper(trim(l->>'cdt_code')),''),
    CASE WHEN l->>'provider_id' ~* '^[0-9a-f-]{36}$' AND EXISTS (SELECT 1 FROM staff s WHERE s.id = (l->>'provider_id')::uuid AND s.org_id = p_org_id) THEN (l->>'provider_id')::uuid END
  FROM jsonb_array_elements(p_lines) l;

  UPDATE treatment_plan_items i
  SET notes = trim(coalesce(i.notes,'') || ' [invoiced] ' || CURRENT_DATE::text)
  FROM treatment_plans p
  WHERE i.id = ANY(coalesce(p_plan_item_ids,'{}')) AND p.id = i.plan_id AND p.org_id = p_org_id AND p.patient_id = p_patient_id
    AND coalesce(i.notes,'') NOT LIKE '%[invoiced]%';

  SELECT trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')) INTO v_patient FROM patients WHERE id = p_patient_id;
  INSERT INTO notifications (org_id, user_id, type, title, message, link)
  SELECT p_org_id, m.user_id, 'billing', 'Ready for payment',
         coalesce(v_patient,'Patient') || ' · ' || to_char(v_sub, 'FM999,999,999,990') || ' — invoice waiting at the front desk', NULL
  FROM org_members m
  WHERE m.org_id = p_org_id AND m.role::text IN ('owner','admin','receptionist','accountant','manager') AND m.user_id <> auth.uid();

  RETURN v_id;
END $function$;
