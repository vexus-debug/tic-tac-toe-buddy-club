CREATE OR REPLACE FUNCTION public.consume_plan_item_materials()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r record; v_qty integer; v_before integer; v_org uuid; v_patient uuid; v_ref text;
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') AND NEW.treatment_id IS NOT NULL THEN
    SELECT org_id, patient_id INTO v_org, v_patient FROM public.treatment_plans WHERE id = NEW.plan_id;
    IF v_org IS NULL THEN RETURN NEW; END IF;
    v_ref := 'Plan item ' || NEW.id::text;
    IF EXISTS (SELECT 1 FROM public.inventory_transactions WHERE org_id = v_org AND reference = v_ref) THEN RETURN NEW; END IF;
    -- Skip when today's completed appointment for the same treatment already consumed stock.
    IF EXISTS (SELECT 1 FROM public.inventory_transactions WHERE org_id = v_org AND patient_id = v_patient AND treatment_id = NEW.treatment_id AND transaction_type = 'usage' AND appointment_id IS NOT NULL AND created_at::date = CURRENT_DATE) THEN RETURN NEW; END IF;
    FOR r IN SELECT tm.inventory_id, tm.quantity_used, i.quantity, i.unit_cost
             FROM public.treatment_materials tm JOIN public.inventory i ON i.id = tm.inventory_id
             WHERE tm.treatment_id = NEW.treatment_id AND tm.org_id = v_org FOR UPDATE OF i LOOP
      v_qty := ceil(r.quantity_used)::integer;
      IF v_qty <= 0 OR r.quantity < v_qty THEN CONTINUE; END IF;
      v_before := r.quantity;
      UPDATE public.inventory SET quantity = v_before - v_qty WHERE id = r.inventory_id;
      INSERT INTO public.inventory_transactions(org_id, inventory_id, transaction_type, quantity, unit_cost, total_cost, reference, created_by, balance_before, balance_after, treatment_id, patient_id)
      VALUES (v_org, r.inventory_id, 'usage', v_qty, coalesce(r.unit_cost,0), v_qty * coalesce(r.unit_cost,0), v_ref, auth.uid(), v_before, v_before - v_qty, NEW.treatment_id, v_patient);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_consume_plan_item_materials ON public.treatment_plan_items;
CREATE TRIGGER trg_consume_plan_item_materials
AFTER INSERT OR UPDATE OF status ON public.treatment_plan_items
FOR EACH ROW EXECUTE FUNCTION public.consume_plan_item_materials();