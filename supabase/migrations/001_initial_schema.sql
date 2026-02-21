-- 🗄️  Jeenius 1.0 - Database Schema Verification & Initial Setup
-- This script checks for required tables and creates them if missing

-- ✅ Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgtrgm";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1️⃣  USERS TABLE (Extended Auth)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣  CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subject, chapter_name)
);

-- 3️⃣  TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, topic_name)
);

-- 4️⃣  QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  topic TEXT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT,
  question_number TEXT,
  has_image BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  pdf_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5️⃣  QUESTION ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.question_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  selected_option TEXT,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6️⃣  STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  chapter TEXT,
  topic TEXT,
  duration_minutes INTEGER,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7️⃣  PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  plan_id TEXT NOT NULL,
  plan_duration INTEGER NOT NULL,
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8️⃣  SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9️⃣  BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT,
  description TEXT,
  price INTEGER NOT NULL,
  duration_days INTEGER,
  max_students INTEGER,
  current_students INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 🔟 BATCH ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.batch_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  UNIQUE(user_id, batch_id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON public.questions(chapter);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON public.question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question ON public.question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_user ON public.batch_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_batch ON public.batch_enrollments(batch_id);

-- ✅ Enable RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;

-- 🔒 RLS Policies

-- User Profiles: Users can see their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Questions: Everyone can read
CREATE POLICY "Everyone can view questions" ON public.questions
  FOR SELECT USING (true);

-- Question Attempts: Users can only access their own
CREATE POLICY "Users can view own attempts" ON public.question_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create attempts" ON public.question_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study Sessions: Users can only access their own
CREATE POLICY "Users can view own sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Payments: Users can only access their own
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions: Users can only access their own
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Batch Enrollments: Users can view their own
CREATE POLICY "Users can view own enrollments" ON public.batch_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in batches" ON public.batch_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ✨ Verification Queries
-- Run these to verify the schema is set up correctly:

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check questions table structure
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'questions' ORDER BY ordinal_position;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 📝 Comments for Documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user information beyond auth.users';
COMMENT ON TABLE public.questions IS 'All questions for practice and testing';
COMMENT ON TABLE public.question_attempts IS 'Record of user attempts on questions';
COMMENT ON TABLE public.study_sessions IS 'Track user study sessions';
COMMENT ON TABLE public.payments IS 'Payment records for subscriptions';
COMMENT ON TABLE public.subscriptions IS 'Active user subscriptions';
COMMENT ON TABLE public.batches IS 'Group study batches';
COMMENT ON TABLE public.batch_enrollments IS 'Track student enrollment in batches';
