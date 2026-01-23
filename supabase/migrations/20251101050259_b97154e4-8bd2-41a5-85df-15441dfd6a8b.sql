-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_required INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT 'purple',
  category TEXT NOT NULL DEFAULT 'achievement',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create points_log table for tracking all point transactions
CREATE TABLE IF NOT EXISTS public.points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own points log"
  ON public.points_log FOR SELECT
  USING (auth.uid() = user_id);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, points_required, color, category) VALUES
  ('First Steps', 'Complete your first question', '🎯', 10, 'blue', 'achievement'),
  ('Quick Learner', 'Answer 10 questions correctly', '⚡', 100, 'yellow', 'achievement'),
  ('Knowledge Seeker', 'Complete 50 questions', '📚', 500, 'purple', 'achievement'),
  ('Accuracy Master', 'Maintain 90% accuracy for 20 questions', '🎯', 200, 'green', 'skill'),
  ('Speed Demon', 'Answer 5 questions in under 30 seconds each', '⚡', 150, 'orange', 'skill'),
  ('Subject Expert - Physics', 'Score 100% in 10 Physics questions', '⚛️', 300, 'blue', 'subject'),
  ('Subject Expert - Chemistry', 'Score 100% in 10 Chemistry questions', '🧪', 300, 'green', 'subject'),
  ('Subject Expert - Mathematics', 'Score 100% in 10 Math questions', '📐', 300, 'purple', 'subject'),
  ('Consistency King', 'Study for 7 consecutive days', '👑', 700, 'gold', 'streak'),
  ('Marathon Runner', 'Complete 100 questions in a day', '🏃', 1000, 'red', 'achievement')
ON CONFLICT DO NOTHING;