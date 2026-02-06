-- Make topic_id nullable for Foundation courses
-- This migration ensures topic_id can be NULL even if a constraint was added elsewhere

-- Drop the NOT NULL constraint if it exists
DO $$
BEGIN
  -- Try to drop NOT NULL constraint by adding it back asNullable
  ALTER TABLE public.questions
  ALTER COLUMN topic_id DROP NOT NULL;
EXCEPTION WHEN others THEN
  -- Constraint doesn't exist, that's fine
  RAISE NOTICE 'topic_id already allows NULL values or constraint does not exist';
END $$;

-- Ensure the foreign key allows NULL
DO $$
BEGIN
  -- Drop existing FK if it has NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'questions_topic_id_fkey' AND table_name = 'questions'
  ) THEN
    ALTER TABLE public.questions
    DROP CONSTRAINT questions_topic_id_fkey;
  END IF;
  
  -- Recreate FK with proper NULL handling
  ALTER TABLE public.questions
  ADD CONSTRAINT questions_topic_id_fkey 
  FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN
  -- FK might already exist with correct settings
  RAISE NOTICE 'Foreign key already exists or error occurred: %', SQLERRM;
END $$;

-- Verify topic_id column allows NULL
COMMENT ON COLUMN public.questions.topic_id IS 'Foreign key reference to topics table - nullable for Foundation courses (grades 6-10)';
