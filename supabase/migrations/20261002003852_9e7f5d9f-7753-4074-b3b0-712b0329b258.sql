CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subs" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "super admin read subs" ON public.push_subscriptions FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE TABLE public.push_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  target_type text NOT NULL DEFAULT 'all',
  target_org_id uuid,
  target_user_id uuid,
  sent_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.push_messages TO authenticated;
GRANT ALL ON public.push_messages TO service_role;
ALTER TABLE public.push_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin manage messages" ON public.push_messages FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "recipients read messages" ON public.push_messages FOR SELECT TO authenticated USING (
  target_type = 'all'
  OR (target_type = 'user' AND target_user_id = auth.uid())
  OR (target_type = 'clinic' AND public.has_org_access(auth.uid(), target_org_id))
);