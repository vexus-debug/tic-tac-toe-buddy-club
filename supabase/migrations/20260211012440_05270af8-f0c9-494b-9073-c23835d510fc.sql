
-- Add registered_by column to lab_cases to track who registered the job
ALTER TABLE public.lab_cases
ADD COLUMN registered_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- Add registered_by_name to store the display name at time of registration
ALTER TABLE public.lab_cases
ADD COLUMN registered_by_name text DEFAULT '';
