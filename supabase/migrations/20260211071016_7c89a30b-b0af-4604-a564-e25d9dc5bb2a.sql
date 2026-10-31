
-- Drop conflicting updated_at triggers that already exist, then recreate
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

-- Recreate all updated_at triggers
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
