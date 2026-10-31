ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS parent_org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON public.organizations(parent_org_id);

CREATE OR REPLACE FUNCTION public.validate_org_parent()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_parent record;
BEGIN
  IF NEW.parent_org_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.parent_org_id = NEW.id THEN RAISE EXCEPTION 'A clinic cannot be its own branch'; END IF;
  SELECT id, parent_org_id, clinic_type INTO v_parent FROM organizations WHERE id = NEW.parent_org_id;
  IF v_parent.id IS NULL THEN RAISE EXCEPTION 'Main clinic not found'; END IF;
  IF v_parent.parent_org_id IS NOT NULL THEN RAISE EXCEPTION 'Only the main clinic can have branches'; END IF;
  NEW.clinic_type := v_parent.clinic_type;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_org_parent ON public.organizations;
CREATE TRIGGER trg_validate_org_parent BEFORE INSERT OR UPDATE OF parent_org_id ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.validate_org_parent();

CREATE OR REPLACE FUNCTION public.create_branch(p_parent_org_id uuid, p_name text, p_slug text, p_phone text DEFAULT NULL, p_address text DEFAULT NULL, p_email text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_type clinic_type; v_parent_parent uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT clinic_type, parent_org_id INTO v_type, v_parent_parent FROM organizations WHERE id = p_parent_org_id;
  IF v_type IS NULL THEN RAISE EXCEPTION 'Main clinic not found'; END IF;
  IF v_parent_parent IS NOT NULL THEN RAISE EXCEPTION 'Only the main clinic can create branches'; END IF;
  IF NOT (get_org_role(auth.uid(), p_parent_org_id) IN ('owner','admin') OR is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Only main clinic owners or admins can create branches';
  END IF;
  IF coalesce(trim(p_name),'') = '' THEN RAISE EXCEPTION 'Branch name is required'; END IF;

  INSERT INTO organizations (name, slug, clinic_type, parent_org_id, phone, address, email)
  VALUES (trim(p_name), p_slug, v_type, p_parent_org_id, p_phone, p_address, p_email)
  RETURNING id INTO v_id;

  INSERT INTO org_members (org_id, user_id, role)
  SELECT v_id, m.user_id, 'owner' FROM org_members m
  WHERE m.org_id = p_parent_org_id AND m.role = 'owner'
  ON CONFLICT DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM org_members WHERE org_id = v_id AND user_id = auth.uid()) THEN
    INSERT INTO org_members (org_id, user_id, role) VALUES (v_id, auth.uid(), 'owner');
  END IF;
  RETURN v_id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.create_branch(uuid, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_branch(uuid, text, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_org_branches(p_org_id uuid)
RETURNS TABLE(id uuid, name text, slug text, phone text, address text, email text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.name, o.slug, o.phone, o.address, o.email, o.created_at
  FROM organizations o
  WHERE o.parent_org_id = p_org_id
    AND (get_org_role(auth.uid(), p_org_id) IN ('owner','admin') OR is_super_admin(auth.uid()))
  ORDER BY o.created_at;
$$;
REVOKE EXECUTE ON FUNCTION public.list_org_branches(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_org_branches(uuid) TO authenticated;