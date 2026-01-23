-- Enable real-time updates for critical tables
-- This allows components to listen for changes and update automatically

-- Profiles table (user stats, points, streaks, subscription status)
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- Question attempts (for question counts and accuracy)
ALTER TABLE question_attempts REPLICA IDENTITY FULL;

-- Topic mastery (for study planner data)
ALTER TABLE topic_mastery REPLICA IDENTITY FULL;

-- Daily progress (for progress tracking)
ALTER TABLE daily_progress REPLICA IDENTITY FULL;

-- Points log (for points updates)
ALTER TABLE points_log REPLICA IDENTITY FULL;

-- User badges (for badge awards)
ALTER TABLE user_badges REPLICA IDENTITY FULL;

-- Study plans (for AI study planner updates)
ALTER TABLE study_plans REPLICA IDENTITY FULL;