CREATE OR REPLACE FUNCTION public.create_visit_invoice(p_org_id uuid, p_patient_id uuid, p_lines jsonb, p_plan_item_ids uuid[] DEFAULT '{}', p_note text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_id uuid; v_sub numeric := 0; v_line jsonb; v_qty integer; v_price numeric; v_name text; v_patient text;
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

  INSERT INTO invoices (org_id, patient_id, invoice_number, status, subtotal, total, notes)
  VALUES (p_org_id, p_patient_id, 'INV-' || (extract(epoch from clock_timestamp())*1000)::bigint, 'pending', v_sub, v_sub,
          coalesce(nullif(trim(p_note),''), 'Ready for payment — sent from visit'))
  RETURNING id INTO v_id;

  INSERT INTO invoice_items (invoice_id, treatment_id, description, quantity, unit_price, line_total)
  SELECT v_id,
    CASE WHEN l->>'treatment_id' ~* '^[0-9a-f-]{36}$' AND EXISTS (SELECT 1 FROM treatments t WHERE t.id = (l->>'treatment_id')::uuid AND t.org_id = p_org_id) THEN (l->>'treatment_id')::uuid END,
    left(coalesce(nullif(trim(l->>'description'),''),'Treatment'), 300),
    greatest(coalesce((l->>'quantity')::integer,1),1),
    greatest(coalesce((l->>'unit_price')::numeric,0),0),
    greatest(coalesce((l->>'quantity')::integer,1),1) * greatest(coalesce((l->>'unit_price')::numeric,0),0)
  FROM jsonb_array_elements(p_lines) l;

  UPDATE treatment_plan_items i
  SET notes = trim(coalesce(i.notes,'') || ' [invoiced] ' || CURRENT_DATE::text)
  FROM treatment_plans p
  WHERE i.id = ANY(coalesce(p_plan_item_ids,'{}')) AND p.id = i.plan_id AND p.org_id = p_org_id AND p.patient_id = p_patient_id
    AND coalesce(i.notes,'') NOT LIKE '%[invoiced]%';

  SELECT trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')) INTO v_patient FROM patients WHERE id = p_patient_id;
  INSERT INTO notifications (org_id, user_id, type, title, message, link)
  SELECT p_org_id, m.user_id, 'billing', 'Ready for payment',
         coalesce(v_patient,'Patient') || ' · ₦' || to_char(v_sub, 'FM999,999,999,990') || ' — invoice waiting at the front desk', NULL
  FROM org_members m
  WHERE m.org_id = p_org_id AND m.role::text IN ('owner','admin','receptionist','accountant','manager') AND m.user_id <> auth.uid();

  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.create_visit_invoice(uuid, uuid, jsonb, uuid[], text) TO authenticated;