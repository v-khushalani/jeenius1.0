-- Migration: Leaderboard Stats Function
-- Creates an RPC function to get leaderboard data with question stats
-- This bypasses RLS to aggregate question_attempts for all users

-- Create function to get leaderboard with stats
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_stats(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  current_streak INTEGER,
  total_questions BIGINT,
  correct_answers BIGINT,
  accuracy NUMERIC
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
    COALESCE(p.total_points, 0)::INTEGER as total_points,
    COALESCE(p.current_streak, 0)::INTEGER as current_streak,
    COALESCE(qa.total_questions, 0)::BIGINT as total_questions,
    COALESCE(qa.correct_answers, 0)::BIGINT as correct_answers,
    CASE 
      WHEN COALESCE(qa.total_questions, 0) > 0 
      THEN ROUND((qa.correct_answers::NUMERIC / qa.total_questions::NUMERIC) * 100, 2)
      ELSE 0
    END as accuracy
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
  ORDER BY COALESCE(p.total_points, 0) DESC, COALESCE(qa.total_questions, 0) DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_leaderboard_with_stats(INTEGER) TO authenticated;

-- Also backfill existing profiles with stats from question_attempts
UPDATE public.profiles p
SET
  total_questions_answered = COALESCE(qa.total_questions, 0),
  correct_answers = COALESCE(qa.correct_answers, 0),
  overall_accuracy = CASE 
    WHEN COALESCE(qa.total_questions, 0) > 0 
    THEN ROUND((qa.correct_answers::NUMERIC / qa.total_questions::NUMERIC) * 100, 2)
    ELSE 0
  END
FROM (
  SELECT 
    user_id,
    COUNT(*)::INTEGER as total_questions,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::INTEGER as correct_answers
  FROM public.question_attempts
  GROUP BY user_id
) qa
WHERE p.id = qa.user_id;

COMMENT ON FUNCTION public.get_leaderboard_with_stats IS 'Returns leaderboard data with accurate question stats aggregated from question_attempts. Uses SECURITY DEFINER to bypass RLS.';
