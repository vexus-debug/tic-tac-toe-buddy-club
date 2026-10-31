-- Visitor analytics for the public marketing site
CREATE TABLE public.visitor_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  visitor_id text NOT NULL,
  user_id uuid,
  ip text,
  country text,
  region text,
  city text,
  referrer_url text,
  referrer_name text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  landing_page text,
  exit_page text,
  user_agent text,
  fingerprint_hash text,
  device_type text,
  os text,
  browser text,
  screen_resolution text,
  pixel_ratio text,
  gpu_renderer text,
  cpu_cores integer,
  device_memory_gb integer,
  timezone text,
  locale text,
  touch_points integer,
  is_pwa boolean NOT NULL DEFAULT false,
  duration_seconds integer NOT NULL DEFAULT 0,
  page_views_count integer NOT NULL DEFAULT 0,
  is_bounced boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.visitor_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  path text,
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ingestion happens from the platform server (service role)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitor_sessions TO service_role;
GRANT SELECT, INSERT, DELETE ON public.visitor_events TO service_role;
-- Super admins read through the Data API
GRANT SELECT ON public.visitor_sessions TO authenticated;
GRANT SELECT ON public.visitor_events TO authenticated;

ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view visitor sessions"
  ON public.visitor_sessions FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view visitor events"
  ON public.visitor_events FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE INDEX idx_visitor_sessions_visitor ON public.visitor_sessions (visitor_id);
CREATE INDEX idx_visitor_sessions_last_seen ON public.visitor_sessions (last_seen_at DESC);
CREATE INDEX idx_visitor_sessions_started ON public.visitor_sessions (started_at DESC);
CREATE INDEX idx_visitor_events_session ON public.visitor_events (session_id, created_at);
CREATE INDEX idx_visitor_events_created ON public.visitor_events (created_at DESC);
