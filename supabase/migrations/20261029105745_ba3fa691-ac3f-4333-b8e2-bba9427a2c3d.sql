ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS signed_by uuid, ADD COLUMN IF NOT EXISTS signed_at timestamptz;

CREATE OR REPLACE FUNCTION public.enforce_clinical_note_lock()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF OLD.signed_at IS NOT NULL OR OLD.created_at < now() - interval '24 hours' THEN
    RAISE EXCEPTION 'This note is locked. Add a signed addendum instead.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_enforce_clinical_note_lock BEFORE UPDATE ON public.clinical_notes FOR EACH ROW EXECUTE FUNCTION public.enforce_clinical_note_lock();

CREATE OR REPLACE FUNCTION public.block_locked_note_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF OLD.signed_at IS NOT NULL OR OLD.created_at < now() - interval '24 hours' THEN
    RAISE EXCEPTION 'Locked clinical notes cannot be deleted.';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER trg_block_locked_note_delete BEFORE DELETE ON public.clinical_notes FOR EACH ROW EXECUTE FUNCTION public.block_locked_note_delete();

CREATE TABLE public.clinical_note_addenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.clinical_notes(id) ON DELETE RESTRICT,
  org_id uuid NOT NULL,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  author_name text,
  reason text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinical_note_addenda_note_idx ON public.clinical_note_addenda(note_id);
GRANT SELECT, INSERT ON public.clinical_note_addenda TO authenticated;
GRANT ALL ON public.clinical_note_addenda TO service_role;
ALTER TABLE public.clinical_note_addenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view addenda" ON public.clinical_note_addenda FOR SELECT TO authenticated USING (has_org_access(auth.uid(), org_id));
CREATE POLICY "Members add signed addenda" ON public.clinical_note_addenda FOR INSERT TO authenticated
  WITH CHECK (has_org_access(auth.uid(), org_id) AND author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.clinical_notes n WHERE n.id = note_id AND n.org_id = clinical_note_addenda.org_id));