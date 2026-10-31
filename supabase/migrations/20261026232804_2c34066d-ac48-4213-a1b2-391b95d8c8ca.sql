CREATE TABLE public.outreach_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  preview_text text,
  from_name text NOT NULL DEFAULT 'Clinexus Outreach',
  from_email text NOT NULL DEFAULT 'outreach@app.clinexus.com.ng',
  reply_to text,
  html_content text NOT NULL DEFAULT '',
  plain_text text,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  track_opens boolean NOT NULL DEFAULT true,
  track_clicks boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','completed','paused','failed')),
  total_recipients integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  delivered_count integer NOT NULL DEFAULT 0,
  opened_count integer NOT NULL DEFAULT 0,
  unique_opened_count integer NOT NULL DEFAULT 0,
  clicked_count integer NOT NULL DEFAULT 0,
  unique_clicked_count integer NOT NULL DEFAULT 0,
  bounced_count integer NOT NULL DEFAULT 0,
  complained_count integer NOT NULL DEFAULT 0,
  unsubscribed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_campaigns TO authenticated;
GRANT ALL ON public.outreach_campaigns TO service_role;
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage outreach campaigns" ON public.outreach_campaigns
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_outreach_campaigns_status ON public.outreach_campaigns(status, created_at DESC);
CREATE TRIGGER update_outreach_campaigns_updated_at BEFORE UPDATE ON public.outreach_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.outreach_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_name text,
  clinic_name text,
  clinic_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resend_email_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','opened','clicked','bounced','complained','unsubscribed','failed')),
  error_message text,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  sent_at timestamptz,
  delivered_at timestamptz,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count integer NOT NULL DEFAULT 0,
  clicked_at timestamptz,
  click_count integer NOT NULL DEFAULT 0,
  last_user_agent text,
  bounced_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, recipient_email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_recipients TO authenticated;
GRANT ALL ON public.outreach_recipients TO service_role;
ALTER TABLE public.outreach_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage outreach recipients" ON public.outreach_recipients
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE UNIQUE INDEX idx_outreach_recipients_token ON public.outreach_recipients(unsubscribe_token);
CREATE INDEX idx_outreach_recipients_campaign_status ON public.outreach_recipients(campaign_id, status);
CREATE INDEX idx_outreach_recipients_email ON public.outreach_recipients(lower(recipient_email));
CREATE INDEX idx_outreach_recipients_resend ON public.outreach_recipients(resend_email_id) WHERE resend_email_id IS NOT NULL;
CREATE TRIGGER update_outreach_recipients_updated_at BEFORE UPDATE ON public.outreach_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.outreach_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.outreach_recipients(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  source text NOT NULL DEFAULT 'webhook' CHECK (source IN ('webhook','pixel','proxy','unsubscribe','system')),
  ip_address text,
  user_agent text,
  target_url text,
  payload jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_events TO authenticated;
GRANT ALL ON public.outreach_events TO service_role;
ALTER TABLE public.outreach_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage outreach events" ON public.outreach_events
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_outreach_events_campaign_time ON public.outreach_events(campaign_id, occurred_at DESC);
CREATE INDEX idx_outreach_events_recipient ON public.outreach_events(recipient_id);

CREATE TABLE public.outreach_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  reason text NOT NULL DEFAULT 'unsubscribed' CHECK (reason IN ('unsubscribed','bounced','complained','manual')),
  campaign_id uuid REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_suppressions TO authenticated;
GRANT ALL ON public.outreach_suppressions TO service_role;
ALTER TABLE public.outreach_suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage outreach suppressions" ON public.outreach_suppressions
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE UNIQUE INDEX idx_outreach_suppressions_email ON public.outreach_suppressions(lower(email));

-- Atomic counter helper for the tracking engine (server-side only)
CREATE OR REPLACE FUNCTION public.outreach_increment_campaign(p_campaign_id uuid, p_field text, p_by integer DEFAULT 1)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF p_field NOT IN ('sent_count','delivered_count','opened_count','unique_opened_count','clicked_count','unique_clicked_count','bounced_count','complained_count','unsubscribed_count','failed_count') THEN
    RAISE EXCEPTION 'Invalid counter';
  END IF;
  EXECUTE format('UPDATE public.outreach_campaigns SET %I = %I + $1 WHERE id = $2', p_field, p_field) USING p_by, p_campaign_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.outreach_increment_campaign(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.outreach_increment_campaign(uuid, text, integer) TO service_role;