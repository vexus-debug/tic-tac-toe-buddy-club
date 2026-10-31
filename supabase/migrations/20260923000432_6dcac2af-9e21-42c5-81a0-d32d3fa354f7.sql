REVOKE ALL ON FUNCTION public.set_lab_case_number() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_lab_rules_for_new_org() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_lab_allocation_rules(uuid) FROM anon, authenticated;