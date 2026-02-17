-- =============================================
-- PROFILE TABLE OPTIMIZATION - REMOVE DUPLICATES
-- Deploy to Supabase SQL Editor
-- =============================================

-- Step 1: Backup existing data (view for reference)
-- Run this query first to verify data:
-- SELECT COUNT(*) FROM profiles;

-- Step 2: Drop dependent indexes
DROP INDEX IF EXISTS idx_profiles_premium;

-- Step 3: Remove duplicate columns one by one
-- These columns are redundant/unused

-- ❌ DELETE: is_pro (use is_premium instead)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_pro CASCADE;

-- ❌ DELETE: premium_until (use subscription_end_date instead)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS premium_until CASCADE;

-- ❌ DELETE: daily_streak (use current_streak instead)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS daily_streak CASCADE;

-- ❌ DELETE: answer_streak (use current_streak instead, this was unclear)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS answer_streak CASCADE;

-- ❌ DELETE: longest_answer_streak (use longest_streak instead)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS longest_answer_streak CASCADE;

-- ❌ DELETE: total_streak_days (calculated from current_streak)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS total_streak_days CASCADE;

-- ❌ DELETE: correct_answers (derived from overall_accuracy)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS correct_answers CASCADE;

-- ❌ DELETE: total_questions_answered (use total_questions_solved instead)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS total_questions_answered CASCADE;

-- ❌ DELETE: daily_study_hours (use total_study_time instead)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS daily_study_hours CASCADE;

-- ❌ DELETE: goals_set (can derive from: selected_goal IS NOT NULL)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS goals_set CASCADE;

-- Step 4: Recreate optimized indexes
CREATE INDEX idx_profiles_premium ON public.profiles USING btree (is_premium, subscription_end_date)
WHERE is_premium = true;

CREATE INDEX idx_profiles_goal ON public.profiles USING btree (selected_goal);

-- Step 5: Add any missing useful columns
-- (Only if not already present)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_version INT DEFAULT 1;

-- Step 6: Update version for tracking
UPDATE public.profiles SET profile_version = 2, updated_at = now()
WHERE profile_version = 1;

-- Step 7: Verify schema
-- Run this to verify the cleaned structure:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- DONE! Migration complete
-- Summary: Removed 10 redundant columns
-- Your profiles table is now optimized!
SELECT 'Migration Complete ✅' as status,
       'Removed 10 duplicate columns' as action,
       NOW() as timestamp;
