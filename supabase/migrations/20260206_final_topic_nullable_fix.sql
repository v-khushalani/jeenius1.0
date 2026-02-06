-- FINAL FIX: Make topic and topic_id nullable for grades ≤10 (Foundation/Scholarship/Olympiad)
-- Keep topic_id required for grades 11-12 (JEE/NEET/CET) through application logic
-- This migration ensures no constraints prevent NULL values for Foundation courses

-- ============================================================================
-- 1. ENSURE COLUMNS ARE NULLABLE
-- ============================================================================

-- Make topic column nullable (if not already)
DO $$
BEGIN
  ALTER TABLE public.questions
  ALTER COLUMN topic DROP NOT NULL;
  RAISE NOTICE 'Column topic made nullable';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Column topic already nullable or does not have NOT NULL constraint';
END $$;

-- Make topic_id column nullable (if not already)
DO $$
BEGIN
  ALTER TABLE public.questions
  ALTER COLUMN topic_id DROP NOT NULL;
  RAISE NOTICE 'Column topic_id made nullable';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Column topic_id already nullable or does not have NOT NULL constraint';
END $$;

-- ============================================================================
-- 2. ENSURE FOREIGN KEY ALLOWS NULL VALUES
-- ============================================================================

DO $$
BEGIN
  -- First, check if the foreign key exists
  IF EXISTS (
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'questions_topic_id_fkey' 
    AND table_name = 'questions'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Drop the existing foreign key
    ALTER TABLE public.questions 
    DROP CONSTRAINT questions_topic_id_fkey;
    RAISE NOTICE 'Dropped existing foreign key constraint questions_topic_id_fkey';
  END IF;

  -- Recreate the foreign key with ON DELETE SET NULL for NULL safety
  ALTER TABLE public.questions
  ADD CONSTRAINT questions_topic_id_fkey 
  FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;
  
  RAISE NOTICE 'Created new foreign key constraint with ON DELETE SET NULL';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error managing foreign key: %', SQLERRM;
END $$;

-- ============================================================================
-- 3. ENSURE TOPIC COLUMN IS TEXT TYPE (NOT OTHER TYPES THAT MIGHT REJECT NULL)
-- ============================================================================

DO $$
DECLARE
  v_column_type TEXT;
BEGIN
  SELECT data_type INTO v_column_type
  FROM information_schema.columns
  WHERE table_name = 'questions' AND column_name = 'topic';
  
  RAISE NOTICE 'Column topic has type: %', v_column_type;
  
  -- If needed, alter type (usually shouldn't be necessary)
  IF v_column_type != 'text' THEN
    ALTER TABLE public.questions
    ALTER COLUMN topic TYPE text USING topic::text;
    RAISE NOTICE 'Converted topic column to text type';
  END IF;
END $$;

-- ============================================================================
-- 4. CLEANUP: UPDATE FOUNDATION QUESTIONS TO HAVE NULL TOPICS
-- ============================================================================

UPDATE public.questions
SET 
  topic = NULL,
  topic_id = NULL
WHERE exam IN ('Foundation-6', 'Foundation-7', 'Foundation-8', 'Foundation-9', 'Foundation-10', 'Scholarship', 'Olympiad')
  AND (topic IS NULL OR topic = '' OR topic = 'General' OR topic = 'NA' OR topic = 'N/A');

-- Log how many Foundation questions were updated
DO $$
DECLARE
  v_foundation_count INTEGER;
  v_foundation_with_null_topic INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_foundation_count
  FROM public.questions
  WHERE exam IN ('Foundation-6', 'Foundation-7', 'Foundation-8', 'Foundation-9', 'Foundation-10', 'Scholarship', 'Olympiad');
  
  SELECT COUNT(*) INTO v_foundation_with_null_topic
  FROM public.questions
  WHERE exam IN ('Foundation-6', 'Foundation-7', 'Foundation-8', 'Foundation-9', 'Foundation-10', 'Scholarship', 'Olympiad')
  AND topic IS NULL;
  
  RAISE NOTICE 'Foundation courses: % total, % with NULL topic', v_foundation_count, v_foundation_with_null_topic;
END $$;

-- ============================================================================
-- 5. COLUMN DOCUMENTATION & COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.questions.topic IS 
  'Topic name - NULL for Foundation/Scholarship/Olympiad (grades 6-10), required by application logic for JEE/NEET/CET (grades 11-12)';

COMMENT ON COLUMN public.questions.topic_id IS 
  'Foreign key reference to topics table - NULL for Foundation/Scholarship/Olympiad courses (grades 6-10), required by application logic for JEE/NEET (grades 11-12)';

-- ============================================================================
-- 6. FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_topic_nullable BOOLEAN;
  v_topic_id_nullable BOOLEAN;
  v_fk_exists BOOLEAN;
  v_total_questions INTEGER;
  v_null_topic_count INTEGER;
  v_jee_null_topic_count INTEGER;
BEGIN
  -- Check if columns are nullable
  SELECT is_nullable = 'YES'
  INTO v_topic_nullable
  FROM information_schema.columns
  WHERE table_name = 'questions' AND column_name = 'topic';

  SELECT is_nullable = 'YES'
  INTO v_topic_id_nullable
  FROM information_schema.columns
  WHERE table_name = 'questions' AND column_name = 'topic_id';

  -- Check if FK exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'questions_topic_id_fkey'
    AND table_name = 'questions'
  )
  INTO v_fk_exists;
  
  -- Count questions
  SELECT COUNT(*) INTO v_total_questions FROM public.questions;
  SELECT COUNT(*) INTO v_null_topic_count FROM public.questions WHERE topic IS NULL;
  SELECT COUNT(*) INTO v_jee_null_topic_count 
  FROM public.questions 
  WHERE exam IN ('JEE', 'NEET', 'MHT-CET', 'CET')
  AND topic IS NULL;

  RAISE NOTICE '====== FINAL STATUS ======';
  RAISE NOTICE 'Column topic is nullable: %', v_topic_nullable;
  RAISE NOTICE 'Column topic_id is nullable: %', v_topic_id_nullable;
  RAISE NOTICE 'Foreign key constraint exists: %', v_fk_exists;
  RAISE NOTICE 'Total questions: %', v_total_questions;
  RAISE NOTICE 'Questions with NULL topic: %', v_null_topic_count;
  RAISE NOTICE 'JEE/NEET questions with NULL topic (should be 0): %', v_jee_null_topic_count;
  RAISE NOTICE '==========================';
  
  IF NOT v_topic_nullable OR NOT v_topic_id_nullable OR NOT v_fk_exists THEN
    RAISE WARNING 'MIGRATION INCOMPLETE - Some requirements not met!';
  ELSE
    RAISE NOTICE 'MIGRATION SUCCESSFUL - All requirements met!';
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
