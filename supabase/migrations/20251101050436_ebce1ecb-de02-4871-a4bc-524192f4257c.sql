-- Add total_points column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Create function to award points
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_action TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert points log
  INSERT INTO public.points_log (user_id, points, action, description)
  VALUES (p_user_id, p_points, p_action, p_description);
  
  -- Update total points in profile
  UPDATE public.profiles
  SET total_points = COALESCE(total_points, 0) + p_points
  WHERE id = p_user_id;
END;
$$;

-- Create function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_points INTEGER;
  v_badge RECORD;
BEGIN
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
$$;

-- Create trigger to award points after question attempt
CREATE OR REPLACE FUNCTION public.award_points_on_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_correct THEN
    PERFORM award_points(
      NEW.user_id,
      10,
      'correct_answer',
      'Answered question correctly'
    );
    
    PERFORM check_and_award_badges(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_award_points_on_attempt ON public.question_attempts;
CREATE TRIGGER trigger_award_points_on_attempt
AFTER INSERT ON public.question_attempts
FOR EACH ROW
EXECUTE FUNCTION public.award_points_on_attempt();