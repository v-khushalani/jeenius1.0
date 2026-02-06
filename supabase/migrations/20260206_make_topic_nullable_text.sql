-- Make topic field nullable for Foundation grades (6-10)
-- These grades should only have: subject > chapter > questions (no topics)

-- 1. Alter the topic column to be nullable
ALTER TABLE public.questions
ALTER COLUMN topic DROP NOT NULL;

-- 2. Update existing empty topics to NULL for Foundation questions
UPDATE public.questions
SET topic = NULL
WHERE (exam ILIKE 'Foundation-%' OR exam = 'Scholarship' OR exam = 'Olympiad')
  AND (topic IS NULL OR topic = '' OR topic = 'General');

-- 3. Add comment explaining the change
COMMENT ON COLUMN public.questions.topic IS 'Topic name - NULL for Foundation/Scholarship/Olympiad courses (grades 6-10), required for JEE/NEET (grades 11-12)';

-- 4. Verify the change was successful
DO $$
DECLARE
  v_count_null INTEGER;
  v_count_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count_total FROM public.questions;
  SELECT COUNT(*) INTO v_count_null FROM public.questions WHERE topic IS NULL;
  
  RAISE NOTICE 'Topic field made nullable. Total questions: %, Null topics: %', v_count_total, v_count_null;
END $$;
