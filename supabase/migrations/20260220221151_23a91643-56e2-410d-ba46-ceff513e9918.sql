
-- Add more missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 20;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_exam_date DATE;

-- Add difficulty_level to chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS difficulty_level TEXT;

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  points_required INTEGER DEFAULT 0,
  badge_type TEXT DEFAULT 'achievement',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Seed default badges
INSERT INTO public.badges (name, description, icon, points_required, badge_type) VALUES
  ('First Step', 'Attempted your first question', '🌱', 0, 'milestone'),
  ('Hot Streak', 'Got 5 correct answers in a row', '🔥', 0, 'streak'),
  ('On Fire', 'Got 10 correct answers in a row', '💥', 0, 'streak'),
  ('Unstoppable', 'Got 20 correct answers in a row', '⚡', 0, 'streak'),
  ('BEAST MODE', 'Got 50 correct answers in a row', '👑', 0, 'streak'),
  ('Century', 'Completed 100 questions', '💯', 0, 'milestone'),
  ('Scholar', 'Earned 1000 points', '📚', 1000, 'points'),
  ('Champion', 'Earned 5000 points', '🏆', 5000, 'points')
ON CONFLICT (name) DO NOTHING;

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- Create daily_progress table
CREATE TABLE IF NOT EXISTS public.daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  study_time INTEGER DEFAULT 0,
  daily_target INTEGER DEFAULT 20,
  streak_maintained BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily progress" ON public.daily_progress FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON public.daily_progress(user_id, date);

-- Create validate_question_answer RPC function
CREATE OR REPLACE FUNCTION public.validate_question_answer(
  p_question_id UUID,
  p_selected_option TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question RECORD;
BEGIN
  SELECT correct_option, explanation INTO v_question
  FROM public.questions
  WHERE id = p_question_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Question not found');
  END IF;
  
  RETURN jsonb_build_object(
    'is_correct', v_question.correct_option = p_selected_option,
    'correct_option', v_question.correct_option,
    'explanation', v_question.explanation
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_question_answer(UUID, TEXT) TO authenticated;

SELECT 'All additional tables and columns created!' AS status;
