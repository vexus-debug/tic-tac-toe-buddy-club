ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS other_org_id uuid REFERENCES public.organizations(id), ADD COLUMN IF NOT EXISTS transfer_id uuid, ADD COLUMN IF NOT EXISTS balance_before integer, ADD COLUMN IF NOT EXISTS balance_after integer;
CREATE INDEX IF NOT EXISTS inventory_transactions_org_date_idx ON public.inventory_transactions (org_id, created_at DESC);
CREATE OR REPLACE FUNCTION public.record_inventory_movement(p_org_id uuid, p_inventory_id uuid, p_type text, p_quantity integer, p_unit_cost numeric DEFAULT NULL, p_reference text DEFAULT NULL, p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_item public.inventory%ROWTYPE; v_before integer; v_after integer; v_id uuid; v_role public.org_role;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 v_role := public.get_org_role(auth.uid(), p_org_id);
 IF v_role NOT IN ('owner','admin','receptionist','dentist','assistant','hygienist') AND NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Not allowed to change stock'; END IF;
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
END $$;
REVOKE ALL ON FUNCTION public.record_inventory_movement(uuid,uuid,text,integer,numeric,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_inventory_movement(uuid,uuid,text,integer,numeric,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.transfer_inventory_stock(p_source_org_id uuid, p_inventory_id uuid, p_target_org_id uuid, p_quantity integer, p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_source public.inventory%ROWTYPE; v_target public.inventory%ROWTYPE; v_parent uuid; v_source_parent uuid; v_target_parent uuid; v_transfer uuid := gen_random_uuid(); v_role public.org_role;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 v_role := public.get_org_role(auth.uid(), p_source_org_id);
 IF v_role NOT IN ('owner','admin') AND NOT public.is_super_admin(auth.uid()) THEN RAISE EXCEPTION 'Only owners and admins can transfer stock'; END IF;
 IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 100000000 OR p_source_org_id = p_target_org_id THEN RAISE EXCEPTION 'Invalid transfer'; END IF;
 SELECT parent_org_id INTO v_source_parent FROM public.organizations WHERE id = p_source_org_id;
 SELECT parent_org_id INTO v_target_parent FROM public.organizations WHERE id = p_target_org_id;
 IF NOT FOUND OR coalesce(v_source_parent,p_source_org_id) <> coalesce(v_target_parent,p_target_org_id) OR NOT (v_source_parent IS NOT NULL OR v_target_parent IS NOT NULL) THEN RAISE EXCEPTION 'Destination must be a branch of the same clinic'; END IF;
 IF NOT public.has_org_access(auth.uid(), p_target_org_id) THEN RAISE EXCEPTION 'No access to destination branch'; END IF;
 SELECT * INTO v_source FROM public.inventory WHERE id = p_inventory_id AND org_id = p_source_org_id FOR UPDATE;
 IF NOT FOUND OR v_source.quantity < p_quantity THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_target_org_id::text || ':' || lower(v_source.name) || ':' || lower(v_source.unit) || ':' || lower(v_source.category), 0));
 SELECT * INTO v_target FROM public.inventory WHERE org_id = p_target_org_id AND lower(name) = lower(v_source.name) AND lower(unit) = lower(v_source.unit) AND lower(category) = lower(v_source.category) ORDER BY created_at LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN
   INSERT INTO public.inventory(org_id,name,category,unit,quantity,min_stock,supplier,unit_cost,expiry_date,last_restocked)
   VALUES(p_target_org_id,v_source.name,v_source.category,v_source.unit,0,v_source.min_stock,v_source.supplier,v_source.unit_cost,v_source.expiry_date,CURRENT_DATE) RETURNING * INTO v_target;
 END IF;
 UPDATE public.inventory SET quantity = quantity - p_quantity WHERE id = v_source.id;
 UPDATE public.inventory SET quantity = quantity + p_quantity, last_restocked = CURRENT_DATE WHERE id = v_target.id;
 INSERT INTO public.inventory_transactions(org_id,inventory_id,transaction_type,quantity,unit_cost,total_cost,reference,notes,created_by,other_org_id,transfer_id,balance_before,balance_after)
 VALUES (p_source_org_id,v_source.id,'transfer_out',p_quantity,coalesce(v_source.unit_cost,0),p_quantity*coalesce(v_source.unit_cost,0), 'Branch transfer',nullif(trim(p_notes),''),auth.uid(),p_target_org_id,v_transfer,v_source.quantity,v_source.quantity-p_quantity),
 (p_target_org_id,v_target.id,'transfer_in',p_quantity,coalesce(v_source.unit_cost,0),p_quantity*coalesce(v_source.unit_cost,0), 'Branch transfer',nullif(trim(p_notes),''),auth.uid(),p_source_org_id,v_transfer,v_target.quantity,v_target.quantity+p_quantity);
 RETURN v_transfer;
END $$;
REVOKE ALL ON FUNCTION public.transfer_inventory_stock(uuid,uuid,uuid,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_inventory_stock(uuid,uuid,uuid,integer,text) TO authenticated;
DROP POLICY IF EXISTS "Users can manage inventory transactions in their org" ON public.inventory_transactions;
CREATE POLICY "Members can read inventory history" ON public.inventory_transactions FOR SELECT TO authenticated USING (public.has_org_access(auth.uid(),org_id));
CREATE POLICY "Members can record inventory history" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (public.has_org_access(auth.uid(),org_id));