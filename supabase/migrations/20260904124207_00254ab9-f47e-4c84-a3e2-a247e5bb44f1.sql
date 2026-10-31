REVOKE EXECUTE ON FUNCTION public.next_lab_serial(uuid, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.next_lab_serial(uuid, text, text) TO authenticated, service_role;