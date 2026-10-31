CREATE OR REPLACE FUNCTION public.get_resend_api_key()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'RESEND_API_KEY' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_resend_api_key() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_resend_api_key() TO service_role;