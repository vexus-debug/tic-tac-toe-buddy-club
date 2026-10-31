CREATE OR REPLACE FUNCTION public.lab_use_stock_lot(p_case_id uuid, p_stock_id uuid, p_units numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c public.lab_cases; s public.lab_records; new_id uuid; left_qty numeric; min_q numeric;
BEGIN
  SELECT * INTO c FROM public.lab_cases WHERE id = p_case_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Case not found'; END IF;
  IF NOT (public.has_org_access(auth.uid(), c.org_id) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'You do not have permission to use stock on this case';
  END IF;
  SELECT * INTO s FROM public.lab_records WHERE id = p_stock_id AND kind = 'materials' AND org_id = c.org_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock lot not found'; END IF;
  IF p_units IS NULL OR p_units <= 0 THEN RAISE EXCEPTION 'Units used must be more than zero'; END IF;
  IF s.status = 'recalled' THEN RAISE EXCEPTION 'This lot is recalled and cannot be used'; END IF;
  IF s.record_date IS NOT NULL AND s.record_date < current_date THEN RAISE EXCEPTION 'This lot expired on %', s.record_date; END IF;
  IF COALESCE(s.amount,0) < p_units THEN RAISE EXCEPTION 'Only % left in stock', COALESCE(s.amount,0); END IF;
  left_qty := s.amount - p_units;
  min_q := COALESCE(NULLIF(s.data->>'min_stock','')::numeric, 0);
  UPDATE public.lab_records SET amount = left_qty,
    status = CASE WHEN left_qty <= 0 THEN 'used up' WHEN left_qty <= min_q THEN 'low' ELSE 'in stock' END,
    updated_at = now()
  WHERE id = s.id;
  INSERT INTO public.lab_records(org_id, kind, case_id, title, status, amount, record_date, data)
  VALUES (c.org_id, 'material_lot', c.id, COALESCE(s.title,'') || ' · ' || COALESCE(s.data->>'lot',''), 'used', p_units, current_date,
    jsonb_build_object('material', s.title, 'manufacturer', COALESCE(s.data->>'brand',''), 'lot', COALESCE(s.data->>'lot',''),
      'shade', COALESCE(s.data->>'spec',''), 'expiry', s.record_date, 'stock_id', s.id, 'units', p_units))
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.lab_return_stock_lot(p_usage_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u public.lab_records; s public.lab_records; back_qty numeric; min_q numeric;
BEGIN
  SELECT * INTO u FROM public.lab_records WHERE id = p_usage_id AND kind = 'material_lot' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lot usage not found'; END IF;
  IF NOT (public.has_org_access(auth.uid(), u.org_id) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'You do not have permission to change this case';
  END IF;
  IF (u.data->>'stock_id') IS NOT NULL THEN
    SELECT * INTO s FROM public.lab_records WHERE id = (u.data->>'stock_id')::uuid AND org_id = u.org_id FOR UPDATE;
    IF FOUND THEN
      back_qty := COALESCE(s.amount,0) + COALESCE(NULLIF(u.data->>'units','')::numeric, u.amount, 0);
      min_q := COALESCE(NULLIF(s.data->>'min_stock','')::numeric, 0);
      UPDATE public.lab_records SET amount = back_qty,
        status = CASE WHEN s.status = 'recalled' THEN 'recalled' WHEN back_qty <= 0 THEN 'used up' WHEN back_qty <= min_q THEN 'low' ELSE 'in stock' END,
        updated_at = now()
      WHERE id = s.id;
    END IF;
  END IF;
  DELETE FROM public.lab_records WHERE id = u.id;
END $$;

REVOKE ALL ON FUNCTION public.lab_use_stock_lot(uuid, uuid, numeric) FROM public, anon;
REVOKE ALL ON FUNCTION public.lab_return_stock_lot(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.lab_use_stock_lot(uuid, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lab_return_stock_lot(uuid) TO authenticated;