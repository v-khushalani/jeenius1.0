-- Add Class 9 Foundation Curriculum Chapters
-- These chapters are for 9th grade foundation course
-- Sources: NCERT Class 9 textbooks for Physics, Chemistry, Biology, and Mathematics

-- Get the batch_id for 9th Foundation
WITH foundation_9_batch AS (
  SELECT id FROM public.batches WHERE slug = '9th-foundation'
)

INSERT INTO public.chapters (subject, chapter_name, chapter_number, description, difficulty_level, estimated_time, is_free, is_premium, batch_id) 
SELECT 
  subject, chapter_name, chapter_number, description, difficulty_level, estimated_time, is_free, is_premium,
  (SELECT id FROM foundation_9_batch)
FROM (
  -- PHYSICS - Class 9
  VALUES
  ('Physics', 'Motion', 1, 'Introduction to motion, distance, displacement, speed and velocity', 'easy', 4, true, false),
  ('Physics', 'Force and Laws of Motion', 2, 'Newton''s laws of motion, inertia, momentum', 'easy', 5, true, false),
  ('Physics', 'Gravitation', 3, 'Universal law of gravitation, weight and mass, acceleration due to gravity', 'medium', 5, false, true),
  ('Physics', 'Pressure', 4, 'Pressure in liquids and gases, Pascal''s principle, Archimedes'' principle', 'medium', 4, false, true),
  ('Physics', 'Work and Energy', 5, 'Work, energy, power, conservation of energy', 'medium', 5, false, true),
  ('Physics', 'Sound', 6, 'Sound propagation, frequency, amplitude, reflection of sound, SONAR', 'easy', 4, false, true),

  -- CHEMISTRY - Class 9
  ('Chemistry', 'Matter in Our Surroundings', 1, 'States of matter, characteristics of particles, boiling and melting points', 'easy', 4, true, false),
  ('Chemistry', 'Is Matter Around Us Pure?', 2, 'Pure substances, mixtures, homogeneous and heterogeneous mixtures, separation techniques', 'easy', 5, true, false),
  ('Chemistry', 'Atoms and Molecules', 3, 'Atomic mass, molecular mass, mole concept introduction', 'medium', 5, false, true),
  ('Chemistry', 'Structure of the Atom', 4, 'Dalton''s atomic theory, electrons, protons, neutrons, Bohr model', 'medium', 6, false, true),

  -- BIOLOGY - Class 9
  ('Biology', 'Cell - The Fundamental Unit of Life', 1, 'Cell structure, organelles, prokaryotic and eukaryotic cells', 'easy', 5, true, false),
  ('Biology', 'Tissues', 2, 'Plant tissues, animal tissues, types and functions', 'easy', 4, true, false),
  ('Biology', 'Improvement in Food Resources', 3, 'Crop production, animal husbandry, fisheries', 'easy', 4, false, true),
  ('Biology', 'Diversity in Living Organisms', 4, 'Classification of organisms, biodiversity, taxonomy', 'medium', 5, false, true),
  ('Biology', 'Why Do We Fall Ill?', 5, 'Health, disease, pathogens, immune system', 'medium', 5, false, true),
  ('Biology', 'Natural Resources', 6, 'Soil, water, forests, wildlife, conservation', 'easy', 4, false, true),

  -- MATHEMATICS - Class 9
  ('Mathematics', 'Number Systems', 1, 'Real numbers, rational and irrational numbers, number line', 'easy', 5, true, false),
  ('Mathematics', 'Polynomials', 2, 'Polynomial expressions, factors, remainder theorem, factor theorem', 'medium', 6, false, true),
  ('Mathematics', 'Coordinate Geometry', 3, 'Cartesian plane, plotting points, distance formula', 'medium', 5, false, true),
  ('Mathematics', 'Linear Equations in Two Variables', 4, 'Linear equations, graphical representation, solutions', 'medium', 6, false, true),
  ('Mathematics', 'Introduction to Euclid''s Geometry', 5, 'Euclidean geometry, axioms, postulates, theorems', 'easy', 4, false, true),
  ('Mathematics', 'Lines and Angles', 6, 'Lines, angles, properties, parallel lines and transversals', 'medium', 5, false, true),
  ('Mathematics', 'Triangles', 7, 'Triangle properties, congruence, similarity, area', 'medium', 7, false, true),
  ('Mathematics', 'Quadrilaterals', 8, 'Quadrilateral types, properties, area calculations', 'medium', 6, false, true),
  ('Mathematics', 'Circles', 9, 'Circle properties, angles, tangents, secants', 'medium', 6, false, true),
  ('Mathematics', 'Heron''s Formula', 10, 'Area of triangle using Heron''s formula, applications', 'medium', 4, false, true),
  ('Mathematics', 'Surface Areas and Volumes', 11, 'Surface area and volume of solids - cube, cuboid, cylinder, sphere, cone', 'medium', 7, false, true),
  ('Mathematics', 'Statistics', 12, 'Data representation, mean, median, mode, frequency distribution', 'easy', 5, false, true)
) AS chapter_data(subject, chapter_name, chapter_number, description, difficulty_level, estimated_time, is_free, is_premium)
ON CONFLICT DO NOTHING;

-- Add topics for each chapter (sample topics for foundation level)
WITH foundation_9_chapters AS (
  SELECT id, subject, chapter_name FROM public.chapters 
  WHERE batch_id = (SELECT id FROM public.batches WHERE slug = '9th-foundation')
)

INSERT INTO public.topics (chapter_id, topic_name, topic_number, description, difficulty_level)
SELECT 
  foc.id, 
  topic_data.topic_name,
  topic_data.topic_number,
  topic_data.description,
  'easy'
FROM foundation_9_chapters foc
JOIN (
  -- Physics Topics
  VALUES
  ('Motion', 1, 'Distance and displacement'),
  ('Motion', 2, 'Speed and velocity'),
  ('Motion', 3, 'Acceleration and retardation'),
  
  ('Force and Laws of Motion', 1, 'Newton''s First Law of Motion'),
  ('Force and Laws of Motion', 2, 'Newton''s Second Law of Motion'),
  ('Force and Laws of Motion', 3, 'Newton''s Third Law of Motion'),
  ('Force and Laws of Motion', 4, 'Momentum and impulse'),
  
  ('Gravitation', 1, 'Introduction to gravitation'),
  ('Gravitation', 2, 'Universal law of gravitation'),
  ('Gravitation', 3, 'Mass and weight'),
  ('Gravitation', 4, 'Free fall and acceleration due to gravity'),
  
  ('Pressure', 1, 'Pressure in solids'),
  ('Pressure', 2, 'Pressure in liquids'),
  ('Pressure', 3, 'Pascal''s principle'),
  ('Pressure', 4, 'Buoyancy and Archimedes'' principle'),
  
  ('Work and Energy', 1, 'Work and its units'),
  ('Work and Energy', 2, 'Forms of energy'),
  ('Work and Energy', 3, 'Conservation of energy'),
  ('Work and Energy', 4, 'Power and efficiency'),
  
  ('Sound', 1, 'Nature of sound'),
  ('Sound', 2, 'Speed of sound'),
  ('Sound', 3, 'Reflection of sound'),
  ('Sound', 4, 'Uses of ultrasound and sonar'),
  
  -- Chemistry Topics
  ('Matter in Our Surroundings', 1, 'States of matter'),
  ('Matter in Our Surroundings', 2, 'Characteristic properties of particles'),
  ('Matter in Our Surroundings', 3, 'Melting and boiling'),
  
  ('Is Matter Around Us Pure?', 1, 'Pure substances'),
  ('Is Matter Around Us Pure?', 2, 'Mixtures'),
  ('Is Matter Around Us Pure?', 3, 'Methods of separation'),
  
  ('Atoms and Molecules', 1, 'Elements, compounds and mixtures'),
  ('Atoms and Molecules', 2, 'Atomic mass'),
  ('Atoms and Molecules', 3, 'Molecular mass'),
  ('Atoms and Molecules', 4, 'Mole concept introduction'),
  
  ('Structure of the Atom', 1, 'Discovery of electron'),
  ('Structure of the Atom', 2, 'Discovery of nucleus'),
  ('Structure of the Atom', 3, 'Bohr''s model of atom'),
  ('Structure of the Atom', 4, 'Distribution of electrons'),
  
  -- Biology Topics
  ('Cell - The Fundamental Unit of Life', 1, 'Cell membrane and wall'),
  ('Cell - The Fundamental Unit of Life', 2, 'Nucleus'),
  ('Cell - The Fundamental Unit of Life', 3, 'Cytoplasm and organelles'),
  ('Cell - The Fundamental Unit of Life', 4, 'Prokaryotic and eukaryotic cells'),
  
  ('Tissues', 1, 'Plant tissues - meristematic and permanent'),
  ('Tissues', 2, 'Animal tissues - epithelial, connective, muscular, nervous'),
  
  ('Improvement in Food Resources', 1, 'Crop production'),
  ('Improvement in Food Resources', 2, 'Animal husbandry'),
  ('Improvement in Food Resources', 3, 'Fisheries'),
  
  ('Diversity in Living Organisms', 1, 'Classification system'),
  ('Diversity in Living Organisms', 2, 'Kingdoms'),
  ('Diversity in Living Organisms', 3, 'Phyla and groups'),
  
  ('Why Do We Fall Ill?', 1, 'Health and disease'),
  ('Why Do We Fall Ill?', 2, 'Pathogen and its types'),
  ('Why Do We Fall Ill?', 3, 'Immune system'),
  
  ('Natural Resources', 1, 'Soil and soil conservation'),
  ('Natural Resources', 2, 'Water resources'),
  ('Natural Resources', 3, 'Forest and wildlife conservation'),
  
  -- Mathematics Topics
  ('Number Systems', 1, 'Rational numbers'),
  ('Number Systems', 2, 'Irrational numbers'),
  ('Number Systems', 3, 'Real numbers and number line'),
  
  ('Polynomials', 1, 'Polynomial expressions'),
  ('Polynomials', 2, 'Factors of polynomials'),
  ('Polynomials', 3, 'Remainder and factor theorem'),
  
  ('Coordinate Geometry', 1, 'Cartesian coordinate system'),
  ('Coordinate Geometry', 2, 'Plotting of points'),
  ('Coordinate Geometry', 3, 'Distance formula'),
  
  ('Linear Equations in Two Variables', 1, 'Linear equations'),
  ('Linear Equations in Two Variables', 2, 'Graphical solutions'),
  ('Linear Equations in Two Variables', 3, 'Simultaneous equations'),
  
  ('Introduction to Euclid''s Geometry', 1, 'Euclidean axioms'),
  ('Introduction to Euclid''s Geometry', 2, 'Euclidean postulates'),
  ('Introduction to Euclid''s Geometry', 3, 'Basic theorems'),
  
  ('Lines and Angles', 1, 'Types of angles'),
  ('Lines and Angles', 2, 'Pair of angles'),
  ('Lines and Angles', 3, 'Parallel lines and transversal'),
  
  ('Triangles', 1, 'Congruence of triangles'),
  ('Triangles', 2, 'Properties of triangles'),
  ('Triangles', 3, 'Area of triangles'),
  
  ('Quadrilaterals', 1, 'Types of quadrilaterals'),
  ('Quadrilaterals', 2, 'Properties of quadrilaterals'),
  ('Quadrilaterals', 3, 'Area of quadrilaterals'),
  
  ('Circles', 1, 'Circle properties'),
  ('Circles', 2, 'Angles in circles'),
  ('Circles', 3, 'Tangents and secants'),
  
  ('Heron''s Formula', 1, 'Heron''s formula for triangle area'),
  ('Heron''s Formula', 2, 'Applications of Heron''s formula'),
  
  ('Surface Areas and Volumes', 1, 'Surface area of solids'),
  ('Surface Areas and Volumes', 2, 'Volume of solids'),
  ('Surface Areas and Volumes', 3, 'Combinations of solids'),
  
  ('Statistics', 1, 'Data representation'),
  ('Statistics', 2, 'Measures of central tendency'),
  ('Statistics', 3, 'Frequency distribution')
) AS topic_data(chapter_name, topic_number, topic_name)
ON topic_data.chapter_name = foc.chapter_name
ON CONFLICT DO NOTHING;
