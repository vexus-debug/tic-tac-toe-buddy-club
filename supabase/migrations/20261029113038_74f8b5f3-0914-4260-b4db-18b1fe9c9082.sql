REVOKE EXECUTE ON FUNCTION public.log_billing_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_billing_delete() FROM PUBLIC, anon, authenticated;