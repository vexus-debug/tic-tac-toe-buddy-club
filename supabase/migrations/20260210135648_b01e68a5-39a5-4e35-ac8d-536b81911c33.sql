
-- Tighten patient insert/update to require at least one role
DROP POLICY "Authenticated users can insert patients" ON public.patients;
DROP POLICY "Authenticated users can update patients" ON public.patients;

CREATE POLICY "Staff can insert patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'dentist')
    OR public.has_role(auth.uid(), 'receptionist')
    OR public.has_role(auth.uid(), 'assistant')
    OR public.has_role(auth.uid(), 'hygienist')
  );

CREATE POLICY "Staff can update patients" ON public.patients FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'dentist')
    OR public.has_role(auth.uid(), 'receptionist')
    OR public.has_role(auth.uid(), 'assistant')
    OR public.has_role(auth.uid(), 'hygienist')
  );
