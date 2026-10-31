
-- =============================================
-- PHASE 2: Financial Upgrades - Database Schema
-- =============================================

-- 1. Payment Plans table
CREATE TABLE public.payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  patient_id UUID REFERENCES public.patients(id),
  plan_name TEXT NOT NULL DEFAULT 'Payment Plan',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  installment_count INTEGER NOT NULL DEFAULT 1,
  installment_amount NUMERIC NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly', -- weekly, biweekly, monthly
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled, defaulted
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payment plans in their org" ON public.payment_plans
  FOR ALL USING (public.has_org_access(auth.uid(), org_id));

CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON public.payment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Payment plan installments
CREATE TABLE public.payment_plan_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_id UUID REFERENCES public.payments(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue, waived
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_plan_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage installments via plan org" ON public.payment_plan_installments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.payment_plans pp WHERE pp.id = plan_id AND public.has_org_access(auth.uid(), pp.org_id))
  );

-- 2. Treatment Estimates table
CREATE TABLE public.treatment_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  estimate_number TEXT NOT NULL,
  estimate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, accepted, declined, expired, converted
  valid_until DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  converted_invoice_id UUID REFERENCES public.invoices(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage estimates in their org" ON public.treatment_estimates
  FOR ALL USING (public.has_org_access(auth.uid(), org_id));

CREATE TRIGGER update_treatment_estimates_updated_at
  BEFORE UPDATE ON public.treatment_estimates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Treatment estimate line items
CREATE TABLE public.treatment_estimate_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.treatment_estimates(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_estimate_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage estimate items via estimate org" ON public.treatment_estimate_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.treatment_estimates te WHERE te.id = estimate_id AND public.has_org_access(auth.uid(), te.org_id))
  );

-- 3. Commission Payouts table
CREATE TABLE public.commission_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  staff_id UUID NOT NULL REFERENCES public.staff(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid, disputed
  payment_date DATE,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage commission payouts in their org" ON public.commission_payouts
  FOR ALL USING (public.has_org_access(auth.uid(), org_id));

CREATE TRIGGER update_commission_payouts_updated_at
  BEFORE UPDATE ON public.commission_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Add unit_cost column to inventory for cost analytics
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0;

-- 5. Inventory transactions for cost tracking
CREATE TABLE public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- purchase, usage, adjustment, return
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage inventory transactions in their org" ON public.inventory_transactions
  FOR ALL USING (public.has_org_access(auth.uid(), org_id));
