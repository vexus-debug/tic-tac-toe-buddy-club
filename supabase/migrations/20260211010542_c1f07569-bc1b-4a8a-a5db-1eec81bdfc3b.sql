
-- Drop existing trigger
DROP TRIGGER IF EXISTS trg_allocate_revenue ON public.payments;
DROP FUNCTION IF EXISTS public.allocate_revenue_on_payment();

-- Drop existing tables
DROP TABLE IF EXISTS public.war_chest_entries CASCADE;
DROP TABLE IF EXISTS public.revenue_allocations CASCADE;
DROP TABLE IF EXISTS public.revenue_allocation_rules CASCADE;

-- Recreate revenue_allocation_rules
CREATE TABLE public.revenue_allocation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Staff operations allocation rules (sub-split of Base Operations)
CREATE TABLE public.staff_allocation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Revenue allocations per payment
CREATE TABLE public.revenue_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  category text NOT NULL,
  percentage numeric NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Staff allocations per payment (sub-allocation of Base Operations)
CREATE TABLE public.staff_revenue_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  role_title text NOT NULL,
  percentage numeric NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- War chest entries
CREATE TABLE public.war_chest_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  excess_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.revenue_allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_revenue_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_chest_entries ENABLE ROW LEVEL SECURITY;

-- RLS: revenue_allocation_rules (admin only)
CREATE POLICY "Admins can read revenue_allocation_rules" ON public.revenue_allocation_rules FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert revenue_allocation_rules" ON public.revenue_allocation_rules FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update revenue_allocation_rules" ON public.revenue_allocation_rules FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete revenue_allocation_rules" ON public.revenue_allocation_rules FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS: staff_allocation_rules (admin only)
CREATE POLICY "Admins can read staff_allocation_rules" ON public.staff_allocation_rules FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert staff_allocation_rules" ON public.staff_allocation_rules FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update staff_allocation_rules" ON public.staff_allocation_rules FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete staff_allocation_rules" ON public.staff_allocation_rules FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS: revenue_allocations (admin read, system insert)
CREATE POLICY "Admins can read revenue_allocations" ON public.revenue_allocations FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert revenue_allocations" ON public.revenue_allocations FOR INSERT WITH CHECK (true);

-- RLS: staff_revenue_allocations (admin read, system insert)
CREATE POLICY "Admins can read staff_revenue_allocations" ON public.staff_revenue_allocations FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert staff_revenue_allocations" ON public.staff_revenue_allocations FOR INSERT WITH CHECK (true);

-- RLS: war_chest_entries (admin read, system insert)
CREATE POLICY "Admins can read war_chest_entries" ON public.war_chest_entries FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert war_chest_entries" ON public.war_chest_entries FOR INSERT WITH CHECK (true);

-- Seed default revenue allocation rules
INSERT INTO public.revenue_allocation_rules (category, percentage) VALUES
  ('Direct Costs', 25),
  ('Base Operations', 20),
  ('Volume Bonus Pool', 5),
  ('Clinical Savings', 30),
  ('Investors', 15),
  ('Tithe', 5);

-- Seed default staff allocation rules
INSERT INTO public.staff_allocation_rules (role_title, percentage) VALUES
  ('Dentist', 35),
  ('Therapist', 18),
  ('Surgery Assistant', 12),
  ('Manager', 15),
  ('Accountant', 12),
  ('Cleaner', 8);

-- Updated timestamp triggers
CREATE TRIGGER update_revenue_allocation_rules_updated_at
  BEFORE UPDATE ON public.revenue_allocation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_allocation_rules_updated_at
  BEFORE UPDATE ON public.staff_allocation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger function for automatic revenue allocation
CREATE OR REPLACE FUNCTION public.allocate_revenue_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  rule RECORD;
  staff_rule RECORD;
  inv RECORD;
  total_paid numeric;
  excess numeric;
  base_ops_amount numeric := 0;
BEGIN
  BEGIN
    -- Check if allocation is active
    IF NOT EXISTS (SELECT 1 FROM public.revenue_allocation_rules WHERE is_active = true LIMIT 1) THEN
      RETURN NEW;
    END IF;

    -- Insert allocation rows for each active rule
    FOR rule IN SELECT category, percentage FROM public.revenue_allocation_rules WHERE is_active = true
    LOOP
      INSERT INTO public.revenue_allocations (payment_id, category, percentage, amount)
      VALUES (NEW.id, rule.category, rule.percentage, ROUND(NEW.amount * rule.percentage / 100, 2));
      
      -- Track Base Operations amount for staff sub-allocation
      IF rule.category = 'Base Operations' THEN
        base_ops_amount := ROUND(NEW.amount * rule.percentage / 100, 2);
      END IF;
    END LOOP;

    -- Staff sub-allocations from Base Operations
    IF base_ops_amount > 0 THEN
      FOR staff_rule IN SELECT role_title, percentage FROM public.staff_allocation_rules WHERE is_active = true
      LOOP
        INSERT INTO public.staff_revenue_allocations (payment_id, role_title, percentage, amount)
        VALUES (NEW.id, staff_rule.role_title, staff_rule.percentage, ROUND(base_ops_amount * staff_rule.percentage / 100, 2));
      END LOOP;
    END IF;

    -- Check for excess payment (war chest)
    SELECT total_amount, amount_paid INTO inv FROM public.invoices WHERE id = NEW.invoice_id;
    IF inv IS NOT NULL THEN
      total_paid := inv.amount_paid + NEW.amount;
      IF total_paid > inv.total_amount THEN
        excess := total_paid - inv.total_amount;
        IF excess > NEW.amount THEN
          excess := NEW.amount;
        END IF;
        INSERT INTO public.war_chest_entries (payment_id, excess_amount)
        VALUES (NEW.id, excess);
      END IF;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Revenue allocation failed for payment %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create trigger on payments
CREATE TRIGGER trg_allocate_revenue
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.allocate_revenue_on_payment();
