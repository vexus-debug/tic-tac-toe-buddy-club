CREATE TABLE public.blog_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'practice',
  body jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_url text,
  read_minutes integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'draft',
  prompt text,
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_articles TO authenticated;
GRANT ALL ON public.blog_articles TO service_role;
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are public" ON public.blog_articles FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Super admins manage articles" ON public.blog_articles FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER blog_articles_updated_at BEFORE UPDATE ON public.blog_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();