CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_key text NOT NULL,
  device_type text,
  os text,
  browser text,
  user_agent text,
  is_pwa boolean NOT NULL DEFAULT false,
  ip text,
  city text,
  region text,
  country text,
  current_path text,
  org_slug text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_sessions_user_device_unique UNIQUE (user_id, session_key)
);

CREATE INDEX user_sessions_last_seen_idx ON public.user_sessions (last_seen_at DESC);

GRANT SELECT ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all sessions"
ON public.user_sessions FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid());