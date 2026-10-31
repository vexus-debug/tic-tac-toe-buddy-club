
-- Platform audit log for super admin actions
CREATE TABLE public.platform_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view
CREATE POLICY "Super admins can view audit log"
ON public.platform_audit_log
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Super admins can insert
CREATE POLICY "Super admins can insert audit log"
ON public.platform_audit_log
FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

-- Add account_status to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

-- Index for faster queries
CREATE INDEX idx_platform_audit_log_created_at ON public.platform_audit_log(created_at DESC);
CREATE INDEX idx_platform_audit_log_action ON public.platform_audit_log(action);
CREATE INDEX idx_profiles_account_status ON public.profiles(account_status);
