
-- Drop existing triggers if any
DROP TRIGGER IF EXISTS set_lab_case_number ON public.lab_cases;
DROP TRIGGER IF EXISTS set_lab_invoice_number ON public.lab_invoices;
DROP TRIGGER IF EXISTS set_lab_case_net_amount ON public.lab_cases;

-- Auto-generate lab case numbers: LC-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION public.generate_lab_case_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seq_num INT;
  date_str TEXT;
BEGIN
  date_str := to_char(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq_num
  FROM lab_cases
  WHERE case_number LIKE 'LC-' || date_str || '-%';
  
  NEW.case_number := 'LC-' || date_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_lab_case_number
  BEFORE INSERT ON public.lab_cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
  EXECUTE FUNCTION public.generate_lab_case_number();

-- Auto-generate lab invoice numbers: LI-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION public.generate_lab_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seq_num INT;
  date_str TEXT;
BEGIN
  date_str := to_char(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq_num
  FROM lab_invoices
  WHERE invoice_number LIKE 'LI-' || date_str || '-%';
  
  NEW.invoice_number := 'LI-' || date_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_lab_invoice_number
  BEFORE INSERT ON public.lab_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION public.generate_lab_invoice_number();

-- Auto-calculate net_amount on lab_cases
CREATE OR REPLACE FUNCTION public.calculate_lab_case_net_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.net_amount := GREATEST(COALESCE(NEW.lab_fee, 0) - COALESCE(NEW.discount, 0), 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_lab_case_net_amount
  BEFORE INSERT OR UPDATE ON public.lab_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_lab_case_net_amount();
