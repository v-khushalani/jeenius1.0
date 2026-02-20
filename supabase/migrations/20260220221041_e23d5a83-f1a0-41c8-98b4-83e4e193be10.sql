
-- Fix: Create app_role type (without IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'student');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  selected_goal TEXT,
  target_exam TEXT,
  grade INTEGER,
  subjects TEXT[],
  goals_set BOOLEAN DEFAULT false,
  goal_locked BOOLEAN DEFAULT false,
  goal_locked_at TIMESTAMP WITH TIME ZONE,
  is_premium BOOLEAN DEFAULT false,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  total_points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'BEGINNER',
  level_progress NUMERIC DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_streak_date DATE,
  badges JSONB DEFAULT '[]',
  total_questions_solved INTEGER DEFAULT 0,
  overall_accuracy NUMERIC DEFAULT 0,
  questions_completed INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_goal ON public.profiles(selected_goal);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(total_points DESC);

-- =============================================
-- 2. USER ROLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- =============================================
-- 3. BATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  exam_type TEXT NOT NULL,
  grade INTEGER,
  price NUMERIC DEFAULT 0,
  validity_days INTEGER DEFAULT 365,
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  features JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active batches" ON public.batches;
DROP POLICY IF EXISTS "Admins can manage batches" ON public.batches;

CREATE POLICY "Anyone can view active batches" ON public.batches FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage batches" ON public.batches FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_batches_exam_type ON public.batches(exam_type);
CREATE INDEX IF NOT EXISTS idx_batches_grade ON public.batches(grade);

-- =============================================
-- 4. BATCH SUBJECTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.batch_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (batch_id, subject)
);

ALTER TABLE public.batch_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view batch subjects" ON public.batch_subjects;
DROP POLICY IF EXISTS "Admins can manage batch subjects" ON public.batch_subjects;

CREATE POLICY "Anyone can view batch subjects" ON public.batch_subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage batch subjects" ON public.batch_subjects FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_batch_subjects_batch_id ON public.batch_subjects(batch_id);

-- =============================================
-- 5. USER BATCH SUBSCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_batch_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_id TEXT,
  amount_paid NUMERIC DEFAULT 0,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, batch_id)
);

ALTER TABLE public.user_batch_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_batch_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.user_batch_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_batch_subscriptions;

CREATE POLICY "Users can view their own subscriptions" ON public.user_batch_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.user_batch_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.user_batch_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_user_batch_subs_user_id ON public.user_batch_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_batch_subs_batch_id ON public.user_batch_subscriptions(batch_id);

-- =============================================
-- 6. CHAPTERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  chapter_number INTEGER DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins can manage chapters" ON public.chapters;

CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Admins can manage chapters" ON public.chapters FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_chapters_batch_id ON public.chapters(batch_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON public.chapters(subject);

-- =============================================
-- 7. TOPICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can manage topics" ON public.topics;

CREATE POLICY "Anyone can view topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage topics" ON public.topics FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON public.topics(chapter_id);

-- =============================================
-- 8. QUESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  subject TEXT NOT NULL,
  chapter TEXT,
  topic TEXT,
  subtopic TEXT,
  difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  question_type TEXT DEFAULT 'single_correct',
  exam TEXT DEFAULT 'JEE',
  year INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;

CREATE POLICY "Anyone can view active questions" ON public.questions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_questions_chapter_id ON public.questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON public.questions(exam);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);

-- =============================================
-- 9. QUESTION ATTEMPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_spent INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own attempts" ON public.question_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON public.question_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.question_attempts;

CREATE POLICY "Users can view their own attempts" ON public.question_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON public.question_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON public.question_attempts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON public.question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON public.question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_attempted_at ON public.question_attempts(attempted_at);

-- =============================================
-- 10. TEST SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  title TEXT,
  subject TEXT,
  total_questions INTEGER DEFAULT 0,
  attempted_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  score NUMERIC DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  time_taken INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  question_ids JSONB DEFAULT '[]',
  answers JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own test sessions" ON public.test_sessions;
DROP POLICY IF EXISTS "Admins can view all test sessions" ON public.test_sessions;

CREATE POLICY "Users can manage their own test sessions" ON public.test_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all test sessions" ON public.test_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON public.test_sessions(status);

-- =============================================
-- 11. TEST ATTEMPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN DEFAULT false,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own test attempts" ON public.test_attempts;

CREATE POLICY "Users can manage their own test attempts" ON public.test_attempts FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON public.test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_session_id ON public.test_attempts(session_id);

-- =============================================
-- 12. POINTS LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own points log" ON public.points_log;
DROP POLICY IF EXISTS "Users can insert their own points log" ON public.points_log;

CREATE POLICY "Users can view their own points log" ON public.points_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own points log" ON public.points_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_points_log_user_id ON public.points_log(user_id);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON public.points_log(created_at);

-- =============================================
-- 13. TOPIC MASTERY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  mastery_level NUMERIC DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_attempted TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own topic mastery" ON public.topic_mastery;

CREATE POLICY "Users can manage their own topic mastery" ON public.topic_mastery FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_id ON public.topic_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_topic_id ON public.topic_mastery(topic_id);

-- =============================================
-- 14. EXTRACTED QUESTIONS QUEUE
-- =============================================
CREATE TABLE IF NOT EXISTS public.extracted_questions_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing')),
  parsed_question JSONB NOT NULL DEFAULT '{}',
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.extracted_questions_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage extraction queue" ON public.extracted_questions_queue;

CREATE POLICY "Admins can manage extraction queue" ON public.extracted_questions_queue FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_extraction_queue_status ON public.extracted_questions_queue(status);

-- =============================================
-- 15. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'announcement')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- =============================================
-- 16. EXAM DATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.exam_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  exam_date DATE NOT NULL,
  registration_deadline DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.exam_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view exam dates" ON public.exam_dates;
DROP POLICY IF EXISTS "Admins can manage exam dates" ON public.exam_dates;

CREATE POLICY "Anyone can view exam dates" ON public.exam_dates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage exam dates" ON public.exam_dates FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- =============================================
-- 17. STUDY PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'My Study Plan',
  target_exam TEXT,
  target_date DATE,
  daily_hours NUMERIC DEFAULT 4,
  plan_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own study plans" ON public.study_plans;

CREATE POLICY "Users can manage their own study plans" ON public.study_plans FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON public.study_plans(user_id);

-- =============================================
-- 18. USER CONTENT ACCESS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_content_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);

ALTER TABLE public.user_content_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own content access" ON public.user_content_access;

CREATE POLICY "Users can manage their own content access" ON public.user_content_access FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_content_access_user_id ON public.user_content_access(user_id);

-- =============================================
-- 19. REFERRALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  bonus_points INTEGER DEFAULT 100,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;

CREATE POLICY "Users can view their own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- =============================================
-- 20. AUTO-UPDATE TIMESTAMP FUNCTION & TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_batches_updated_at ON public.batches;
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON public.chapters;
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_topics_updated_at ON public.topics;
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_topic_mastery_updated_at ON public.topic_mastery;
CREATE TRIGGER update_topic_mastery_updated_at BEFORE UPDATE ON public.topic_mastery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 21. AUTO-CREATE PROFILE + ROLE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Student'),
    NEW.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 22. GOAL CHANGE & RESET FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION public.reset_user_progress(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qa INT := 0;
  v_ta INT := 0;
  v_pl INT := 0;
BEGIN
  DELETE FROM public.question_attempts WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_qa = ROW_COUNT;
  DELETE FROM public.test_attempts WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_ta = ROW_COUNT;
  DELETE FROM public.test_sessions WHERE user_id = p_user_id;
  DELETE FROM public.points_log WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_pl = ROW_COUNT;
  DELETE FROM public.topic_mastery WHERE user_id = p_user_id;
  DELETE FROM public.user_content_access WHERE user_id = p_user_id;
  
  UPDATE public.profiles SET
    questions_completed = 0,
    total_questions_solved = 0,
    overall_accuracy = 0,
    total_points = 0,
    current_streak = 0,
    level = 'BEGINNER',
    level_progress = 0,
    last_activity = now(),
    updated_at = now()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object('question_attempts', v_qa, 'test_attempts', v_ta, 'points_log', v_pl, 'profile_reset', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.change_user_goal(
  p_user_id UUID,
  p_new_goal TEXT,
  p_new_grade INTEGER,
  p_new_target_exam TEXT,
  p_confirm_reset BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_goal TEXT;
  v_old_grade INTEGER;
  v_reset_result JSONB;
BEGIN
  SELECT selected_goal, grade INTO v_old_goal, v_old_grade FROM profiles WHERE id = p_user_id;
  
  IF v_old_goal = p_new_goal AND v_old_grade = p_new_grade THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Same goal selected');
  END IF;
  
  IF NOT p_confirm_reset THEN
    RETURN jsonb_build_object('success', false, 'requires_confirmation', true, 'warning', 'Changing your goal will reset all progress.', 'old_goal', v_old_goal, 'new_goal', p_new_goal);
  END IF;
  
  v_reset_result := public.reset_user_progress(p_user_id);
  
  UPDATE profiles SET
    selected_goal = p_new_goal, grade = p_new_grade, target_exam = p_new_target_exam,
    goal_locked = false, goal_locked_at = NULL, goals_set = true, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object('success', true, 'old_goal', v_old_goal, 'new_goal', p_new_goal, 'data_reset', v_reset_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_user_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_goal(UUID, TEXT, INTEGER, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- =============================================
-- 23. BACKFILL EXISTING USERS
-- =============================================
INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'full_name', 'Student'), au.email, now(), now()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'student'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id)
ON CONFLICT (user_id) DO NOTHING;

SELECT 'JEEnius Complete Database Schema Created Successfully!' AS status;
