
-- =============================================
-- 1. AUTO-GENERATED NOTIFICATIONS TRIGGERS
-- =============================================

-- Notify when appointment is booked
CREATE OR REPLACE FUNCTION public.notify_appointment_booked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  patient_name TEXT;
  r RECORD;
BEGIN
  SELECT first_name || ' ' || last_name INTO patient_name FROM public.patients WHERE id = NEW.patient_id;

  -- Notify all admin and receptionist users
  FOR r IN
    SELECT DISTINCT ur.user_id FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'receptionist')
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id)
    VALUES (r.user_id, 'appointment', 'New Appointment Booked',
            'Appointment booked for ' || COALESCE(patient_name, 'a patient') || ' on ' || NEW.appointment_date::text,
            'appointment', NEW.id);
  END LOOP;

  -- Also notify the assigned dentist if they have a user_id
  PERFORM 1 FROM public.staff s
    JOIN public.user_roles ur ON ur.user_id = s.user_id
    WHERE s.id = NEW.staff_id AND s.user_id IS NOT NULL;

  IF FOUND THEN
    INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id)
    SELECT s.user_id, 'appointment', 'New Appointment Assigned',
           'You have a new appointment with ' || COALESCE(patient_name, 'a patient') || ' on ' || NEW.appointment_date::text,
           'appointment', NEW.id
    FROM public.staff s WHERE s.id = NEW.staff_id AND s.user_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_appointment_booked
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_appointment_booked();

-- Notify when lab order is completed
CREATE OR REPLACE FUNCTION public.notify_lab_order_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  dentist_user_id UUID;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT s.user_id INTO dentist_user_id FROM public.staff s WHERE s.id = NEW.dentist_id AND s.user_id IS NOT NULL;
    
    IF dentist_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id)
      VALUES (dentist_user_id, 'lab', 'Lab Order Completed',
              NEW.lab_work_type || ' from ' || NEW.lab_name || ' is ready.',
              'lab_order', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_lab_order_completed
AFTER UPDATE ON public.lab_orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_lab_order_completed();

-- Notify when inventory drops below minimum stock
CREATE OR REPLACE FUNCTION public.notify_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  r RECORD;
BEGIN
  IF NEW.quantity <= NEW.min_stock AND (OLD.quantity > OLD.min_stock OR TG_OP = 'INSERT') THEN
    FOR r IN
      SELECT DISTINCT ur.user_id FROM public.user_roles ur
      WHERE ur.role IN ('admin', 'accountant')
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id)
      VALUES (r.user_id, 'inventory', 'Low Stock Alert',
              NEW.name || ' is running low (' || NEW.quantity || ' ' || NEW.unit || ' remaining).',
              'inventory', NEW.id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_low_stock
AFTER UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.notify_low_stock();

CREATE TRIGGER trg_notify_low_stock_insert
AFTER INSERT ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.notify_low_stock();

-- =============================================
-- 2. ACTIVITY LOG AUTO-POPULATION TRIGGERS
-- =============================================

-- Log new patient registration
CREATE OR REPLACE FUNCTION public.log_patient_registered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.activity_log (event_type, description, entity_type, entity_id, user_id)
  VALUES ('patient_registered', 'New patient registered: ' || NEW.first_name || ' ' || NEW.last_name,
          'patient', NEW.id, auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_patient_registered
AFTER INSERT ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.log_patient_registered();

-- Log appointment completed
CREATE OR REPLACE FUNCTION public.log_appointment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  patient_name TEXT;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    SELECT first_name || ' ' || last_name INTO patient_name FROM public.patients WHERE id = NEW.patient_id;
    INSERT INTO public.activity_log (event_type, description, entity_type, entity_id, user_id)
    VALUES ('appointment_completed', 'Appointment completed for ' || COALESCE(patient_name, 'patient'),
            'appointment', NEW.id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_appointment_completed
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.log_appointment_completed();

-- Log payment received
CREATE OR REPLACE FUNCTION public.log_payment_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.activity_log (event_type, description, entity_type, entity_id, user_id)
  VALUES ('payment_received', 'Payment of ₦' || NEW.amount::text || ' received via ' || NEW.payment_method,
          'payment', NEW.id, auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_payment_received
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.log_payment_received();

-- Log invoice created
CREATE OR REPLACE FUNCTION public.log_invoice_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  patient_name TEXT;
BEGIN
  SELECT first_name || ' ' || last_name INTO patient_name FROM public.patients WHERE id = NEW.patient_id;
  INSERT INTO public.activity_log (event_type, description, entity_type, entity_id, user_id)
  VALUES ('invoice_created', 'Invoice ' || NEW.invoice_number || ' created for ' || COALESCE(patient_name, 'patient'),
          'invoice', NEW.id, auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_invoice_created
AFTER INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.log_invoice_created();
