
-- Phase 4: Operational Enhancements

-- 1. Suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view suppliers" ON public.suppliers FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role])) OR is_super_admin(auth.uid())) WITH CHECK ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role])) OR is_super_admin(auth.uid()));

-- 2. Waiting list queue
CREATE TABLE public.waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'waiting',
  check_in_time timestamptz NOT NULL DEFAULT now(),
  called_time timestamptz,
  seen_time timestamptz,
  completed_time timestamptz,
  chair text,
  priority integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view waiting list" ON public.waiting_list FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Staff can manage waiting list" ON public.waiting_list FOR ALL USING (has_org_access(auth.uid(), org_id)) WITH CHECK (has_org_access(auth.uid(), org_id));

-- 3. Dentist schedules
CREATE TABLE public.dentist_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  break_start time,
  break_end time,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, day_of_week)
);
ALTER TABLE public.dentist_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view schedules" ON public.dentist_schedules FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage schedules" ON public.dentist_schedules FOR ALL USING ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'dentist'::org_role])) OR is_super_admin(auth.uid())) WITH CHECK ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'dentist'::org_role])) OR is_super_admin(auth.uid()));

-- 4. Purchase orders
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  order_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_date date,
  received_date date,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view purchase orders" ON public.purchase_orders FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage purchase orders" ON public.purchase_orders FOR ALL USING ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'receptionist'::org_role])) OR is_super_admin(auth.uid())) WITH CHECK ((get_org_role(auth.uid(), org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'receptionist'::org_role])) OR is_super_admin(auth.uid()));

CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view PO items" ON public.purchase_order_items FOR SELECT USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.po_id AND has_org_access(auth.uid(), po.org_id)));
CREATE POLICY "Admins can manage PO items" ON public.purchase_order_items FOR ALL USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.po_id AND ((get_org_role(auth.uid(), po.org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'receptionist'::org_role])) OR is_super_admin(auth.uid())))) WITH CHECK (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.po_id AND ((get_org_role(auth.uid(), po.org_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'receptionist'::org_role])) OR is_super_admin(auth.uid()))));

-- 5. Add expiry_date to inventory
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS expiry_date date;

-- 6. Treatment-to-material usage mapping
CREATE TABLE public.treatment_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  quantity_used numeric NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.treatment_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view treatment materials" ON public.treatment_materials FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Staff can manage treatment materials" ON public.treatment_materials FOR ALL USING (has_org_access(auth.uid(), org_id)) WITH CHECK (has_org_access(auth.uid(), org_id));
