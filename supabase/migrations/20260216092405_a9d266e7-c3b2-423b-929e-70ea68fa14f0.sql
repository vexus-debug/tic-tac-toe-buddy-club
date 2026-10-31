-- Add lab_assistant to the org_role enum
ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'lab_assistant';