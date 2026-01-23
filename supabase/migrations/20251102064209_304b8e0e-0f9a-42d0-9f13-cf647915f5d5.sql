-- Fix Security Issue 1: Function Search Path Mutable
-- Add SET search_path = public to functions that are missing it

-- Fix validate_question_answer function
CREATE OR REPLACE FUNCTION public.validate_question_answer(_question_id uuid, _user_answer text)
 RETURNS TABLE(attempt_id uuid, is_correct boolean, correct_option text, explanation text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_user_id UUID;
  v_correct_option TEXT;
  v_is_correct BOOLEAN;
  v_explanation TEXT;
  v_attempt_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  SELECT correct_option, explanation
  INTO v_correct_option, v_explanation
  FROM questions
  WHERE id = _question_id;

  IF v_correct_option IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  v_is_correct := (_user_answer = v_correct_option);

  INSERT INTO question_attempts (
    user_id, question_id, selected_option, is_correct, attempted_at
  )
  VALUES (
    v_user_id, _question_id, _user_answer, v_is_correct, NOW()
  )
  RETURNING id INTO v_attempt_id;

  RETURN QUERY
  SELECT v_attempt_id, v_is_correct, v_correct_option, COALESCE(v_explanation, '');
END;
$function$;

-- Fix update_last_attempt_time function
CREATE OR REPLACE FUNCTION public.update_last_attempt_time()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.last_attempt_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_daily_progress function
CREATE OR REPLACE FUNCTION public.update_daily_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO daily_progress_log (user_id, date, actual_minutes, topics_completed)
  VALUES (NEW.user_id, CURRENT_DATE, NEW.completed_minutes, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    actual_minutes = daily_progress_log.actual_minutes + NEW.completed_minutes,
    topics_completed = daily_progress_log.topics_completed + 1,
    adherence_percentage = (daily_progress_log.actual_minutes::DECIMAL / NULLIF(daily_progress_log.planned_minutes, 0)) * 100;
    
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  
  insert into public.user_stats (user_id)
  values (new.id);
  
  return new;
end;
$function$;

-- Fix Security Issue 2: Database Functions Bypass RLS Without Validation
-- Add auth checks to SECURITY DEFINER functions

-- Fix award_points function with auth check
CREATE OR REPLACE FUNCTION public.award_points(p_user_id uuid, p_points integer, p_action text, p_description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Validate that the authenticated user matches the user receiving points
  -- This prevents users from awarding points to other users
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot award points to other users';
  END IF;
  
  -- Insert points log
  INSERT INTO public.points_log (user_id, points, action, description)
  VALUES (p_user_id, p_points, p_action, p_description);
  
  -- Update total points in profile
  UPDATE public.profiles
  SET total_points = COALESCE(total_points, 0) + p_points
  WHERE id = p_user_id;
END;
$function$;

-- Fix check_and_award_badges function with auth check
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_total_points INTEGER;
  v_badge RECORD;
BEGIN
  -- Validate that the authenticated user matches the user being checked
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot check badges for other users';
  END IF;
  
  -- Get user's total points
  SELECT COALESCE(total_points, 0) INTO v_total_points
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check all badges
  FOR v_badge IN 
    SELECT b.id, b.points_required
    FROM public.badges b
    WHERE b.points_required <= v_total_points
      AND NOT EXISTS (
        SELECT 1 FROM public.user_badges ub
        WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
      )
  LOOP
    -- Award badge
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id);
  END LOOP;
END;
$function$;

-- Fix Security Issue 3: Admin Authorization Checked Only in Client
-- Enable RLS on user_roles table and create helper function

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy: Only service role can insert roles (admins created via backend/SQL only)
CREATE POLICY "Only service role can insert roles" ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Create policy: Only service role can update roles
CREATE POLICY "Only service role can update roles" ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (false);

-- Create policy: Only service role can delete roles
CREATE POLICY "Only service role can delete roles" ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (false);

-- Create helper function to check admin status
-- This is already created (has_role), so just ensure it's properly set up
-- The function already exists with proper SECURITY DEFINER and search_path

-- Add RLS policies for admin-only operations on chapters table
CREATE POLICY "Anyone can view chapters" ON public.chapters
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert chapters" ON public.chapters
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update chapters" ON public.chapters
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete chapters" ON public.chapters
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policies for topics table (admin-only modifications)
CREATE POLICY "Anyone can view topics" ON public.topics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert topics" ON public.topics
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update topics" ON public.topics
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete topics" ON public.topics
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));