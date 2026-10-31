
-- Drop all triggers first to ensure clean state
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
DROP TRIGGER IF EXISTS update_treatments_updated_at ON public.treatments;
DROP TRIGGER IF EXISTS update_staff_updated_at ON public.staff;
DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
DROP TRIGGER IF EXISTS update_lab_orders_updated_at ON public.lab_orders;
DROP TRIGGER IF EXISTS update_lab_cases_updated_at ON public.lab_cases;
DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON public.prescriptions;
DROP TRIGGER IF EXISTS update_clinic_settings_updated_at ON public.clinic_settings;
DROP TRIGGER IF EXISTS update_dental_chart_entries_updated_at ON public.dental_chart_entries;
DROP TRIGGER IF EXISTS update_revenue_allocation_rules_updated_at ON public.revenue_allocation_rules;
DROP TRIGGER IF EXISTS update_staff_allocation_rules_updated_at ON public.staff_allocation_rules;
DROP TRIGGER IF EXISTS update_treatment_plans_updated_at ON public.treatment_plans;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
DROP TRIGGER IF EXISTS trg_log_patient_registered ON public.patients;
DROP TRIGGER IF EXISTS trg_log_appointment_completed ON public.appointments;
DROP TRIGGER IF EXISTS trg_log_payment_received ON public.payments;
DROP TRIGGER IF EXISTS trg_log_invoice_created ON public.invoices;
DROP TRIGGER IF EXISTS trg_notify_appointment_booked ON public.appointments;
DROP TRIGGER IF EXISTS trg_notify_lab_order_completed ON public.lab_orders;
DROP TRIGGER IF EXISTS trg_notify_low_stock ON public.inventory;
DROP TRIGGER IF EXISTS trg_notify_low_stock_insert ON public.inventory;
DROP TRIGGER IF EXISTS trg_generate_invoice_number ON public.invoices;
DROP TRIGGER IF EXISTS trg_generate_lab_case_number ON public.lab_cases;
DROP TRIGGER IF EXISTS trg_allocate_revenue ON public.payments;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- UPDATED_AT TRIGGERS
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lab_cases_updated_at BEFORE UPDATE ON public.lab_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON public.clinic_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dental_chart_entries_updated_at BEFORE UPDATE ON public.dental_chart_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_revenue_allocation_rules_updated_at BEFORE UPDATE ON public.revenue_allocation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_allocation_rules_updated_at BEFORE UPDATE ON public.staff_allocation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ACTIVITY LOG TRIGGERS
CREATE TRIGGER trg_log_patient_registered AFTER INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION public.log_patient_registered();
CREATE TRIGGER trg_log_appointment_completed AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.log_appointment_completed();
CREATE TRIGGER trg_log_payment_received AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.log_payment_received();
CREATE TRIGGER trg_log_invoice_created AFTER INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.log_invoice_created();

-- NOTIFICATION TRIGGERS
CREATE TRIGGER trg_notify_appointment_booked AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_booked();
CREATE TRIGGER trg_notify_lab_order_completed AFTER UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.notify_lab_order_completed();
CREATE TRIGGER trg_notify_low_stock AFTER UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.notify_low_stock();
CREATE TRIGGER trg_notify_low_stock_insert AFTER INSERT ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.notify_low_stock();

-- AUTO-GENERATION TRIGGERS
CREATE TRIGGER trg_generate_invoice_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();
CREATE TRIGGER trg_generate_lab_case_number BEFORE INSERT ON public.lab_cases FOR EACH ROW EXECUTE FUNCTION public.generate_lab_case_number();

-- REVENUE ALLOCATION TRIGGER
CREATE TRIGGER trg_allocate_revenue AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.allocate_revenue_on_payment();

-- AUTH TRIGGER (profile auto-creation)
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
