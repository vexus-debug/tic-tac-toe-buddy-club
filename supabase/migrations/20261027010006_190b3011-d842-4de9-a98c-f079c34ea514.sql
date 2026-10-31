CREATE TABLE public.outreach_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  phone text,
  clinic_name text,
  city text,
  specialty text,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'new',
  notes text,
  emails_sent integer NOT NULL DEFAULT 0,
  opens integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  last_contacted_at timestamptz,
  last_engaged_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_contacts TO authenticated;
GRANT ALL ON public.outreach_contacts TO service_role;
ALTER TABLE public.outreach_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins manage outreach contacts" ON public.outreach_contacts
  FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX outreach_contacts_status_idx ON public.outreach_contacts(status);
CREATE INDEX outreach_contacts_tags_idx ON public.outreach_contacts USING gin(tags);
CREATE TRIGGER update_outreach_contacts_updated_at BEFORE UPDATE ON public.outreach_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS parent_campaign_id uuid REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.outreach_recipients ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.outreach_contacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS outreach_recipients_contact_idx ON public.outreach_recipients(contact_id);

-- Keep contact lifecycle in sync with campaign activity
CREATE OR REPLACE FUNCTION public.outreach_sync_contact() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid;
BEGIN
  cid := NEW.contact_id;
  IF cid IS NULL THEN
    SELECT id INTO cid FROM outreach_contacts WHERE email = lower(NEW.recipient_email);
    IF cid IS NULL THEN RETURN NEW; END IF;
  END IF;
  IF NEW.sent_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.sent_at IS NULL) THEN
    UPDATE outreach_contacts SET emails_sent = emails_sent + 1, last_contacted_at = NEW.sent_at,
      status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END WHERE id = cid;
  END IF;
  IF NEW.open_count > COALESCE(CASE WHEN TG_OP='UPDATE' THEN OLD.open_count END, 0) THEN
    UPDATE outreach_contacts SET opens = opens + (NEW.open_count - COALESCE(CASE WHEN TG_OP='UPDATE' THEN OLD.open_count END, 0)),
      last_engaged_at = now(), status = CASE WHEN status IN ('new','contacted') THEN 'engaged' ELSE status END WHERE id = cid;
  END IF;
  IF NEW.click_count > COALESCE(CASE WHEN TG_OP='UPDATE' THEN OLD.click_count END, 0) THEN
    UPDATE outreach_contacts SET clicks = clicks + (NEW.click_count - COALESCE(CASE WHEN TG_OP='UPDATE' THEN OLD.click_count END, 0)),
      last_engaged_at = now(), status = CASE WHEN status IN ('new','contacted') THEN 'engaged' ELSE status END WHERE id = cid;
  END IF;
  IF NEW.unsubscribed_at IS NOT NULL AND (TG_OP='INSERT' OR OLD.unsubscribed_at IS NULL) THEN
    UPDATE outreach_contacts SET status = 'unsubscribed' WHERE id = cid;
  ELSIF NEW.bounced_at IS NOT NULL AND (TG_OP='INSERT' OR OLD.bounced_at IS NULL) THEN
    UPDATE outreach_contacts SET status = 'bounced' WHERE id = cid AND status <> 'unsubscribed';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.outreach_sync_contact() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER outreach_recipients_sync_contact AFTER INSERT OR UPDATE ON public.outreach_recipients
  FOR EACH ROW EXECUTE FUNCTION public.outreach_sync_contact();

CREATE OR REPLACE FUNCTION public.outreach_suppression_to_contact() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE outreach_contacts SET status = CASE WHEN NEW.reason = 'bounced' THEN 'bounced' ELSE 'unsubscribed' END
  WHERE email = lower(NEW.email);
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.outreach_suppression_to_contact() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER outreach_suppressions_to_contact AFTER INSERT ON public.outreach_suppressions
  FOR EACH ROW EXECUTE FUNCTION public.outreach_suppression_to_contact();