-- =============================================
-- GOAL CHANGE WITH DATA RESET - DEPLOY TO SUPABASE
-- Copy this entire file and paste in Supabase Dashboard > SQL Editor > New query
-- =============================================

-- Step 1: Add goal lock fields to profiles (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_goal VARCHAR(50),
ADD COLUMN IF NOT EXISTS goal_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS goal_locked_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_goal ON public.profiles(selected_goal);
CREATE INDEX IF NOT EXISTS idx_profiles_goal_locked ON public.profiles(goal_locked);

-- Step 2: Create goal change audit log
CREATE TABLE IF NOT EXISTS public.goal_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_goal VARCHAR(50),
  new_goal VARCHAR(50),
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(20) DEFAULT 'blocked',
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_goal_audit_user ON public.goal_change_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_audit_time ON public.goal_change_audit(attempted_at DESC);

-- Enable RLS 
ALTER TABLE public.goal_change_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own goal audit" ON public.goal_change_audit;
DROP POLICY IF EXISTS "System can insert goal audit" ON public.goal_change_audit;
DROP POLICY IF EXISTS "Admins can view all goal audits" ON public.goal_change_audit;

-- Create policies
CREATE POLICY "Users can view own goal audit" ON public.goal_change_audit
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert goal audit" ON public.goal_change_audit
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 3: Drop the old restrictive trigger (if exists)
DROP TRIGGER IF EXISTS trigger_prevent_goal_change ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_goal_change();

-- Step 4: Update constraint to allow more status types
ALTER TABLE public.goal_change_audit 
DROP CONSTRAINT IF EXISTS goal_change_audit_status_check;

ALTER TABLE public.goal_change_audit 
ADD CONSTRAINT goal_change_audit_status_check 
CHECK (status IN ('blocked', 'success', 'warning', 'reset'));

-- Step 5: Create function to RESET all user progress data
CREATE OR REPLACE FUNCTION public.reset_user_progress(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_counts JSONB;
  v_question_attempts_count INT := 0;
  v_test_attempts_count INT := 0;
  v_points_log_count INT := 0;
  v_content_access_count INT := 0;
  v_batch_subs_count INT := 0;
BEGIN
  -- Delete question attempts
  DELETE FROM public.question_attempts WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_question_attempts_count = ROW_COUNT;
  
  -- Delete test attempts
  DELETE FROM public.test_attempts WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_test_attempts_count = ROW_COUNT;
  
  -- Delete points log
  DELETE FROM public.points_log WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_points_log_count = ROW_COUNT;
  
  -- Delete content access records (if table exists)
  BEGIN
    DELETE FROM public.user_content_access WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_content_access_count = ROW_COUNT;
  EXCEPTION WHEN undefined_table THEN
    v_content_access_count := 0;
  END;
  
  -- Delete batch subscriptions
  DELETE FROM public.user_batch_subscriptions WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_batch_subs_count = ROW_COUNT;
  
  -- Reset profile stats to zero
  UPDATE public.profiles
  SET 
    total_points = 0,
    current_streak = 0,
    longest_streak = 0,
    daily_streak = 0,
    answer_streak = 0,
    longest_answer_streak = 0,
    total_streak_days = 0,
    streak_freeze_available = true,
    questions_completed = 0,
    last_activity = now(),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Build result
  v_deleted_counts := jsonb_build_object(
    'question_attempts', v_question_attempts_count,
    'test_attempts', v_test_attempts_count,
    'points_log', v_points_log_count,
    'content_access', v_content_access_count,
    'batch_subscriptions', v_batch_subs_count,
    'profile_reset', true
  );
  
  RETURN v_deleted_counts;
END;
$$;

-- Step 6: Create function to change goal WITH data reset
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
  v_reset_result JSONB;
BEGIN
  -- Get current goal
  SELECT selected_goal, grade INTO v_old_goal, v_old_grade
  FROM profiles WHERE id = p_user_id;
  
  -- If same goal, no action needed
  IF v_old_goal = p_new_goal AND v_old_grade = p_new_grade THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'Same goal selected, no changes made'
    );
  END IF;
  
  -- If not confirmed, return warning
  IF NOT p_confirm_reset THEN
    RETURN jsonb_build_object(
      'success', false,
      'requires_confirmation', true,
      'warning', 'Changing your goal will DELETE all your progress data including points, streaks, and question history. This action cannot be undone.',
      'old_goal', v_old_goal,
      'new_goal', p_new_goal
    );
  END IF;
  
  -- User confirmed - reset all data
  v_reset_result := public.reset_user_progress(p_user_id);
  
  -- Update profile with new goal
  UPDATE profiles SET
    selected_goal = p_new_goal,
    grade = p_new_grade,
    target_exam = p_new_target_exam,
    goal_locked = false,
    goal_locked_at = NULL,
    goals_set = true,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Log the goal change
  INSERT INTO goal_change_audit (user_id, old_goal, new_goal, status, reason)
  VALUES (p_user_id, v_old_goal, p_new_goal, 'success', 'User confirmed goal change with data reset');
  
  RETURN jsonb_build_object(
    'success', true,
    'old_goal', v_old_goal,
    'new_goal', p_new_goal,
    'data_reset', v_reset_result
  );
END;
$$;

-- Step 7: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.reset_user_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_goal(UUID, VARCHAR, INT, VARCHAR, BOOLEAN) TO authenticated;

-- Done! 
SELECT 'Migration complete! Goal change with data reset is now enabled.' as status;
