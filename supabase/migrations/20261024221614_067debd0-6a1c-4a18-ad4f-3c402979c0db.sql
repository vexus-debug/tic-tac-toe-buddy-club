CREATE TRIGGER trg_charge_case_notes BEFORE INSERT ON public.clinical_notes FOR EACH ROW EXECUTE FUNCTION public.charge_case_credit();
CREATE TRIGGER trg_charge_case_plans BEFORE INSERT ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.charge_case_credit();
CREATE TRIGGER trg_charge_case_chart BEFORE INSERT ON public.dental_chart_entries FOR EACH ROW EXECUTE FUNCTION public.charge_case_credit();
CREATE TRIGGER trg_lock_patient_notes BEFORE UPDATE ON public.clinical_notes FOR EACH ROW EXECUTE FUNCTION public.lock_visit_patient();
CREATE TRIGGER trg_lock_patient_plans BEFORE UPDATE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.lock_visit_patient();
CREATE TRIGGER trg_lock_patient_chart BEFORE UPDATE ON public.dental_chart_entries FOR EACH ROW EXECUTE FUNCTION public.lock_visit_patient();