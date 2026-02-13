-- Migration: Add previous_rank to leaderboard stats function
-- Updates get_leaderboard_with_stats to return previous_rank for real rank change tracking

-- First ensure previous_rank column exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'previous_rank'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN previous_rank INTEGER DEFAULT NULL;
  END IF;
END $$;

-- Update function to include previous_rank
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
    COALESCE(p.total_points, 0)::INTEGER as total_points,
    COALESCE(p.current_streak, 0)::INTEGER as current_streak,
    COALESCE(qa.total_questions, 0)::BIGINT as total_questions,
    COALESCE(qa.correct_answers, 0)::BIGINT as correct_answers,
    CASE 
      WHEN COALESCE(qa.total_questions, 0) > 0 
      THEN ROUND((qa.correct_answers::NUMERIC / qa.total_questions::NUMERIC) * 100, 2)
      ELSE 0
    END as accuracy,
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
  ORDER BY COALESCE(p.total_points, 0) DESC, COALESCE(qa.total_questions, 0) DESC
  LIMIT limit_count;
END;
$$;

-- Create daily snapshot function to save current ranks as previous_rank
CREATE OR REPLACE FUNCTION public.snapshot_daily_ranks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update previous_rank with current rank based on total_points
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY COALESCE(total_points, 0) DESC) as current_rank
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

COMMENT ON FUNCTION public.get_leaderboard_with_stats IS 'Returns leaderboard data with stats and previous_rank for rank change tracking.';
COMMENT ON FUNCTION public.snapshot_daily_ranks IS 'Snapshots current ranks to previous_rank column. Call daily via cron.';
