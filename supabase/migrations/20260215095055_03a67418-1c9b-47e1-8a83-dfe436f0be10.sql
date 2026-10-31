
-- Inventory table (missing from previous batches)
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  unit text NOT NULL DEFAULT 'pcs',
  quantity integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  supplier text,
  last_restocked date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inventory_org ON public.inventory(org_id);
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view inventory" ON public.inventory FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Staff can manage inventory" ON public.inventory FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','receptionist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','receptionist') OR is_super_admin(auth.uid())
);
