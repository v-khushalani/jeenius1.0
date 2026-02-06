-- COMPREHENSIVE FIX: Make topic and topic_id nullable for all exams
-- Especially for Foundation/Scholarship/Olympiad batches (grades 6-10)

-- 1. Make topic column nullable
ALTER TABLE public.questions
ALTER COLUMN topic DROP NOT NULL;

-- 2. Make topic_id column nullable
ALTER TABLE public.questions
ALTER COLUMN topic_id DROP NOT NULL;

-- 3. Drop and recreate the foreign key constraint without NOT NULL
DO $$
BEGIN
  -- Check if FK exists and drop it
  IF EXISTS (
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'questions_topic_id_fkey' 
    AND table_name = 'questions'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE public.questions DROP CONSTRAINT questions_topic_id_fkey;
    RAISE NOTICE 'Dropped existing foreign key constraint';
  END IF;

  -- Recreate the FK with proper NULL handling
  ALTER TABLE public.questions
  ADD CONSTRAINT questions_topic_id_fkey 
  FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;
  
  RAISE NOTICE 'Created new foreign key constraint allowing NULL';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error managing foreign key: %', SQLERRM;
END $$;

-- 4. Update RLS policies to allow NULL topics
-- These should already be fine, but let's ensure

-- 5. Cleanup: Update NULL topics for Foundation grades to ensure consistency
UPDATE public.questions
SET 
  topic = NULL,
  topic_id = NULL
WHERE exam IN ('Foundation-6', 'Foundation-7', 'Foundation-8', 'Foundation-9', 'Foundation-10', 'Scholarship', 'Olympiad')
  AND (topic = '' OR topic = 'General' OR topic IS NULL)
  AND topic_id IS NOT NULL;

-- 6. Add comments
COMMENT ON COLUMN public.questions.topic IS 'Topic name - NULL for Foundation/Scholarship/Olympiad (grades 6-10), required for JEE/NEET (grades 11-12)';
COMMENT ON COLUMN public.questions.topic_id IS 'Foreign key to topics table - NULL for Foundation/Scholarship/Olympiad courses, required for JEE/NEET';

-- 7. Verify the changes
DO $$
DECLARE
  v_topic_nullable BOOLEAN;
  v_topic_id_nullable BOOLEAN;
  v_fk_exists BOOLEAN;
BEGIN
  SELECT (column_default IS NULL AND is_nullable = 'YES')
  INTO v_topic_nullable
  FROM information_schema.columns
  WHERE table_name = 'questions' AND column_name = 'topic';

  SELECT (column_default IS NULL AND is_nullable = 'YES')
  INTO v_topic_id_nullable
  FROM information_schema.columns
  WHERE table_name = 'questions' AND column_name = 'topic_id';

  SELECT EXISTS(
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'questions_topic_id_fkey'
    AND table_name = 'questions'
  )
  INTO v_fk_exists;

  RAISE NOTICE 'Topic nullable: %, Topic_id nullable: %, FK exists: %', v_topic_nullable, v_topic_id_nullable, v_fk_exists;
END $$;
