
-- Add missing columns to batches table
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS offer_price NUMERIC;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add missing columns to chapters table
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- Add missing columns to topics table
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS topic_number INTEGER;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'Medium';
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 60;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- Add missing columns to extracted_questions_queue table
ALTER TABLE public.extracted_questions_queue ADD COLUMN IF NOT EXISTS page_number INTEGER DEFAULT 0;

-- Create admin_notifications table (used by NotificationManager)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT DEFAULT 'all',
  target_user_ids JSONB DEFAULT '[]',
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'scheduled', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin notifications" ON public.admin_notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create user_notifications table (for delivering notifications to users)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own user notifications" ON public.user_notifications FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user notifications" ON public.user_notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create exam_config table (used by ExamDateManager)
CREATE TABLE IF NOT EXISTS public.exam_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name TEXT NOT NULL UNIQUE,
  exam_date DATE,
  registration_deadline DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.exam_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exam config" ON public.exam_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage exam config" ON public.exam_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Seed default exam config data
INSERT INTO public.exam_config (exam_name, exam_date) VALUES
  ('JEE Main 2025', '2025-01-22'),
  ('JEE Advanced 2025', '2025-05-18'),
  ('NEET 2025', '2025-05-04')
ON CONFLICT (exam_name) DO NOTHING;

SELECT 'Additional tables and columns added successfully!' AS status;
