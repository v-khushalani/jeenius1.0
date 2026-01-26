-- Topic Keywords for NLP-based Auto-Assignment
-- This migration adds keyword mapping for chapters and topics to enable intelligent auto-assignment

-- Create topic_keywords table to store keywords for each chapter/topic
CREATE TABLE IF NOT EXISTS public.topic_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.topics(id) ON DELETE CASCADE,
  keywords text[] NOT NULL, -- Array of keywords/phrases
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_topic_keywords_chapter ON public.topic_keywords(chapter_id);
CREATE INDEX idx_topic_keywords_topic ON public.topic_keywords(topic_id);
CREATE INDEX idx_topic_keywords_gin ON public.topic_keywords USING gin(keywords);

-- Enable RLS
ALTER TABLE public.topic_keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view topic keywords" ON public.topic_keywords
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage topic keywords" ON public.topic_keywords
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE is_admin = true
    )
  );

-- Add confidence score to extracted_questions_queue
ALTER TABLE public.extracted_questions_queue 
ADD COLUMN IF NOT EXISTS auto_assigned_chapter_id uuid REFERENCES public.chapters(id),
ADD COLUMN IF NOT EXISTS auto_assigned_topic_id uuid REFERENCES public.topics(id),
ADD COLUMN IF NOT EXISTS confidence_score decimal(5,2),
ADD COLUMN IF NOT EXISTS assignment_method text CHECK (assignment_method IN ('auto', 'manual', 'suggested'));

-- Create function to extract keywords from text
CREATE OR REPLACE FUNCTION public.extract_keywords(input_text text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned_text text;
  words text[];
  keywords text[];
  word text;
  stop_words text[] := ARRAY['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'what', 'which', 'who', 'when', 'where', 'why', 'how'];
BEGIN
  -- Convert to lowercase and remove special characters
  cleaned_text := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s]', ' ', 'g'));
  
  -- Split into words
  words := string_to_array(cleaned_text, ' ');
  
  -- Filter stop words and short words
  keywords := ARRAY(
    SELECT DISTINCT word
    FROM unnest(words) AS word
    WHERE length(word) >= 3
    AND word != ALL(stop_words)
    AND word ~ '^[a-z]'
  );
  
  RETURN keywords;
END;
$$;

-- Create function to calculate keyword similarity (Jaccard similarity)
CREATE OR REPLACE FUNCTION public.calculate_keyword_similarity(keywords1 text[], keywords2 text[])
RETURNS decimal
LANGUAGE plpgsql
AS $$
DECLARE
  intersection_count int;
  union_count int;
BEGIN
  -- Calculate intersection
  SELECT COUNT(DISTINCT keyword) INTO intersection_count
  FROM (
    SELECT unnest(keywords1) AS keyword
    INTERSECT
    SELECT unnest(keywords2) AS keyword
  ) AS intersection;
  
  -- Calculate union
  SELECT COUNT(DISTINCT keyword) INTO union_count
  FROM (
    SELECT unnest(keywords1) AS keyword
    UNION
    SELECT unnest(keywords2) AS keyword
  ) AS union_set;
  
  -- Return Jaccard similarity
  IF union_count = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (intersection_count::decimal / union_count::decimal) * 100;
END;
$$;

-- Function to auto-assign chapter and topic based on question text
CREATE OR REPLACE FUNCTION public.auto_assign_topic(question_text text, question_subject text, question_chapter text DEFAULT NULL)
RETURNS TABLE(
  chapter_id uuid,
  topic_id uuid,
  confidence decimal,
  method text
)
LANGUAGE plpgsql
AS $$
DECLARE
  question_keywords text[];
  best_chapter_id uuid;
  best_topic_id uuid;
  best_score decimal := 0;
  chapter_score decimal;
  topic_score decimal;
  current_score decimal;
BEGIN
  -- Extract keywords from question
  question_keywords := public.extract_keywords(question_text);
  
  -- If no keywords extracted, return null
  IF array_length(question_keywords, 1) IS NULL THEN
    RETURN;
  END IF;
  
  -- Find best matching chapter and topic
  FOR best_chapter_id, best_topic_id, chapter_score, topic_score IN
    SELECT 
      tk.chapter_id,
      tk.topic_id,
      COALESCE(public.calculate_keyword_similarity(question_keywords, tk.keywords), 0) as ch_score,
      COALESCE(public.calculate_keyword_similarity(question_keywords, tk.keywords), 0) as tp_score
    FROM public.topic_keywords tk
    LEFT JOIN public.chapters c ON tk.chapter_id = c.id
    WHERE c.subject = question_subject
      OR question_subject IS NULL
    ORDER BY ch_score DESC, tp_score DESC
    LIMIT 1
  LOOP
    current_score := GREATEST(chapter_score, topic_score);
    
    IF current_score > best_score THEN
      best_score := current_score;
    END IF;
  END LOOP;
  
  -- Return result if confidence is above threshold (50%)
  IF best_score >= 50 THEN
    RETURN QUERY SELECT 
      best_chapter_id,
      best_topic_id,
      best_score,
      CASE 
        WHEN best_score >= 80 THEN 'auto'::text
        ELSE 'suggested'::text
      END;
  END IF;
END;
$$;

-- Populate initial keywords for common physics topics
-- This is a starter set - admin can add more via UI
INSERT INTO public.topic_keywords (chapter_id, topic_id, keywords)
SELECT 
  c.id as chapter_id,
  t.id as topic_id,
  CASE 
    -- Physics Keywords
    WHEN t.topic_name ILIKE '%kinematics%' THEN 
      ARRAY['motion', 'velocity', 'acceleration', 'displacement', 'speed', 'projectile', 'trajectory', 'distance', 'time', 'uniform', 'equations']
    WHEN t.topic_name ILIKE '%dynamics%' OR t.topic_name ILIKE '%newton%' THEN 
      ARRAY['force', 'mass', 'acceleration', 'friction', 'normal', 'tension', 'newton', 'law', 'inertia', 'momentum', 'impulse']
    WHEN t.topic_name ILIKE '%work%' OR t.topic_name ILIKE '%energy%' THEN 
      ARRAY['work', 'energy', 'power', 'kinetic', 'potential', 'conservative', 'joule', 'watt', 'conservation']
    WHEN t.topic_name ILIKE '%rotational%' OR t.topic_name ILIKE '%circular%' THEN 
      ARRAY['rotation', 'angular', 'torque', 'moment', 'inertia', 'circular', 'centripetal', 'centrifugal', 'radius']
    WHEN t.topic_name ILIKE '%gravitation%' THEN 
      ARRAY['gravity', 'gravitational', 'mass', 'weight', 'orbit', 'satellite', 'escape', 'velocity', 'kepler', 'planet']
    WHEN t.topic_name ILIKE '%thermodynamics%' OR t.topic_name ILIKE '%heat%' THEN 
      ARRAY['heat', 'temperature', 'thermal', 'entropy', 'enthalpy', 'gas', 'ideal', 'pressure', 'volume', 'carnot', 'efficiency']
    WHEN t.topic_name ILIKE '%waves%' OR t.topic_name ILIKE '%sound%' THEN 
      ARRAY['wave', 'frequency', 'wavelength', 'amplitude', 'sound', 'doppler', 'interference', 'resonance', 'vibration']
    WHEN t.topic_name ILIKE '%electrostatics%' OR t.topic_name ILIKE '%electric%field%' THEN 
      ARRAY['charge', 'electric', 'field', 'potential', 'capacitor', 'coulomb', 'gauss', 'flux', 'dipole']
    WHEN t.topic_name ILIKE '%current%' OR t.topic_name ILIKE '%circuit%' THEN 
      ARRAY['current', 'resistance', 'voltage', 'ohm', 'resistor', 'circuit', 'series', 'parallel', 'kirchhoff', 'power']
    WHEN t.topic_name ILIKE '%magnetism%' OR t.topic_name ILIKE '%magnetic%' THEN 
      ARRAY['magnetic', 'magnet', 'field', 'flux', 'induction', 'faraday', 'lenz', 'solenoid', 'coil']
    WHEN t.topic_name ILIKE '%optics%' OR t.topic_name ILIKE '%light%' THEN 
      ARRAY['light', 'reflection', 'refraction', 'lens', 'mirror', 'prism', 'interference', 'diffraction', 'polarization']
    WHEN t.topic_name ILIKE '%modern%' OR t.topic_name ILIKE '%quantum%' THEN 
      ARRAY['quantum', 'photon', 'photoelectric', 'planck', 'bohr', 'atom', 'nucleus', 'radioactive', 'decay', 'emission']
    
    -- Chemistry Keywords
    WHEN t.topic_name ILIKE '%atomic%structure%' THEN 
      ARRAY['atom', 'electron', 'proton', 'neutron', 'nucleus', 'shell', 'orbital', 'quantum', 'number']
    WHEN t.topic_name ILIKE '%periodic%' THEN 
      ARRAY['periodic', 'table', 'group', 'period', 'element', 'electronegativity', 'ionization', 'radius']
    WHEN t.topic_name ILIKE '%bonding%' OR t.topic_name ILIKE '%chemical%bond%' THEN 
      ARRAY['bond', 'ionic', 'covalent', 'metallic', 'hydrogen', 'valence', 'lewis', 'hybridization', 'vsepr']
    WHEN t.topic_name ILIKE '%thermochemistry%' THEN 
      ARRAY['enthalpy', 'entropy', 'gibbs', 'heat', 'reaction', 'hess', 'law', 'exothermic', 'endothermic']
    WHEN t.topic_name ILIKE '%equilibrium%' THEN 
      ARRAY['equilibrium', 'constant', 'lechateliers', 'reaction', 'quotient', 'concentration', 'pressure']
    WHEN t.topic_name ILIKE '%acid%' OR t.topic_name ILIKE '%base%' THEN 
      ARRAY['acid', 'base', 'ph', 'buffer', 'titration', 'indicator', 'neutralization', 'hydrogen', 'ion']
    WHEN t.topic_name ILIKE '%redox%' OR t.topic_name ILIKE '%electrochemistry%' THEN 
      ARRAY['oxidation', 'reduction', 'redox', 'electrode', 'cell', 'galvanic', 'electrolytic', 'nernst']
    WHEN t.topic_name ILIKE '%organic%' THEN 
      ARRAY['organic', 'carbon', 'hydrocarbon', 'alkane', 'alkene', 'alkyne', 'benzene', 'functional', 'group']
    
    -- Mathematics Keywords
    WHEN t.topic_name ILIKE '%algebra%' THEN 
      ARRAY['equation', 'polynomial', 'quadratic', 'linear', 'expression', 'factor', 'root', 'solve']
    WHEN t.topic_name ILIKE '%trigonometry%' THEN 
      ARRAY['sine', 'cosine', 'tangent', 'angle', 'triangle', 'identity', 'trigonometric', 'radian']
    WHEN t.topic_name ILIKE '%calculus%' OR t.topic_name ILIKE '%derivative%' THEN 
      ARRAY['derivative', 'integration', 'limit', 'differential', 'integral', 'calculus', 'maxima', 'minima']
    WHEN t.topic_name ILIKE '%vector%' THEN 
      ARRAY['vector', 'scalar', 'dot', 'cross', 'product', 'magnitude', 'direction', 'component']
    WHEN t.topic_name ILIKE '%matrix%' OR t.topic_name ILIKE '%determinant%' THEN 
      ARRAY['matrix', 'determinant', 'inverse', 'transpose', 'row', 'column', 'system', 'equation']
    WHEN t.topic_name ILIKE '%probability%' THEN 
      ARRAY['probability', 'random', 'event', 'sample', 'space', 'combination', 'permutation', 'distribution']
    WHEN t.topic_name ILIKE '%coordinate%geometry%' OR t.topic_name ILIKE '%straight%line%' THEN 
      ARRAY['coordinate', 'line', 'slope', 'distance', 'section', 'equation', 'point', 'axis']
    WHEN t.topic_name ILIKE '%circle%' OR t.topic_name ILIKE '%conic%' THEN 
      ARRAY['circle', 'radius', 'center', 'tangent', 'chord', 'parabola', 'ellipse', 'hyperbola', 'conic']
    
    ELSE 
      -- Default: use topic name words as keywords
      public.extract_keywords(t.topic_name || ' ' || COALESCE(t.description, '') || ' ' || c.chapter_name)
  END as keywords
FROM public.topics t
JOIN public.chapters c ON t.chapter_id = c.id
WHERE t.topic_name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also add chapter-level keywords (for questions without specific topics)
INSERT INTO public.topic_keywords (chapter_id, keywords)
SELECT 
  c.id as chapter_id,
  CASE 
    WHEN c.chapter_name ILIKE '%mechanics%' THEN 
      ARRAY['force', 'motion', 'velocity', 'acceleration', 'energy', 'work', 'power', 'momentum', 'newton']
    WHEN c.chapter_name ILIKE '%thermodynamics%' THEN 
      ARRAY['heat', 'temperature', 'gas', 'entropy', 'enthalpy', 'law', 'carnot', 'efficiency']
    WHEN c.chapter_name ILIKE '%electrostatics%' OR c.chapter_name ILIKE '%electricity%' THEN 
      ARRAY['charge', 'electric', 'field', 'potential', 'current', 'voltage', 'resistance', 'circuit']
    WHEN c.chapter_name ILIKE '%magnetism%' THEN 
      ARRAY['magnetic', 'field', 'flux', 'induction', 'faraday', 'lenz']
    WHEN c.chapter_name ILIKE '%optics%' THEN 
      ARRAY['light', 'reflection', 'refraction', 'lens', 'mirror', 'interference']
    WHEN c.chapter_name ILIKE '%waves%' THEN 
      ARRAY['wave', 'frequency', 'wavelength', 'sound', 'doppler']
    WHEN c.chapter_name ILIKE '%modern%physics%' THEN 
      ARRAY['quantum', 'atom', 'nucleus', 'radioactive', 'photon']
    WHEN c.chapter_name ILIKE '%organic%chemistry%' THEN 
      ARRAY['organic', 'carbon', 'hydrocarbon', 'functional', 'reaction']
    WHEN c.chapter_name ILIKE '%inorganic%chemistry%' THEN 
      ARRAY['inorganic', 'compound', 'salt', 'metal', 'coordination']
    WHEN c.chapter_name ILIKE '%physical%chemistry%' THEN 
      ARRAY['equilibrium', 'kinetics', 'thermodynamics', 'electrochemistry']
    WHEN c.chapter_name ILIKE '%algebra%' THEN 
      ARRAY['equation', 'polynomial', 'expression', 'solve', 'factor']
    WHEN c.chapter_name ILIKE '%calculus%' THEN 
      ARRAY['derivative', 'integral', 'limit', 'differential']
    WHEN c.chapter_name ILIKE '%coordinate%geometry%' THEN 
      ARRAY['coordinate', 'line', 'circle', 'parabola', 'slope']
    WHEN c.chapter_name ILIKE '%trigonometry%' THEN 
      ARRAY['sine', 'cosine', 'tangent', 'angle', 'triangle']
    WHEN c.chapter_name ILIKE '%vector%' THEN 
      ARRAY['vector', 'scalar', 'dot', 'cross', 'magnitude']
    ELSE 
      public.extract_keywords(c.chapter_name || ' ' || COALESCE(c.description, ''))
  END as keywords
FROM public.chapters c
WHERE c.chapter_name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create trigger to auto-update keywords timestamp
CREATE OR REPLACE FUNCTION public.update_topic_keywords_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_topic_keywords_timestamp
  BEFORE UPDATE ON public.topic_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_topic_keywords_timestamp();

COMMENT ON TABLE public.topic_keywords IS 'Stores keywords for NLP-based automatic topic assignment';
COMMENT ON FUNCTION public.extract_keywords IS 'Extracts meaningful keywords from text by removing stop words';
COMMENT ON FUNCTION public.calculate_keyword_similarity IS 'Calculates Jaccard similarity between two keyword sets';
COMMENT ON FUNCTION public.auto_assign_topic IS 'Automatically assigns chapter and topic based on question text using NLP';
