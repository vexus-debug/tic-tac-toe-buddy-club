REVOKE EXECUTE ON FUNCTION public.charge_case_credit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_topup_wallet(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_topup_wallet(uuid, integer, text) TO authenticated;