
-- =============================================
-- BATCH 2: Finance Tables
-- =============================================

-- 9. invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  patient_id uuid REFERENCES public.patients(id),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_org ON public.invoices(org_id);
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view invoices" ON public.invoices FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Finance staff can manage invoices" ON public.invoices FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','receptionist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','receptionist') OR is_super_admin(auth.uid())
);

-- 10. invoice_items
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES public.treatments(id),
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  line_total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE POLICY "Members can view invoice items" ON public.invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND has_org_access(auth.uid(), i.org_id))
);
CREATE POLICY "Finance staff can manage invoice items" ON public.invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (
    get_org_role(auth.uid(), i.org_id) IN ('owner','admin','accountant','receptionist') OR is_super_admin(auth.uid())
  ))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (
    get_org_role(auth.uid(), i.org_id) IN ('owner','admin','accountant','receptionist') OR is_super_admin(auth.uid())
  ))
);

-- 11. payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id),
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_org ON public.payments(org_id);

CREATE POLICY "Members can view payments" ON public.payments FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Finance staff can manage payments" ON public.payments FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','receptionist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','receptionist') OR is_super_admin(auth.uid())
);

-- 12. expenses
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  vendor text,
  payment_method text,
  receipt_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_org ON public.expenses(org_id);
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view expenses" ON public.expenses FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Finance staff can manage expenses" ON public.expenses FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant') OR is_super_admin(auth.uid())
);

-- 13. registration_fees
CREATE TABLE public.registration_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id),
  amount numeric(10,2) NOT NULL,
  payment_method text DEFAULT 'cash',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_registration_fees_org ON public.registration_fees(org_id);

CREATE POLICY "Members can view registration fees" ON public.registration_fees FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Staff can manage registration fees" ON public.registration_fees FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','receptionist') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant','receptionist') OR is_super_admin(auth.uid())
);

-- 14. revenue_allocation_rules
CREATE TABLE public.revenue_allocation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category text NOT NULL,
  percentage numeric(5,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rev_alloc_rules_org ON public.revenue_allocation_rules(org_id);
CREATE TRIGGER update_rev_alloc_rules_updated_at BEFORE UPDATE ON public.revenue_allocation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view allocation rules" ON public.revenue_allocation_rules FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage allocation rules" ON public.revenue_allocation_rules FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
);

-- 15. staff_allocation_rules
CREATE TABLE public.staff_allocation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id),
  category text NOT NULL,
  percentage numeric(5,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_alloc_rules_org ON public.staff_allocation_rules(org_id);
CREATE TRIGGER update_staff_alloc_rules_updated_at BEFORE UPDATE ON public.staff_allocation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE POLICY "Members can view staff allocation rules" ON public.staff_allocation_rules FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage staff allocation rules" ON public.staff_allocation_rules FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin') OR is_super_admin(auth.uid())
);

-- 16. revenue_allocations
CREATE TABLE public.revenue_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id),
  rule_id uuid REFERENCES public.revenue_allocation_rules(id),
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  allocation_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rev_alloc_org ON public.revenue_allocations(org_id);

CREATE POLICY "Members can view allocations" ON public.revenue_allocations FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage allocations" ON public.revenue_allocations FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant') OR is_super_admin(auth.uid())
);

-- 17. staff_revenue_allocations
CREATE TABLE public.staff_revenue_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id),
  invoice_id uuid REFERENCES public.invoices(id),
  rule_id uuid REFERENCES public.staff_allocation_rules(id),
  amount numeric(10,2) NOT NULL,
  allocation_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_rev_alloc_org ON public.staff_revenue_allocations(org_id);

CREATE POLICY "Members can view staff allocations" ON public.staff_revenue_allocations FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage staff allocations" ON public.staff_revenue_allocations FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant') OR is_super_admin(auth.uid())
);

-- 18. war_chest_entries
CREATE TABLE public.war_chest_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  source text,
  description text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_war_chest_org ON public.war_chest_entries(org_id);

CREATE POLICY "Members can view war chest" ON public.war_chest_entries FOR SELECT USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Admins can manage war chest" ON public.war_chest_entries FOR ALL USING (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant') OR is_super_admin(auth.uid())
) WITH CHECK (
  get_org_role(auth.uid(), org_id) IN ('owner','admin','accountant') OR is_super_admin(auth.uid())
);
