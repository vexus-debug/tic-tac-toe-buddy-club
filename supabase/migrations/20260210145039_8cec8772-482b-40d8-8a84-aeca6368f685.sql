
-- =============================================
-- INVOICES TABLE
-- =============================================
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending',
  discount_percent numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT '',
  total_amount numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-generate invoice numbers
CREATE SEQUENCE public.invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.invoice_number := 'INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read invoices"
  ON public.invoices FOR SELECT USING (true);

CREATE POLICY "Staff can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'dentist'::app_role) OR
    has_role(auth.uid(), 'receptionist'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role)
  );

CREATE POLICY "Staff can update invoices"
  ON public.invoices FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'dentist'::app_role) OR
    has_role(auth.uid(), 'receptionist'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role)
  );

CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- INVOICE ITEMS TABLE
-- =============================================
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES public.treatments(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read invoice_items"
  ON public.invoice_items FOR SELECT USING (true);

CREATE POLICY "Staff can insert invoice_items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'dentist'::app_role) OR
    has_role(auth.uid(), 'receptionist'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role)
  );

CREATE POLICY "Staff can update invoice_items"
  ON public.invoice_items FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'dentist'::app_role) OR
    has_role(auth.uid(), 'receptionist'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role)
  );

CREATE POLICY "Admins can delete invoice_items"
  ON public.invoice_items FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  reference text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read payments"
  ON public.payments FOR SELECT USING (true);

CREATE POLICY "Staff can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'dentist'::app_role) OR
    has_role(auth.uid(), 'receptionist'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role)
  );

CREATE POLICY "Staff can update payments"
  ON public.payments FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'dentist'::app_role) OR
    has_role(auth.uid(), 'receptionist'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role)
  );

-- =============================================
-- INVENTORY TABLE
-- =============================================
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  quantity integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 5,
  unit text NOT NULL DEFAULT 'pcs',
  supplier text DEFAULT '',
  last_restocked date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inventory"
  ON public.inventory FOR SELECT USING (true);

CREATE POLICY "Staff can insert inventory"
  ON public.inventory FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role)
  );

CREATE POLICY "Staff can update inventory"
  ON public.inventory FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role)
  );

CREATE POLICY "Admins can delete inventory"
  ON public.inventory FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
