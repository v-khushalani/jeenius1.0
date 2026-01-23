-- Comprehensive RLS Policies for User Data Tables
-- This migration adds proper Row Level Security policies for all tables that have RLS enabled but no policies

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- DAILY PERFORMANCE TABLE
-- =====================================================
CREATE POLICY "Users view own daily performance" ON public.daily_performance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily performance" ON public.daily_performance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily performance" ON public.daily_performance
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- DAILY USAGE TABLE
-- =====================================================
CREATE POLICY "Users view own daily usage" ON public.daily_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own daily usage" ON public.daily_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own daily usage" ON public.daily_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- DAILY PROGRESS LOG TABLE
-- =====================================================
CREATE POLICY "Users view own progress log" ON public.daily_progress_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own progress log" ON public.daily_progress_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress log" ON public.daily_progress_log
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- MOCK TEST SCHEDULE TABLE
-- =====================================================
CREATE POLICY "Users view own mock tests" ON public.mock_test_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own mock tests" ON public.mock_test_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own mock tests" ON public.mock_test_schedule
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own mock tests" ON public.mock_test_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PERFORMANCE PATTERNS TABLE
-- =====================================================
CREATE POLICY "Users view own performance patterns" ON public.performance_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own performance patterns" ON public.performance_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own performance patterns" ON public.performance_patterns
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
CREATE POLICY "Users view own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users insert own referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- =====================================================
-- REVISION QUEUE TABLE
-- =====================================================
CREATE POLICY "Users view own revision queue" ON public.revision_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own revision queue" ON public.revision_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own revision queue" ON public.revision_queue
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own revision queue" ON public.revision_queue
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- REVISION SCHEDULE TABLE
-- =====================================================
CREATE POLICY "Users view own revision schedule" ON public.revision_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own revision schedule" ON public.revision_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own revision schedule" ON public.revision_schedule
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own revision schedule" ON public.revision_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STUDENT PROFILE TABLE
-- =====================================================
CREATE POLICY "Users view own student profile" ON public.student_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own student profile" ON public.student_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own student profile" ON public.student_profile
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- STUDY PLAN METADATA TABLE
-- =====================================================
CREATE POLICY "Users view own study plan metadata" ON public.study_plan_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own study plan metadata" ON public.study_plan_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own study plan metadata" ON public.study_plan_metadata
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- STUDY PLANS TABLE
-- =====================================================
CREATE POLICY "Users view own study plans" ON public.study_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own study plans" ON public.study_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own study plans" ON public.study_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own study plans" ON public.study_plans
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STUDY SCHEDULE TABLE
-- =====================================================
CREATE POLICY "Users view own study schedule" ON public.study_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own study schedule" ON public.study_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own study schedule" ON public.study_schedule
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own study schedule" ON public.study_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TEST ATTEMPTS TABLE
-- =====================================================
CREATE POLICY "Users view own test attempts" ON public.test_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own test attempts" ON public.test_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TOPIC MASTERY TABLE
-- =====================================================
CREATE POLICY "Users view own topic mastery" ON public.topic_mastery
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own topic mastery" ON public.topic_mastery
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own topic mastery" ON public.topic_mastery
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TOPIC PRIORITIES TABLE
-- =====================================================
CREATE POLICY "Users view own topic priorities" ON public.topic_priorities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own topic priorities" ON public.topic_priorities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own topic priorities" ON public.topic_priorities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own topic priorities" ON public.topic_priorities
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- USAGE LIMITS TABLE
-- =====================================================
CREATE POLICY "Users view own usage limits" ON public.usage_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own usage limits" ON public.usage_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own usage limits" ON public.usage_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- USER CHALLENGE PROGRESS TABLE
-- =====================================================
CREATE POLICY "Users view own challenge progress" ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own challenge progress" ON public.user_challenge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own challenge progress" ON public.user_challenge_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- USER CONTENT ACCESS TABLE
-- =====================================================
CREATE POLICY "Users view own content access" ON public.user_content_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own content access" ON public.user_content_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- USER ENERGY LOGS TABLE
-- =====================================================
CREATE POLICY "Users view own energy logs" ON public.user_energy_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own energy logs" ON public.user_energy_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own energy logs" ON public.user_energy_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- USER RANKINGS TABLE (Special - users can view all for leaderboard)
-- =====================================================
CREATE POLICY "Everyone can view rankings" ON public.user_rankings
  FOR SELECT USING (true);

CREATE POLICY "Users insert own rankings" ON public.user_rankings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own rankings" ON public.user_rankings
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- USER SUBSCRIPTIONS TABLE
-- =====================================================
CREATE POLICY "Users view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions" ON public.user_subscriptions
  FOR ALL USING (true);

-- =====================================================
-- WEAKNESS ANALYSIS TABLE
-- =====================================================
CREATE POLICY "Users view own weakness analysis" ON public.weakness_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own weakness analysis" ON public.weakness_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own weakness analysis" ON public.weakness_analysis
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- AI USAGE LOG TABLE
-- =====================================================
CREATE POLICY "Users view own AI usage" ON public.ai_usage_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own AI usage" ON public.ai_usage_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own AI usage" ON public.ai_usage_log
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- DAILY CHALLENGES TABLE (Public read for all users)
-- =====================================================
CREATE POLICY "Everyone can view daily challenges" ON public.daily_challenges
  FOR SELECT USING (true);

-- =====================================================
-- FREE CONTENT LIMITS TABLE (Public read)
-- =====================================================
CREATE POLICY "Everyone can view content limits" ON public.free_content_limits
  FOR SELECT USING (true);

-- =====================================================
-- SUBSCRIPTION PLANS TABLE (Public read)
-- =====================================================
CREATE POLICY "Everyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- =====================================================
-- SYLLABUS MASTER TABLE (Public read)
-- =====================================================
CREATE POLICY "Everyone can view syllabus" ON public.syllabus_master
  FOR SELECT USING (true);

-- =====================================================
-- TOPIC DEPENDENCIES TABLE (Public read)
-- =====================================================
CREATE POLICY "Everyone can view topic dependencies" ON public.topic_dependencies
  FOR SELECT USING (true);