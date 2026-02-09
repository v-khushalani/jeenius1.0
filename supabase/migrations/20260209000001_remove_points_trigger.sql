-- Remove the duplicate points trigger
-- Points are now calculated ONLY via PointsService in the app

DROP TRIGGER IF EXISTS trigger_award_points_on_attempt ON public.question_attempts;

-- Optionally drop the function too (not required but cleaner)
DROP FUNCTION IF EXISTS public.award_points_on_attempt();
