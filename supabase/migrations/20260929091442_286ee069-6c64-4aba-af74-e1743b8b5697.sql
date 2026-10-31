ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'manager';

CREATE OR REPLACE FUNCTION public.get_org_role(_user_id uuid, _org_id uuid)
 RETURNS org_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN role::text = 'manager' THEN 'admin'::org_role ELSE role END
  FROM public.org_members
  WHERE user_id = _user_id AND org_id = _org_id
  LIMIT 1;
$function$;