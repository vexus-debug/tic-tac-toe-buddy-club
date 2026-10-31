ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS duration_months integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='subscription_plans' AND policyname='Super admins manage plans'
  ) THEN
    CREATE POLICY "Super admins manage plans" ON public.subscription_plans
      FOR ALL TO authenticated
      USING (public.is_super_admin(auth.uid()))
      WITH CHECK (public.is_super_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='clinic_subscriptions' AND policyname='Super admins manage clinic subscriptions'
  ) THEN
    CREATE POLICY "Super admins manage clinic subscriptions" ON public.clinic_subscriptions
      FOR ALL TO authenticated
      USING (public.is_super_admin(auth.uid()))
      WITH CHECK (public.is_super_admin(auth.uid()));
  END IF;
END $$;