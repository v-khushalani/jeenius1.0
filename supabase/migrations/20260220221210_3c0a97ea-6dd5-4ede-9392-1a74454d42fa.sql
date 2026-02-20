
-- Add missing columns to profiles for streak service
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_freeze_available BOOLEAN DEFAULT false;

-- Add missing columns to topic_mastery for adaptive level service
ALTER TABLE public.topic_mastery ADD COLUMN IF NOT EXISTS current_level TEXT DEFAULT 'beginner';
ALTER TABLE public.topic_mastery ADD COLUMN IF NOT EXISTS accuracy NUMERIC DEFAULT 0;

-- Add missing columns to referrals
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS reward_granted BOOLEAN DEFAULT false;

-- Add missing columns to badges
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Add missing columns to daily_progress
ALTER TABLE public.daily_progress ADD COLUMN IF NOT EXISTS accuracy_7day NUMERIC DEFAULT 0;

-- Fix: NotificationManager user_notifications insert needs title + message
-- Add index on question_attempts for created_at (already has attempted_at)
CREATE INDEX IF NOT EXISTS idx_question_attempts_created_at ON public.question_attempts(attempted_at DESC);

SELECT 'Final schema patches applied!' AS status;
