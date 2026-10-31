REVOKE ALL ON FUNCTION public.enforce_lab_case_rules() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_lab_manager(uuid,uuid) FROM PUBLIC, anon;