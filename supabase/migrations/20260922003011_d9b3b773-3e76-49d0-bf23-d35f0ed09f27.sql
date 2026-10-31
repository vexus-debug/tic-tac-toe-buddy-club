REVOKE EXECUTE ON FUNCTION public.create_org_for_new_user(uuid, text, text, clinic_type) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_org_for_new_user(uuid, text, text, clinic_type) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_org_role(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_org_role(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_org_access(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_org_access(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, platform_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, platform_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.next_lab_serial(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_lab_serial(uuid, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.seed_allocation_rules_for_org() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_offline_dental_history_updated_at() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.get_public_result(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_result(text) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_public_scan(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_scan(text) TO anon, authenticated, service_role;