-- Add more clinic types to the enum
ALTER TYPE public.clinic_type ADD VALUE IF NOT EXISTS 'eye';
ALTER TYPE public.clinic_type ADD VALUE IF NOT EXISTS 'dermatology';
ALTER TYPE public.clinic_type ADD VALUE IF NOT EXISTS 'orthopedic';
ALTER TYPE public.clinic_type ADD VALUE IF NOT EXISTS 'pediatric';
ALTER TYPE public.clinic_type ADD VALUE IF NOT EXISTS 'general';
ALTER TYPE public.clinic_type ADD VALUE IF NOT EXISTS 'cardiology';
ALTER TYPE public.clinic_type ADD VALUE IF NOT EXISTS 'ent';