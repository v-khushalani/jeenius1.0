- =============================================
-- GOAL CHANGE WITH DATA RESET
-- Allows goal changes but WARNS and RESETS all progress data
-- =============================================

-- 1. Drop the old restrictive trigger
DROP TRIGGER IF EXISTS trigger_prevent_goal_change ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_goal_change();

-- 2. Update goal_locked to be changeable
-- Remove the constraint that prevents unlocking
ALTER TABLE public.profiles 
ALTER COLUMN goal_locked SET DEFAULT false;

-- 3. Create function to RESET all user progress data
-- Called when user confirms goal change
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
  
  -- Delete content access records
  DELETE FROM public.user_content_access WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_content_access_count = ROW_COUNT;
  
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

-- 4. Create function to change goal WITH data reset
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
    goal_locked = false, -- Keep unlocked for future changes
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

-- 5. Update audit policy to allow success status
ALTER TABLE public.goal_change_audit 
DROP CONSTRAINT IF EXISTS goal_change_audit_status_check;

ALTER TABLE public.goal_change_audit 
ADD CONSTRAINT goal_change_audit_status_check 
CHECK (status IN ('blocked', 'success', 'warning', 'reset'));

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.reset_user_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_goal(UUID, VARCHAR, INT, VARCHAR, BOOLEAN) TO authenticated;
