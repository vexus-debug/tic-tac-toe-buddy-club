CREATE TABLE public.eye_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  brand text NOT NULL,
  model text,
  colour text,
  size text,
  material text,
  gender text,
  sku text,
  cost_price numeric DEFAULT 0,
  sell_price numeric DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eye_frames TO authenticated;
GRANT ALL ON public.eye_frames TO service_role;
ALTER TABLE public.eye_frames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage frames" ON public.eye_frames FOR ALL TO authenticated
  USING (has_org_access(auth.uid(), org_id)) WITH CHECK (has_org_access(auth.uid(), org_id));

CREATE TABLE public.eye_lens_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  lens_type text NOT NULL,
  lens_index text,
  coating text,
  power_range text,
  supplier text,
  cost_price numeric DEFAULT 0,
  sell_price numeric DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eye_lens_stock TO authenticated;
GRANT ALL ON public.eye_lens_stock TO service_role;
ALTER TABLE public.eye_lens_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage lens stock" ON public.eye_lens_stock FOR ALL TO authenticated
  USING (has_org_access(auth.uid(), org_id)) WITH CHECK (has_org_access(auth.uid(), org_id));

CREATE TABLE public.eye_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  direction text NOT NULL DEFAULT 'out',
  specialty text,
  practitioner text,
  facility text,
  contact text,
  reason text,
  urgency text NOT NULL DEFAULT 'routine',
  referral_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'sent',
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eye_referrals TO authenticated;
GRANT ALL ON public.eye_referrals TO service_role;
ALTER TABLE public.eye_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage referrals" ON public.eye_referrals FOR ALL TO authenticated
  USING (has_org_access(auth.uid(), org_id)) WITH CHECK (has_org_access(auth.uid(), org_id));

ALTER TABLE public.waiting_list ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'check_in';
ALTER TABLE public.optical_orders ADD COLUMN IF NOT EXISTS notified_at timestamptz;
ALTER TABLE public.surgery_bookings ADD COLUMN IF NOT EXISTS postop_checklist jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.surgery_bookings ADD COLUMN IF NOT EXISTS postop_notes text;

CREATE OR REPLACE FUNCTION public.eye_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER eye_frames_updated BEFORE UPDATE ON public.eye_frames FOR EACH ROW EXECUTE FUNCTION public.eye_touch_updated_at();
CREATE TRIGGER eye_lens_stock_updated BEFORE UPDATE ON public.eye_lens_stock FOR EACH ROW EXECUTE FUNCTION public.eye_touch_updated_at();
CREATE TRIGGER eye_referrals_updated BEFORE UPDATE ON public.eye_referrals FOR EACH ROW EXECUTE FUNCTION public.eye_touch_updated_at();