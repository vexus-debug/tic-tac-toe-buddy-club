INSERT INTO public.org_members (org_id, user_id, role)
SELECT b.id, m.user_id, 'owner'
FROM public.organizations b
JOIN public.org_members m ON m.org_id = b.parent_org_id AND m.role IN ('owner','admin')
WHERE b.parent_org_id IS NOT NULL
ON CONFLICT DO NOTHING;