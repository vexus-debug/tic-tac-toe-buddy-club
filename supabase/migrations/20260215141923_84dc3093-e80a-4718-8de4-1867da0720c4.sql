
-- Create a security definer function to handle signup org creation
-- This bypasses RLS since new users have no org access yet
CREATE OR REPLACE FUNCTION public.create_org_for_new_user(
  p_user_id uuid,
  p_clinic_name text,
  p_slug text,
  p_clinic_type clinic_type
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Create the organization
  INSERT INTO organizations (name, slug, clinic_type)
  VALUES (p_clinic_name, p_slug, p_clinic_type)
  RETURNING id INTO v_org_id;

  -- Add user as owner
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (v_org_id, p_user_id, 'owner');

  RETURN v_org_id;
END;
$$;

-- Also ensure profiles are auto-created on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
