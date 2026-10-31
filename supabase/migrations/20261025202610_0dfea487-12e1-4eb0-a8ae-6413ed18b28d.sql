CREATE TABLE public.blog_autopilot (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  paused_reason text,
  locked_until timestamptz,
  last_run_at timestamptz,
  last_result text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.blog_autopilot TO authenticated;
GRANT ALL ON public.blog_autopilot TO service_role;
ALTER TABLE public.blog_autopilot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins read autopilot" ON public.blog_autopilot FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "super admins update autopilot" ON public.blog_autopilot FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
INSERT INTO public.blog_autopilot (id) VALUES (1);
ALTER TABLE public.blog_articles ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false;