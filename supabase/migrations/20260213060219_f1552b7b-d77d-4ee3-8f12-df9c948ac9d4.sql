
-- ============================================================
-- 1. ADD NEW COLUMNS TO lab_cases TABLE
-- ============================================================
ALTER TABLE public.lab_cases
  ADD COLUMN IF NOT EXISTS clinic_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS clinic_doctor_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS job_instructions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS job_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS shade text DEFAULT '',
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remark text DEFAULT '',
  ADD COLUMN IF NOT EXISTS net_amount numeric GENERATED ALWAYS AS (GREATEST(lab_fee - discount, 0)) STORED;

-- ============================================================
-- 2. CREATE lab_invoices TABLE (separate from clinic invoices)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.lab_invoice_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.lab_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL DEFAULT '',
  clinic_code text DEFAULT '',
  clinic_doctor_name text DEFAULT '',
  patient_name text DEFAULT '',
  lab_case_id uuid REFERENCES public.lab_cases(id) ON DELETE SET NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid',
  notes text DEFAULT '',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-generate lab invoice numbers
CREATE OR REPLACE FUNCTION public.generate_lab_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.invoice_number := 'LAB-INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.lab_invoice_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_lab_invoice_number_trigger
  BEFORE INSERT ON public.lab_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number = '' OR NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.generate_lab_invoice_number();

-- Updated_at trigger for lab_invoices
CREATE TRIGGER update_lab_invoices_updated_at
  BEFORE UPDATE ON public.lab_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for lab_invoices
ALTER TABLE public.lab_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lab_invoices"
  ON public.lab_invoices FOR SELECT USING (true);

CREATE POLICY "Admin and lab staff can insert lab_invoices"
  ON public.lab_invoices FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_technician'::app_role));

CREATE POLICY "Admin and lab staff can update lab_invoices"
  ON public.lab_invoices FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab_technician'::app_role));

CREATE POLICY "Admins can delete lab_invoices"
  ON public.lab_invoices FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 3. CREATE lab_allocation_rules TABLE (independent from clinic)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lab_allocation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_allocation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lab_allocation_rules"
  ON public.lab_allocation_rules FOR SELECT USING (true);

CREATE POLICY "Admins can insert lab_allocation_rules"
  ON public.lab_allocation_rules FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lab_allocation_rules"
  ON public.lab_allocation_rules FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lab_allocation_rules"
  ON public.lab_allocation_rules FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default lab allocation rules
INSERT INTO public.lab_allocation_rules (category, percentage) VALUES
  ('Lab Materials', 30),
  ('Lab Staff Wages', 40),
  ('Lab Overhead', 15),
  ('Lab Profit', 15)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. CREATE lab_revenue_allocations TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lab_revenue_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_invoice_id uuid REFERENCES public.lab_invoices(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  percentage numeric NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_revenue_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lab_revenue_allocations"
  ON public.lab_revenue_allocations FOR SELECT USING (true);

CREATE POLICY "System can insert lab_revenue_allocations"
  ON public.lab_revenue_allocations FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 5. CREATE registration_fees TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registration_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid DEFAULT auth.uid(),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read registration_fees"
  ON public.registration_fees FOR SELECT USING (true);

CREATE POLICY "Staff can insert registration_fees"
  ON public.registration_fees FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'receptionist'::app_role)
    OR has_role(auth.uid(), 'dentist'::app_role)
  );

CREATE POLICY "Admins can update registration_fees"
  ON public.registration_fees FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete registration_fees"
  ON public.registration_fees FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 6. UPDATE revenue allocation trigger to EXCLUDE registration fees
-- The existing allocate_revenue_on_payment function should remain
-- as-is since registration fees are now tracked in a separate table
-- and don't flow through the payments/invoices system at all.
-- No changes needed to the trigger.
-- ============================================================

-- ============================================================
-- 7. Updated_at triggers for new tables
-- ============================================================
CREATE TRIGGER update_lab_allocation_rules_updated_at
  BEFORE UPDATE ON public.lab_allocation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
