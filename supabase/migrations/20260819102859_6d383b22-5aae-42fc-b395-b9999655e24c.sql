DO $$
DECLARE
  v_org uuid := 'e51dc03c-0fd5-4db9-9e61-9cce4c265d44';
  v_i int;
  v_date date;
  v_patient uuid;
  v_tx record;
  v_qty int;
  v_subtotal numeric;
  v_discount numeric;
  v_total numeric;
  v_status text;
  v_paid numeric;
  v_inv uuid;
  v_rule record;
  v_staff uuid;
  v_pool numeric;
  v_m int;
  v_mstart date;
  v_dentist record;
  v_amt numeric;
  v_pat record;
BEGIN
  IF EXISTS (SELECT 1 FROM public.invoices WHERE org_id = v_org) THEN
    RAISE NOTICE 'Demo finance data already seeded';
    RETURN;
  END IF;

  FOR v_i IN 1..110 LOOP
    v_date := CURRENT_DATE - (random() * 175)::int;
    SELECT id INTO v_patient FROM public.patients WHERE org_id = v_org ORDER BY random() LIMIT 1;
    SELECT id, name, COALESCE(price, 25000) AS price INTO v_tx
      FROM public.treatments WHERE org_id = v_org ORDER BY random() LIMIT 1;

    v_qty := 1 + (random() * 1)::int;
    v_subtotal := v_tx.price * v_qty;
    v_discount := CASE WHEN random() < 0.2 THEN round(v_subtotal * 0.05, 2) ELSE 0 END;
    v_total := v_subtotal - v_discount;

    v_status := CASE
      WHEN random() < 0.68 THEN 'paid'
      WHEN random() < 0.65 THEN 'partial'
      ELSE 'pending' END;
    v_paid := CASE v_status WHEN 'paid' THEN v_total WHEN 'partial' THEN round(v_total * 0.5, 2) ELSE 0 END;

    INSERT INTO public.invoices (org_id, invoice_number, patient_id, invoice_date, due_date, status,
                                 subtotal, discount, tax, total, payment_method, created_at)
    VALUES (v_org, 'INV-' || to_char(v_date, 'YYYYMM') || '-' || lpad(v_i::text, 4, '0'), v_patient, v_date,
            v_date + 14, v_status, v_subtotal, v_discount, 0, v_total,
            (ARRAY['cash','card','transfer','pos'])[1 + (random() * 3)::int], v_date::timestamptz)
    RETURNING id INTO v_inv;

    INSERT INTO public.invoice_items (invoice_id, treatment_id, description, quantity, unit_price, line_total)
    VALUES (v_inv, v_tx.id, v_tx.name, v_qty, v_tx.price, v_subtotal);

    IF v_paid > 0 THEN
      INSERT INTO public.payments (org_id, invoice_id, amount, payment_method, payment_date, reference, created_at)
      VALUES (v_org, v_inv, v_paid, (ARRAY['cash','card','transfer','pos'])[1 + (random() * 3)::int],
              v_date, 'PAY-' || lpad(v_i::text, 5, '0'), v_date::timestamptz);

      -- clinic-level revenue allocations
      FOR v_rule IN
        SELECT id, category, percentage FROM public.revenue_allocation_rules
        WHERE org_id = v_org AND is_active
      LOOP
        v_amt := round(v_paid * v_rule.percentage / 100.0, 2);
        INSERT INTO public.revenue_allocations (org_id, invoice_id, rule_id, category, amount, allocation_date, created_at)
        VALUES (v_org, v_inv, v_rule.id, v_rule.category, v_amt, v_date, v_date::timestamptz);

        IF v_rule.category = 'Clinical Savings' THEN
          INSERT INTO public.war_chest_entries (org_id, amount, source, description, entry_date, created_at)
          VALUES (v_org, v_amt, 'Clinical Savings', 'Auto allocation from invoice payment', v_date, v_date::timestamptz);
        END IF;
      END LOOP;

      -- staff share of the volume bonus pool
      v_pool := round(v_paid * 0.15, 2);
      FOR v_rule IN
        SELECT id, category, percentage FROM public.staff_allocation_rules WHERE org_id = v_org
      LOOP
        SELECT id INTO v_staff FROM public.staff
        WHERE org_id = v_org
          AND role = CASE
            WHEN v_rule.category ILIKE '%dentist%' THEN 'dentist'
            WHEN v_rule.category ILIKE '%hygienist%' THEN 'hygienist'
            WHEN v_rule.category ILIKE '%recept%' THEN 'receptionist'
            ELSE 'admin' END
        ORDER BY random() LIMIT 1;

        IF v_staff IS NOT NULL THEN
          INSERT INTO public.staff_revenue_allocations (org_id, staff_id, invoice_id, rule_id, amount, allocation_date, created_at)
          VALUES (v_org, v_staff, v_inv, v_rule.id, round(v_pool * v_rule.percentage / 100.0, 2), v_date, v_date::timestamptz);
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- monthly operating expenses for the last 6 months
  FOR v_m IN 0..5 LOOP
    v_mstart := date_trunc('month', CURRENT_DATE - (v_m || ' months')::interval)::date;

    INSERT INTO public.expenses (org_id, expense_date, category, amount, description, vendor, payment_method, created_at)
    VALUES
      (v_org, v_mstart + 1,  'rent',               450000, 'Monthly clinic rent',            'Marina Properties Ltd', 'transfer', (v_mstart + 1)::timestamptz),
      (v_org, v_mstart + 2,  'salaries',           1850000 + (random() * 150000)::int, 'Staff payroll', 'Payroll',    'transfer', (v_mstart + 2)::timestamptz),
      (v_org, v_mstart + 4,  'dental_consumables', 320000 + (random() * 90000)::int,  'Composites, burs, anaesthetics', 'DentSupply NG', 'card', (v_mstart + 4)::timestamptz),
      (v_org, v_mstart + 8,  'utilities',          145000 + (random() * 40000)::int,  'Power, water and diesel',       'Ikeja Electric', 'transfer', (v_mstart + 8)::timestamptz),
      (v_org, v_mstart + 11, 'lab_outsourcing',    240000 + (random() * 120000)::int, 'Crowns and dentures',           'Precision Dental Lab', 'transfer', (v_mstart + 11)::timestamptz),
      (v_org, v_mstart + 14, 'marketing',          95000 + (random() * 60000)::int,   'Social ads and referrals',      'Meta Ads',       'card', (v_mstart + 14)::timestamptz),
      (v_org, v_mstart + 18, 'maintenance',        70000 + (random() * 50000)::int,   'Chair and compressor servicing','ProCare Services','cash', (v_mstart + 18)::timestamptz),
      (v_org, v_mstart + 22, 'supplies',           85000 + (random() * 40000)::int,   'Office and sterilisation supplies','ShopRite',    'cash', (v_mstart + 22)::timestamptz);
  END LOOP;

  -- commission payouts per dentist per month, based on their allocations
  FOR v_m IN 0..5 LOOP
    v_mstart := date_trunc('month', CURRENT_DATE - (v_m || ' months')::interval)::date;
    FOR v_dentist IN
      SELECT id FROM public.staff WHERE org_id = v_org AND role IN ('dentist', 'hygienist')
    LOOP
      SELECT COALESCE(sum(amount), 0) INTO v_amt
      FROM public.staff_revenue_allocations
      WHERE org_id = v_org AND staff_id = v_dentist.id
        AND allocation_date BETWEEN v_mstart AND (v_mstart + interval '1 month - 1 day')::date;

      IF v_amt > 0 THEN
        INSERT INTO public.commission_payouts (org_id, staff_id, period_start, period_end, calculated_amount,
                                               paid_amount, status, payment_date, payment_method, reference, created_at)
        VALUES (v_org, v_dentist.id, v_mstart, (v_mstart + interval '1 month - 1 day')::date, round(v_amt, 2),
                CASE WHEN v_m = 0 THEN 0 ELSE round(v_amt, 2) END,
                CASE WHEN v_m = 0 THEN 'pending' ELSE 'paid' END,
                CASE WHEN v_m = 0 THEN NULL ELSE (v_mstart + interval '1 month')::date END,
                CASE WHEN v_m = 0 THEN NULL ELSE 'transfer' END,
                'COM-' || to_char(v_mstart, 'YYYYMM'), v_mstart::timestamptz);
      END IF;
    END LOOP;
  END LOOP;

  -- registration fees for existing patients
  FOR v_pat IN SELECT id, created_at FROM public.patients WHERE org_id = v_org LOOP
    INSERT INTO public.registration_fees (org_id, patient_id, amount, payment_method, payment_date, receipt_number, created_at)
    VALUES (v_org, v_pat.id, 10000, (ARRAY['cash','transfer','pos'])[1 + (random() * 2)::int],
            v_pat.created_at::date, 'REG-' || substr(replace(v_pat.id::text, '-', ''), 1, 8), v_pat.created_at);
  END LOOP;
END $$;