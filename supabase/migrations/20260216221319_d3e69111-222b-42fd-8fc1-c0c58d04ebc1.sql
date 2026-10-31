
-- Allow anonymous/public read access to organizations (for public clinic pages)
CREATE POLICY "Public can view org by slug"
ON public.organizations
FOR SELECT
USING (true);

-- Allow anonymous/public read access to treatments (for public clinic service listing)
CREATE POLICY "Public can view treatments"
ON public.treatments
FOR SELECT
USING (true);

-- Allow anonymous/public read access to staff (to show available doctors for booking)
CREATE POLICY "Public can view staff"
ON public.staff
FOR SELECT
USING (true);
