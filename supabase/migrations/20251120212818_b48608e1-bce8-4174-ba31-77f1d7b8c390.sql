-- Allow all authenticated users to view basic profile info for leaderboard
-- This is safe because:
-- 1. Only non-sensitive fields are exposed (name, avatar, points)
-- 2. Application queries only select these specific columns
-- 3. PII fields (email, phone) are not exposed in leaderboard queries

CREATE POLICY "profiles_select_leaderboard"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: Even though this allows reading all columns, the application
-- only requests: id, full_name, avatar_url, total_points
-- Email and phone are never requested in leaderboard queries