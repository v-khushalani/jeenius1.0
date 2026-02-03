-- =============================================
-- MULTI-BATCH SYSTEM FOR LOWER GRADES
-- =============================================

-- 1. Create batches table (courses/programs)
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  grade INTEGER NOT NULL,
  exam_type TEXT NOT NULL, -- 'scholarship', 'homi_bhabha', 'foundation', 'jee', 'neet'
  price INTEGER NOT NULL DEFAULT 0, -- in paise
  validity_days INTEGER NOT NULL DEFAULT 365,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  icon TEXT, -- lucide icon name
  color TEXT, -- hex color for UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create batch_subjects table (subjects per batch - exam-specific)
CREATE TABLE IF NOT EXISTS public.batch_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(batch_id, subject)
);

-- 3. Create user_batch_subscriptions table (student access to batches)
CREATE TABLE IF NOT EXISTS public.user_batch_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, batch_id)
);

-- 3b. Create batch_payments table (payment records for batches)
CREATE TABLE IF NOT EXISTS public.batch_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL, -- in paise
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created', -- 'created', 'success', 'failed'
  batch_validity_days INTEGER, -- stored for audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Add batch_id to chapters table if not exists
ALTER TABLE public.chapters 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;

-- 5. Enable RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_batch_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_payments ENABLE ROW LEVEL SECURITY;

-- 5b. RLS Policies for batch_payments
CREATE POLICY "Users can view their own payments" 
ON public.batch_payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
ON public.batch_payments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments" 
ON public.batch_payments FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. RLS Policies for batches (public read, admin write)
CREATE POLICY "Batches are viewable by everyone" 
ON public.batches FOR SELECT USING (true);

CREATE POLICY "Admins can manage batches" 
ON public.batches FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 7. RLS Policies for batch_subjects
CREATE POLICY "Batch subjects are viewable by everyone" 
ON public.batch_subjects FOR SELECT USING (true);

CREATE POLICY "Admins can manage batch subjects" 
ON public.batch_subjects FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 8. RLS Policies for user_batch_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_batch_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
ON public.user_batch_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" 
ON public.user_batch_subscriptions FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Insert initial batches
INSERT INTO public.batches (name, slug, grade, exam_type, price, validity_days, description, display_order, icon, color) VALUES
-- 11th-12th (existing, now as batches)
('JEE 2026', 'jee-2026', 12, 'jee', 79900, 365, 'JEE Main & Advanced preparation', 1, 'Zap', '#f97316'),
('NEET 2026', 'neet-2026', 12, 'neet', 79900, 365, 'NEET preparation with Medical focus', 2, 'Heart', '#ef4444'),

-- 6-10 Foundation batches
('6th Foundation', '6th-foundation', 6, 'foundation', 19900, 365, 'Mathematics, Science & Mental Ability', 11, 'BookOpen', '#06b6d4'),
('7th Foundation', '7th-foundation', 7, 'foundation', 22900, 365, 'Enhanced foundation with Olympiad prep', 12, 'BookOpen', '#06b6d4'),
('8th Foundation', '8th-foundation', 8, 'foundation', 24900, 365, 'Pre-NTSE and Olympiad preparation', 22, 'BookOpen', '#06b6d4'),
('9th Foundation', '9th-foundation', 9, 'foundation', 29900, 365, 'NTSE, Olympiad and Board prep', 23, 'BookOpen', '#06b6d4'),
('10th Foundation', '10th-foundation', 10, 'foundation', 34900, 365, 'Board exams + JEE/NEET foundation', 24, 'BookOpen', '#06b6d4')
ON CONFLICT DO NOTHING;

-- 10. Insert batch subjects (exam-specific)
-- JEE subjects
INSERT INTO public.batch_subjects (batch_id, subject, display_order)
SELECT id, 'Physics', 1 FROM public.batches WHERE slug = 'jee-2026'
UNION ALL
SELECT id, 'Chemistry', 2 FROM public.batches WHERE slug = 'jee-2026'
UNION ALL
SELECT id, 'Mathematics', 3 FROM public.batches WHERE slug = 'jee-2026'
ON CONFLICT DO NOTHING;

-- NEET subjects
INSERT INTO public.batch_subjects (batch_id, subject, display_order)
SELECT id, 'Physics', 1 FROM public.batches WHERE slug = 'neet-2026'
UNION ALL
SELECT id, 'Chemistry', 2 FROM public.batches WHERE slug = 'neet-2026'
UNION ALL
SELECT id, 'Biology', 3 FROM public.batches WHERE slug = 'neet-2026'
ON CONFLICT DO NOTHING;

-- Foundation subjects
INSERT INTO public.batch_subjects (batch_id, subject, display_order)
SELECT id, 'Mathematics', 1 FROM public.batches WHERE exam_type = 'foundation'
UNION ALL
SELECT id, 'Science', 2 FROM public.batches WHERE exam_type = 'foundation'
UNION ALL
SELECT id, 'Mental Ability', 3 FROM public.batches WHERE exam_type = 'foundation'
ON CONFLICT DO NOTHING;

-- 11. Create function to check batch access
CREATE OR REPLACE FUNCTION public.has_batch_access(p_user_id UUID, p_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_batch_subscriptions
    WHERE user_id = p_user_id
      AND batch_id = p_batch_id
      AND status = 'active'
      AND expires_at > NOW()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND is_premium = true
      AND subscription_end_date > NOW()
  )
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_batch_subscriptions_user_id ON public.user_batch_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_batch_subscriptions_batch_id ON public.user_batch_subscriptions(batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_exam_type ON public.batches(exam_type);
CREATE INDEX IF NOT EXISTS idx_batches_grade ON public.batches(grade);
CREATE INDEX IF NOT EXISTS idx_batch_subjects_batch_id ON public.batch_subjects(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_payments_user_id ON public.batch_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_payments_batch_id ON public.batch_payments(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_payments_razorpay_order ON public.batch_payments(razorpay_order_id);
