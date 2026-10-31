REVOKE EXECUTE ON FUNCTION public.is_org_dentist(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_staff_id_for_user(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_dentist_reassignment() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_org_dentist(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_id_for_user(uuid, uuid) TO authenticated;