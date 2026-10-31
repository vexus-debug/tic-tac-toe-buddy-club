ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS preferred_supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reorder_qty integer,
  ADD COLUMN IF NOT EXISTS batch_no text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS sku text;

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS rating integer CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS categories text[];

ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS received_qty integer NOT NULL DEFAULT 0;

ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS po_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS treatment_id uuid REFERENCES public.treatments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS inventory_transactions_po_idx ON public.inventory_transactions(po_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_appt_idx ON public.inventory_transactions(appointment_id);

-- Match existing typed supplier names
UPDATE public.inventory i SET preferred_supplier_id = s.id
FROM public.suppliers s
WHERE i.preferred_supplier_id IS NULL AND i.supplier IS NOT NULL
  AND s.org_id = i.org_id AND lower(trim(s.name)) = lower(trim(i.supplier));

-- Receive purchase order lines
CREATE OR REPLACE FUNCTION public.receive_purchase_order(p_po_id uuid, p_lines jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_po public.purchase_orders%ROWTYPE; v_line jsonb; v_item public.purchase_order_items%ROWTYPE;
  v_qty integer; v_inv public.inventory%ROWTYPE; v_before integer; v_status text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found'; END IF;
  IF NOT (public.get_org_role(auth.uid(), v_po.org_id) = ANY (ARRAY['owner'::org_role,'admin'::org_role,'receptionist'::org_role]) OR public.is_super_admin(auth.uid())) THEN
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
END $$;
REVOKE ALL ON FUNCTION public.receive_purchase_order(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.receive_purchase_order(uuid, jsonb) TO authenticated;

-- Deduct treatment materials when an appointment is completed
CREATE OR REPLACE FUNCTION public.consume_treatment_materials()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; v_qty integer; v_before integer;
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') AND NEW.treatment_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.inventory_transactions WHERE appointment_id = NEW.id AND transaction_type = 'usage') THEN RETURN NEW; END IF;
    FOR r IN SELECT tm.inventory_id, tm.quantity_used, i.quantity, i.unit_cost
             FROM public.treatment_materials tm JOIN public.inventory i ON i.id = tm.inventory_id
             WHERE tm.treatment_id = NEW.treatment_id AND tm.org_id = NEW.org_id FOR UPDATE OF i LOOP
      v_qty := ceil(r.quantity_used)::integer;
      IF v_qty <= 0 OR r.quantity < v_qty THEN CONTINUE; END IF;
      v_before := r.quantity;
      UPDATE public.inventory SET quantity = v_before - v_qty WHERE id = r.inventory_id;
      INSERT INTO public.inventory_transactions(org_id, inventory_id, transaction_type, quantity, unit_cost, total_cost, reference, created_by, balance_before, balance_after, treatment_id, patient_id, appointment_id)
      VALUES (NEW.org_id, r.inventory_id, 'usage', v_qty, coalesce(r.unit_cost,0), v_qty * coalesce(r.unit_cost,0), 'Treatment use', auth.uid(), v_before, v_before - v_qty, NEW.treatment_id, NEW.patient_id, NEW.id);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_consume_treatment_materials ON public.appointments;
CREATE TRIGGER trg_consume_treatment_materials AFTER INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.consume_treatment_materials();