-- =============================================
-- SUBSCRIPTION SYSTEM MIGRATION
-- Free: 15 questions/day, 2 tests/month
-- Pro: ₹99/month or ₹499/year - Unlimited
-- =============================================

-- 1. Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_goal VARCHAR(50),
ADD COLUMN IF NOT EXISTS goal_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS goal_locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS previous_rank INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50);

-- 2. Create test_attempts table for tracking
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type VARCHAR(50) DEFAULT 'chapter', -- chapter, subject, full
  subjects TEXT[],
  chapters TEXT[],
  questions_count INTEGER,
  score INTEGER,
  correct_answers INTEGER,
  time_taken INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_attempts
DROP POLICY IF EXISTS "Users can view own test attempts" ON public.test_attempts;
CREATE POLICY "Users can view own test attempts" 
ON public.test_attempts FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own test attempts" ON public.test_attempts;
CREATE POLICY "Users can insert own test attempts" 
ON public.test_attempts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Index for monthly test counting
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_month 
ON public.test_attempts(user_id, created_at);

-- 3. Create goal_change_audit table
CREATE TABLE IF NOT EXISTS public.goal_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_goal VARCHAR(50),
  new_goal VARCHAR(50),
  old_grade INTEGER,
  new_grade INTEGER,
  change_type VARCHAR(50), -- grade_upgrade, program_switch, level_jump
  was_reset BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create user_content_access table
CREATE TABLE IF NOT EXISTS public.user_content_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(50),
  content_id VARCHAR(255),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create points_log table
CREATE TABLE IF NOT EXISTS public.points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Simple reset function
CREATE OR REPLACE FUNCTION public.reset_user_progress(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_question_count INT := 0;
  v_test_count INT := 0;
  v_batch_count INT := 0;
BEGIN
  -- Delete question attempts
  DELETE FROM public.question_attempts WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_question_count = ROW_COUNT;
  
  -- Delete test attempts
  DELETE FROM public.test_attempts WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_test_count = ROW_COUNT;
  
  -- Delete batch subscriptions
  DELETE FROM public.user_batch_subscriptions WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_batch_count = ROW_COUNT;
  
  -- NOTE: We do NOT reset points and streak - user keeps their rewards!
  -- Only update last_activity
  UPDATE public.profiles SET
    updated_at = now()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'question_attempts', v_question_count,
    'test_attempts', v_test_count,
    'batch_subscriptions', v_batch_count,
    'points_preserved', true,
    'streak_preserved', true
  );
END;
$$;

-- 7. Smart goal change function (no reset for grade upgrades)
CREATE OR REPLACE FUNCTION public.change_user_goal(
  p_user_id UUID,
  p_new_goal VARCHAR(50),
  p_new_grade INT,
  p_new_target_exam VARCHAR(100),
  p_confirm_reset BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_goal VARCHAR(50);
  v_old_grade INT;
  v_needs_reset BOOLEAN := false;
  v_change_type TEXT;
  v_reset_result JSONB;
BEGIN
  -- Get current values
  SELECT selected_goal, grade INTO v_old_goal, v_old_grade
  FROM profiles WHERE id = p_user_id;
  
  -- Same goal = no action
  IF COALESCE(v_old_goal, '') = p_new_goal AND COALESCE(v_old_grade, 0) = p_new_grade THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Same goal selected');
  END IF;
  
  -- Determine change type
  IF v_old_grade IS NULL OR v_old_goal IS NULL THEN
    v_change_type := 'first_time';
    v_needs_reset := false;
  ELSIF v_old_goal = p_new_goal AND p_new_grade = v_old_grade + 1 THEN
    v_change_type := 'grade_upgrade';
    v_needs_reset := false;
  ELSIF v_old_grade = p_new_grade THEN
    v_change_type := 'program_switch';
    v_needs_reset := false;
  ELSIF v_old_grade <= 10 AND p_new_grade >= 11 THEN
    v_change_type := 'level_jump';
    v_needs_reset := true;
  ELSIF v_old_grade >= 11 AND p_new_grade <= 10 THEN
    v_change_type := 'level_down';
    v_needs_reset := true;
  ELSE
    v_change_type := 'grade_change';
    v_needs_reset := false;
  END IF;
  
  -- If reset needed and not confirmed, ask for confirmation
  IF v_needs_reset AND NOT p_confirm_reset THEN
    RETURN jsonb_build_object(
      'success', false,
      'requires_confirmation', true,
      'change_type', v_change_type,
      'message', 'Big level change detected. Your progress will be reset.'
    );
  END IF;
  
  -- Perform reset only if needed
  IF v_needs_reset THEN
    v_reset_result := public.reset_user_progress(p_user_id);
  ELSE
    v_reset_result := jsonb_build_object('reset', false, 'reason', v_change_type);
  END IF;
  
  -- Update profile with new goal
  UPDATE profiles SET
    selected_goal = p_new_goal,
    grade = p_new_grade,
    target_exam = p_new_target_exam,
    goals_set = true,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Log the change
  INSERT INTO goal_change_audit (user_id, old_goal, new_goal, old_grade, new_grade, change_type, was_reset)
  VALUES (p_user_id, v_old_goal, p_new_goal, v_old_grade, p_new_grade, v_change_type, v_needs_reset);
  
  RETURN jsonb_build_object(
    'success', true,
    'change_type', v_change_type,
    'old_goal', v_old_goal,
    'new_goal', p_new_goal,
    'was_reset', v_needs_reset,
    'data_reset', v_reset_result
  );
END;
$$;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION public.reset_user_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_goal(UUID, VARCHAR, INT, VARCHAR, BOOLEAN) TO authenticated;

-- 9. Update leaderboard function to include previous_rank
DROP FUNCTION IF EXISTS public.get_leaderboard_with_stats(INTEGER);

CREATE OR REPLACE FUNCTION public.get_leaderboard_with_stats(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  current_streak INTEGER,
  total_questions BIGINT,
  correct_answers BIGINT,
  accuracy NUMERIC,
  previous_rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    COALESCE(p.total_points, 0)::INTEGER,
    COALESCE(p.current_streak, 0)::INTEGER,
    COALESCE(qa.total_questions, 0)::BIGINT,
    COALESCE(qa.correct_answers, 0)::BIGINT,
    CASE 
      WHEN COALESCE(qa.total_questions, 0) > 0 
      THEN ROUND((qa.correct_answers::NUMERIC / qa.total_questions::NUMERIC) * 100, 2)
      ELSE 0
    END,
    p.previous_rank
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_questions,
      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers
    FROM public.question_attempts
    GROUP BY user_id
  ) qa ON p.id = qa.user_id
  WHERE COALESCE(p.total_points, 0) > 0 OR COALESCE(qa.total_questions, 0) > 0
  ORDER BY COALESCE(p.total_points, 0) DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard_with_stats(INTEGER) TO authenticated;

-- 10. Rank snapshot function
CREATE OR REPLACE FUNCTION public.snapshot_daily_ranks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(total_points, 0) DESC) as current_rank
    FROM public.profiles
    WHERE COALESCE(total_points, 0) > 0
  )
  UPDATE public.profiles p
  SET previous_rank = r.current_rank::INTEGER
  FROM ranked r
  WHERE p.id = r.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.snapshot_daily_ranks() TO service_role;

-- Initialize ranks
SELECT snapshot_daily_ranks();

COMMENT ON TABLE public.test_attempts IS 'Tracks test attempts for monthly limit (free: 2/month)';
COMMENT ON FUNCTION public.change_user_goal IS 'Smart goal change: no reset for grade upgrades, only for level jumps (Foundation→JEE)';
