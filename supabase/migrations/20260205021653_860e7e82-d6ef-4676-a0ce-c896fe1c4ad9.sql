-- Create 9th Foundation batch (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.batches
    WHERE grade = 9 AND exam_type = 'Foundation'
  ) THEN
    INSERT INTO public.batches (
      name,
      slug,
      exam_type,
      grade,
      description,
      display_order,
      price,
      validity_days,
      is_active
    ) VALUES (
      '9th Foundation',
      'foundation-9',
      'Foundation',
      9,
      'Class 9 Foundation curriculum (NCERT aligned)',
      90,
      0,
      365,
      true
    );
  END IF;
END $$;

-- Ensure batch_subjects for 9th Foundation (PCMB)
DO $$
DECLARE
  v_batch_id uuid;
BEGIN
  SELECT id INTO v_batch_id
  FROM public.batches
  WHERE grade = 9 AND exam_type = 'Foundation'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_batch_id IS NULL THEN
    RAISE EXCEPTION '9th Foundation batch not found after insert';
  END IF;

  DELETE FROM public.batch_subjects WHERE batch_id = v_batch_id;

  INSERT INTO public.batch_subjects (batch_id, subject, display_order)
  VALUES
    (v_batch_id, 'Physics', 1),
    (v_batch_id, 'Chemistry', 2),
    (v_batch_id, 'Mathematics', 3),
    (v_batch_id, 'Biology', 4);
END $$;

-- Insert chapters for 9th Foundation (minimal set; can be expanded later)
DO $$
DECLARE
  v_batch_id uuid;
BEGIN
  SELECT id INTO v_batch_id
  FROM public.batches
  WHERE grade = 9 AND exam_type = 'Foundation'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Physics
  INSERT INTO public.chapters (batch_id, subject, chapter_name, chapter_number, is_free, is_premium)
  SELECT v_batch_id, 'Physics', x.chapter_name, x.chapter_number, true, false
  FROM (VALUES
    ('Motion', 1),
    ('Force and Laws of Motion', 2),
    ('Gravitation', 3),
    ('Work and Energy', 4),
    ('Sound', 5)
  ) AS x(chapter_name, chapter_number)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chapters c
    WHERE c.batch_id = v_batch_id AND c.subject = 'Physics' AND c.chapter_name = x.chapter_name
  );

  -- Chemistry
  INSERT INTO public.chapters (batch_id, subject, chapter_name, chapter_number, is_free, is_premium)
  SELECT v_batch_id, 'Chemistry', x.chapter_name, x.chapter_number, true, false
  FROM (VALUES
    ('Matter in Our Surroundings', 1),
    ('Is Matter Around Us Pure?', 2),
    ('Atoms and Molecules', 3),
    ('Structure of the Atom', 4)
  ) AS x(chapter_name, chapter_number)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chapters c
    WHERE c.batch_id = v_batch_id AND c.subject = 'Chemistry' AND c.chapter_name = x.chapter_name
  );

  -- Biology
  INSERT INTO public.chapters (batch_id, subject, chapter_name, chapter_number, is_free, is_premium)
  SELECT v_batch_id, 'Biology', x.chapter_name, x.chapter_number, true, false
  FROM (VALUES
    ('Cell - The Fundamental Unit of Life', 1),
    ('Tissues', 2),
    ('Diversity in Living Organisms', 3),
    ('Why Do We Fall Ill?', 4),
    ('Natural Resources', 5)
  ) AS x(chapter_name, chapter_number)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chapters c
    WHERE c.batch_id = v_batch_id AND c.subject = 'Biology' AND c.chapter_name = x.chapter_name
  );

  -- Mathematics
  INSERT INTO public.chapters (batch_id, subject, chapter_name, chapter_number, is_free, is_premium)
  SELECT v_batch_id, 'Mathematics', x.chapter_name, x.chapter_number, true, false
  FROM (VALUES
    ('Number Systems', 1),
    ('Polynomials', 2),
    ('Coordinate Geometry', 3),
    ('Linear Equations in Two Variables', 4),
    ('Lines and Angles', 5),
    ('Triangles', 6)
  ) AS x(chapter_name, chapter_number)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.chapters c
    WHERE c.batch_id = v_batch_id AND c.subject = 'Mathematics' AND c.chapter_name = x.chapter_name
  );
END $$;
