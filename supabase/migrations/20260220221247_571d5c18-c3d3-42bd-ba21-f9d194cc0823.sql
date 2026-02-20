
-- Add missing columns to topic_mastery (subject, chapter, topic for adaptive service)
ALTER TABLE public.topic_mastery ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.topic_mastery ADD COLUMN IF NOT EXISTS chapter TEXT;
ALTER TABLE public.topic_mastery ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.topic_mastery ADD COLUMN IF NOT EXISTS last_practiced TIMESTAMP WITH TIME ZONE;

-- Add missing columns to daily_progress
ALTER TABLE public.daily_progress ADD COLUMN IF NOT EXISTS questions_completed INTEGER DEFAULT 0;
ALTER TABLE public.daily_progress ADD COLUMN IF NOT EXISTS target_met BOOLEAN DEFAULT false;

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_question_limit INTEGER DEFAULT 50;

-- Add missing columns to user_content_access (content_identifier, subject)
ALTER TABLE public.user_content_access ADD COLUMN IF NOT EXISTS content_identifier TEXT;
ALTER TABLE public.user_content_access ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add missing column to question_attempts (created_at alias - already has attempted_at)
-- streakService uses created_at, let's add it as alias column
ALTER TABLE public.question_attempts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create free_content_limits table
CREATE TABLE IF NOT EXISTS public.free_content_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_type TEXT NOT NULL UNIQUE,
  limit_value INTEGER NOT NULL DEFAULT 50,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.free_content_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view free content limits" ON public.free_content_limits FOR SELECT USING (true);
CREATE POLICY "Admins can manage free content limits" ON public.free_content_limits FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Seed default limits
INSERT INTO public.free_content_limits (limit_type, limit_value, description) VALUES
  ('questions_per_day', 50, 'Number of questions free users can attempt per day'),
  ('ai_queries_per_day', 5, 'Number of AI queries free users can make per day'),
  ('tests_per_day', 2, 'Number of tests free users can take per day')
ON CONFLICT (limit_type) DO NOTHING;

-- Create conversion_prompts table (used by userLimitsService)
CREATE TABLE IF NOT EXISTS public.conversion_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.conversion_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own conversion prompts" ON public.conversion_prompts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all conversion prompts" ON public.conversion_prompts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

SELECT 'All remaining schema fixes applied!' AS status;
