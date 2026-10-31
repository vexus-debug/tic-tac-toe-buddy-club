ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'procurement_officer';
ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'nurse';

DROP POLICY IF EXISTS "Staff can manage inventory" ON public.inventory;
CREATE POLICY "Staff can manage inventory" ON public.inventory FOR ALL TO authenticated
USING (public.get_org_role(auth.uid(), org_id)::text IN ('owner','admin','receptionist','procurement_officer') OR public.is_super_admin(auth.uid()))
WITH CHECK (public.get_org_role(auth.uid(), org_id)::text IN ('owner','admin','receptionist','procurement_officer') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL TO authenticated
USING (public.get_org_role(auth.uid(), org_id)::text IN ('owner','admin','procurement_officer') OR public.is_super_admin(auth.uid()))
WITH CHECK (public.get_org_role(auth.uid(), org_id)::text IN ('owner','admin','procurement_officer') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage purchase orders" ON public.purchase_orders;
CREATE POLICY "Admins can manage purchase orders" ON public.purchase_orders FOR ALL TO authenticated
USING (public.get_org_role(auth.uid(), org_id)::text IN ('owner','admin','receptionist','procurement_officer') OR public.is_super_admin(auth.uid()))
WITH CHECK (public.get_org_role(auth.uid(), org_id)::text IN ('owner','admin','receptionist','procurement_officer') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage PO items" ON public.purchase_order_items;
CREATE POLICY "Admins can manage PO items" ON public.purchase_order_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.po_id AND (public.get_org_role(auth.uid(), po.org_id)::text IN ('owner','admin','receptionist','procurement_officer') OR public.is_super_admin(auth.uid()))))
WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.po_id AND (public.get_org_role(auth.uid(), po.org_id)::text IN ('owner','admin','receptionist','procurement_officer') OR public.is_super_admin(auth.uid()))));

CREATE OR REPLACE FUNCTION public.record_inventory_movement(p_org_id uuid, p_inventory_id uuid, p_type text, p_quantity integer, p_unit_cost numeric DEFAULT NULL::numeric, p_reference text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_item public.inventory%ROWTYPE; v_before integer; v_after integer; v_id uuid; v_role text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 v_role := public.get_org_role(auth.uid(), p_org_id)::text;
 IF coalesce(v_role,'') NOT IN ('owner','admin','receptionist','dentist','assistant','hygienist','procurement_officer','nurse') AND NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not allowed to change stock'; END IF;
 IF v_role = 'nurse' AND p_type <> 'usage' THEN RAISE EXCEPTION 'Nurses can only record stock usage'; END IF;
 IF p_type NOT IN ('purchase','usage','adjustment','return') OR p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 100000000 THEN RAISE EXCEPTION 'Invalid stock movement'; END IF;
 SELECT * INTO v_item FROM public.inventory WHERE id = p_inventory_id AND org_id = p_org_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Item not found in this clinic'; END IF;
 v_before := v_item.quantity;
 v_after := v_before + CASE WHEN p_type IN ('purchase','return') THEN p_quantity ELSE -p_quantity END;
 IF v_after < 0 THEN RAISE EXCEPTION 'Not enough stock available'; END IF;
 UPDATE public.inventory SET quantity = v_after, unit_cost = CASE WHEN p_type = 'purchase' THEN coalesce(p_unit_cost, unit_cost) ELSE unit_cost END, last_restocked = CASE WHEN p_type IN ('purchase','return') THEN CURRENT_DATE ELSE last_restocked END WHERE id = v_item.id;
 INSERT INTO public.inventory_transactions(org_id, inventory_id, transaction_type, quantity, unit_cost, total_cost, reference, notes, created_by, balance_before, balance_after)
 VALUES (p_org_id, p_inventory_id, p_type, p_quantity, coalesce(p_unit_cost,v_item.unit_cost,0), p_quantity * coalesce(p_unit_cost,v_item.unit_cost,0), nullif(trim(p_reference),''), nullif(trim(p_notes),''), auth.uid(), v_before, v_after) RETURNING id INTO v_id;
 RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION public.receive_purchase_order(p_po_id uuid, p_lines jsonb)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_po public.purchase_orders%ROWTYPE; v_line jsonb; v_item public.purchase_order_items%ROWTYPE;
  v_qty integer; v_inv public.inventory%ROWTYPE; v_before integer; v_status text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found'; END IF;
  IF NOT (coalesce(public.get_org_role(auth.uid(), v_po.org_id)::text,'') IN ('owner','admin','receptionist','procurement_officer') OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Not allowed to receive orders'; END IF;
  IF v_po.status IN ('cancelled','received') THEN RAISE EXCEPTION 'This order is already %', v_po.status; END IF;
  FOR v_line IN SELECT * FROM jsonb_array_elements(coalesce(p_lines,'[]'::jsonb)) LOOP
    v_qty := (v_line->>'qty')::integer;
    IF v_qty IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;
    SELECT * INTO v_item FROM public.purchase_order_items WHERE id = (v_line->>'item_id')::uuid AND po_id = p_po_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order line not found'; END IF;
    IF v_qty > v_item.quantity - v_item.received_qty THEN RAISE EXCEPTION 'Cannot receive more than ordered for %', v_item.item_name; END IF;
    UPDATE public.purchase_order_items SET received_qty = received_qty + v_qty WHERE id = v_item.id;
    IF v_item.inventory_id IS NOT NULL THEN
      SELECT * INTO v_inv FROM public.inventory WHERE id = v_item.inventory_id AND org_id = v_po.org_id FOR UPDATE;
      IF FOUND THEN
        v_before := v_inv.quantity;
        UPDATE public.inventory SET quantity = v_before + v_qty, unit_cost = v_item.unit_cost, last_restocked = CURRENT_DATE,
          preferred_supplier_id = coalesce(preferred_supplier_id, v_po.supplier_id) WHERE id = v_inv.id;
        INSERT INTO public.inventory_transactions(org_id, inventory_id, transaction_type, quantity, unit_cost, total_cost, reference, notes, created_by, balance_before, balance_after, po_id)
        VALUES (v_po.org_id, v_inv.id, 'purchase', v_qty, v_item.unit_cost, v_qty * v_item.unit_cost, 'PO ' || v_po.order_number, NULL, auth.uid(), v_before, v_before + v_qty, v_po.id);
      END IF;
    END IF;
  END LOOP;
  SELECT CASE WHEN bool_and(received_qty >= quantity) THEN 'received'
              WHEN bool_or(received_qty > 0) THEN 'partial' ELSE v_po.status END
    INTO v_status FROM public.purchase_order_items WHERE po_id = p_po_id;
  UPDATE public.purchase_orders SET status = coalesce(v_status, v_po.status),
    received_date = CASE WHEN v_status = 'received' THEN CURRENT_DATE ELSE received_date END
  WHERE id = p_po_id;
  RETURN coalesce(v_status, v_po.status);
END $function$;