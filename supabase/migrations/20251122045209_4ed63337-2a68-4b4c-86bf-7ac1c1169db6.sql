-- Create exam_config table for admin-managed exam dates
CREATE TABLE IF NOT EXISTS public.exam_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_name text NOT NULL UNIQUE,
  exam_date date NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.exam_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read exam dates
CREATE POLICY "Everyone can view exam dates"
  ON public.exam_config
  FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Only admins can update exam dates"
  ON public.exam_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default exam dates
INSERT INTO public.exam_config (exam_name, exam_date) VALUES
  ('JEE', '2026-05-24'),
  ('NEET', '2026-05-05')
ON CONFLICT (exam_name) DO NOTHING;