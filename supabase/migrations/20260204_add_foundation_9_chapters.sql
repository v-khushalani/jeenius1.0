-- Ensure 9th Foundation batch exists with all subjects
INSERT INTO public.batches (name, slug, exam_type, grade, description, display_order, created_at, updated_at)
VALUES (
  '9th Foundation',
  '9th-foundation',
  'Foundation',
  9,
  'Class 9 NCERT Curriculum - Physics, Chemistry, Mathematics, Biology',
  23,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Add batch subjects for 9th Foundation (PCMB)
DELETE FROM public.batch_subjects 
WHERE batch_id = (SELECT id FROM batches WHERE slug = '9th-foundation');

WITH batch_id AS (
  SELECT id FROM batches WHERE slug = '9th-foundation'
)
INSERT INTO public.batch_subjects (batch_id, subject, display_order)
SELECT batch_id.id, subject, order_num
FROM batch_id,
(VALUES
  ('Physics', 1),
  ('Chemistry', 2),
  ('Mathematics', 3),
  ('Biology', 4)
) AS subjects(subject, order_num);

-- Add Physics chapters for 9th Foundation
WITH batch_id AS (
  SELECT id FROM batches WHERE slug = '9th-foundation'
)
INSERT INTO public.chapters (batch_id, subject, chapter_name, chapter_number)
SELECT batch_id.id, 'Physics', chapter, row_number() OVER ()
FROM batch_id,
(VALUES 
  ('Motion'),
  ('Force and Laws of Motion'),
  ('Gravitation'),
  ('Pressure'),
  ('Work and Energy'),
  ('Sound')
) AS chapters(chapter)
ON CONFLICT DO NOTHING;

-- Add Chemistry chapters for 9th Foundation
WITH batch_id AS (
  SELECT id FROM batches WHERE slug = '9th-foundation'
)
INSERT INTO public.chapters (batch_id, subject, chapter_name, chapter_number)
SELECT batch_id.id, 'Chemistry', chapter, row_number() OVER ()
FROM batch_id,
(VALUES
  ('Matter in Our Surroundings'),
  ('Is Matter Around Us Pure?'),
  ('Atoms and Molecules'),
  ('Structure of the Atom')
) AS chapters(chapter)
ON CONFLICT DO NOTHING;

-- Add Biology chapters for 9th Foundation
WITH batch_id AS (
  SELECT id FROM batches WHERE slug = '9th-foundation'
)
INSERT INTO public.chapters (batch_id, subject, chapter_name, chapter_number)
SELECT batch_id.id, 'Biology', chapter, row_number() OVER ()
FROM batch_id,
(VALUES
  ('Cell - The Fundamental Unit of Life'),
  ('Tissues'),
  ('Improvement in Food Resources'),
  ('Diversity in Living Organisms'),
  ('Why Do We Fall Ill?'),
  ('Natural Resources')
) AS chapters(chapter)
ON CONFLICT DO NOTHING;

-- Add Mathematics chapters for 9th Foundation
WITH batch_id AS (
  SELECT id FROM batches WHERE slug = '9th-foundation'
)
INSERT INTO public.chapters (batch_id, subject, chapter_name, chapter_number)
SELECT batch_id.id, 'Mathematics', chapter, row_number() OVER ()
FROM batch_id,
(VALUES
  ('Number Systems'),
  ('Polynomials'),
  ('Coordinate Geometry'),
  ('Linear Equations in Two Variables'),
  ('Introduction to Euclid''s Geometry'),
  ('Lines and Angles'),
  ('Triangles'),
  ('Quadrilaterals'),
  ('Circles'),
  ('Heron''s Formula'),
  ('Surface Areas and Volumes'),
  ('Statistics')
) AS chapters(chapter)
ON CONFLICT DO NOTHING;
