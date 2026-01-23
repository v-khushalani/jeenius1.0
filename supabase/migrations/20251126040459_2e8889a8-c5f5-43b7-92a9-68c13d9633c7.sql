-- Remove premium classification from all chapters - make all chapters accessible to everyone
UPDATE public.chapters SET is_premium = false, is_free = true;

-- Update default values so new chapters are also free by default
ALTER TABLE public.chapters ALTER COLUMN is_premium SET DEFAULT false;
ALTER TABLE public.chapters ALTER COLUMN is_free SET DEFAULT true;