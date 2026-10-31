ALTER TABLE public.lab_cases
  ADD COLUMN IF NOT EXISTS client_type text NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS external_client_name text,
  ADD COLUMN IF NOT EXISTS external_contact_person text,
  ADD COLUMN IF NOT EXISTS external_client_phone text,
  ADD COLUMN IF NOT EXISTS external_client_email text,
  ADD COLUMN IF NOT EXISTS external_patient_name text;

CREATE INDEX IF NOT EXISTS lab_cases_client_type_idx ON public.lab_cases (org_id, client_type);