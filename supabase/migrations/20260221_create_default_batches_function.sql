-- Function to create all default batches for the app
-- This function has SECURITY DEFINER so it bypasses RLS restrictions

CREATE OR REPLACE FUNCTION public.create_default_batches()
RETURNS TABLE (
  batch_id UUID,
  batch_name TEXT,
  grade_level INTEGER,
  exam_type TEXT,
  status TEXT
) AS $$
DECLARE
  v_batch_id UUID;
  v_batch_name TEXT;
  v_grade INTEGER;
  v_exam_type TEXT;
  v_subjects TEXT[];
BEGIN
  -- Define all batches to create
  FOR v_grade, v_exam_type, v_subjects IN
    SELECT * FROM (VALUES
      -- Foundation batches (grades 6-10)
      (6, 'Foundation', ARRAY['Science', 'Mathematics', 'Social Studies', 'English']),
      (7, 'Foundation', ARRAY['Science', 'Mathematics', 'Social Studies', 'English']),
      (8, 'Foundation', ARRAY['Science', 'Mathematics', 'Social Studies', 'English']),
      (9, 'Foundation', ARRAY['Physics', 'Chemistry', 'Mathematics', 'Biology']),
      (10, 'Foundation', ARRAY['Physics', 'Chemistry', 'Mathematics', 'Biology']),
      -- JEE batches (grades 11-12)
      (11, 'JEE', ARRAY['Physics', 'Chemistry', 'Mathematics']),
      (12, 'JEE', ARRAY['Physics', 'Chemistry', 'Mathematics']),
      -- NEET batches (grades 11-12)
      (11, 'NEET', ARRAY['Physics', 'Chemistry', 'Biology']),
      (12, 'NEET', ARRAY['Physics', 'Chemistry', 'Biology'])
    ) AS t(grade, exam_type, subjects)
  LOOP
    -- Check if batch already exists
    SELECT id INTO v_batch_id FROM public.batches
    WHERE grade = v_grade AND exam_type = v_exam_type
    LIMIT 1;

    -- Skip if exists
    IF v_batch_id IS NOT NULL THEN
      RETURN QUERY SELECT v_batch_id, 'Grade ' || v_grade || ' - ' || v_exam_type, v_grade, v_exam_type, 'SKIPPED';
      CONTINUE;
    END IF;

    -- Create batch
    INSERT INTO public.batches (name, exam_type, grade, description, is_active, is_free, display_order)
    VALUES (
      'Grade ' || v_grade || ' - ' || v_exam_type,
      v_exam_type,
      v_grade,
      'Grade ' || v_grade || ' - ' || v_exam_type || ' Complete Study Material',
      true,
      true,
      v_grade
    )
    RETURNING id INTO v_batch_id;

    -- Add subjects to batch
    INSERT INTO public.batch_subjects (batch_id, subject, display_order)
    SELECT v_batch_id, subject, row_number() OVER () FROM unnest(v_subjects) AS subject
    ON CONFLICT (batch_id, subject) DO NOTHING;

    RETURN QUERY SELECT v_batch_id, 'Grade ' || v_grade || ' - ' || v_exam_type, v_grade, v_exam_type, 'CREATED';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_default_batches() TO authenticated, anon;

-- Comment for documentation
COMMENT ON FUNCTION public.create_default_batches() IS 'Creates all default study batches for different grades and exam types. Can be called by anyone including anonymous users during app setup.';
