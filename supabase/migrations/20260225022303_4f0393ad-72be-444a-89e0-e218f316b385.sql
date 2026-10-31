
-- Create function to seed default revenue & staff allocation rules for a new org
CREATE OR REPLACE FUNCTION public.seed_allocation_rules_for_org()
RETURNS TRIGGER AS $$
BEGIN
  -- Seed revenue allocation rules
  INSERT INTO public.revenue_allocation_rules (org_id, category, percentage, is_active)
  VALUES
    (NEW.id, 'Direct Costs', 30, true),
    (NEW.id, 'Base Operations', 25, true),
    (NEW.id, 'Volume Bonus Pool', 15, true),
    (NEW.id, 'Clinical Savings', 15, true),
    (NEW.id, 'Investors', 10, true),
    (NEW.id, 'Tithe', 5, true);

  -- Seed staff allocation rules
  INSERT INTO public.staff_allocation_rules (org_id, category, percentage)
  VALUES
    (NEW.id, 'Lead Dentist', 35),
    (NEW.id, 'Associate Dentist', 25),
    (NEW.id, 'Admin/Manager', 15),
    (NEW.id, 'Hygienist', 15),
    (NEW.id, 'Receptionist', 10);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS seed_allocation_rules_on_org_create ON public.organizations;
CREATE TRIGGER seed_allocation_rules_on_org_create
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_allocation_rules_for_org();

-- Backfill: seed rules for existing orgs that don't have them
INSERT INTO public.revenue_allocation_rules (org_id, category, percentage, is_active)
SELECT o.id, v.category, v.percentage, true
FROM public.organizations o
CROSS JOIN (VALUES
  ('Direct Costs', 30),
  ('Base Operations', 25),
  ('Volume Bonus Pool', 15),
  ('Clinical Savings', 15),
  ('Investors', 10),
  ('Tithe', 5)
) AS v(category, percentage)
WHERE NOT EXISTS (
  SELECT 1 FROM public.revenue_allocation_rules r WHERE r.org_id = o.id
);

INSERT INTO public.staff_allocation_rules (org_id, category, percentage)
SELECT o.id, v.category, v.percentage
FROM public.organizations o
CROSS JOIN (VALUES
  ('Lead Dentist', 35),
  ('Associate Dentist', 25),
  ('Admin/Manager', 15),
  ('Hygienist', 15),
  ('Receptionist', 10)
) AS v(category, percentage)
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff_allocation_rules r WHERE r.org_id = o.id
);
