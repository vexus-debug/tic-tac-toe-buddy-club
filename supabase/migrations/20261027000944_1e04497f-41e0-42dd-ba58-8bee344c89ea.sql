CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.outreach_cron_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  endpoint text NOT NULL DEFAULT 'https://clinexus.com.ng/api/public/outreach/dispatch',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.outreach_cron_config TO service_role;
ALTER TABLE public.outreach_cron_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.outreach_cron_config DEFAULT VALUES;

CREATE OR REPLACE FUNCTION public.outreach_wake_dispatcher()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record;
BEGIN
  IF NEW.status <> 'sending' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'sending'
     AND NEW.sent_count = OLD.sent_count AND NEW.failed_count = OLD.failed_count THEN
    RETURN NEW;
  END IF;
  SELECT * INTO c FROM public.outreach_cron_config LIMIT 1;
  IF c IS NULL THEN RETURN NEW; END IF;
  PERFORM net.http_post(
    url := c.endpoint,
    headers := jsonb_build_object('Content-Type','application/json','x-outreach-secret', c.secret),
    body := jsonb_build_object('campaignId', NEW.id)
  );
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.outreach_wake_dispatcher() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER outreach_wake_dispatcher
AFTER INSERT OR UPDATE OF status, sent_count, failed_count ON public.outreach_campaigns
FOR EACH ROW EXECUTE FUNCTION public.outreach_wake_dispatcher();