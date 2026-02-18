-- Fix profiles compatibility after cleanup migration
-- Restores required preference column and aligns defaults for app flows.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_study_hours integer;

UPDATE public.profiles
SET daily_study_hours = 4
WHERE daily_study_hours IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN daily_study_hours SET DEFAULT 4,
ALTER COLUMN daily_study_hours SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_daily_study_hours_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_daily_study_hours_check
    CHECK (daily_study_hours BETWEEN 1 AND 12);
  END IF;
END $$;
