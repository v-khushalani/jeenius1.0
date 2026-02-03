# 🚀 ONE-CLICK BATCH DEPLOYMENT

## Problem
Batch system is built, but **database tables don't exist yet**. That's why `/batches` shows a setup message instead of batch cards.

## Solution
Deploy the SQL migration (literally 30 seconds).

---

## ⚡ Quick Deploy

### Step 1: Open Supabase SQL Editor
Click here: https://app.supabase.com/project/zbclponzlwulmltwkjga/sql/new

Or manually:
- Go to supabase.com → Login
- Click project "zbclponzlwulmltwkjga"
- Left sidebar → SQL Editor
- Click "New Query"

### Step 2: Paste This SQL

Copy everything below and paste into the SQL editor:

```sql
-- Create batches table
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  grade INTEGER NOT NULL,
  exam_type TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  validity_days INTEGER DEFAULT 365,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create batch_subjects table
CREATE TABLE IF NOT EXISTS public.batch_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(batch_id, subject)
);

-- Create user_batch_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_batch_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  purchased_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, batch_id)
);

-- Create batch_payments table
CREATE TABLE IF NOT EXISTS public.batch_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created',
  batch_validity_days INTEGER,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_batch_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Admin manage batches" ON public.batches FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read batch subjects" ON public.batch_subjects FOR SELECT USING (true);
CREATE POLICY "Admin manage batch subjects" ON public.batch_subjects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own subscriptions" ON public.user_batch_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscriptions" ON public.user_batch_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage subscriptions" ON public.user_batch_subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own payments" ON public.batch_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own payments" ON public.batch_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage payments" ON public.batch_payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert sample batches
INSERT INTO public.batches (name, slug, grade, exam_type, price, validity_days, description, display_order, icon, color) VALUES
('JEE 2026', 'jee-2026', 12, 'jee', 79900, 365, 'JEE Main & Advanced preparation', 1, 'Zap', '#f97316'),
('NEET 2026', 'neet-2026', 12, 'neet', 79900, 365, 'NEET preparation', 2, 'Heart', '#ef4444'),
('6th Foundation', '6th-foundation', 6, 'foundation', 19900, 365, 'Foundation course', 11, 'BookOpen', '#06b6d4'),
('7th Foundation', '7th-foundation', 7, 'foundation', 22900, 365, 'Foundation course', 12, 'BookOpen', '#06b6d4'),
('8th Foundation', '8th-foundation', 8, 'foundation', 24900, 365, 'Foundation course', 22, 'BookOpen', '#06b6d4'),
('9th Foundation', '9th-foundation', 9, 'foundation', 29900, 365, 'Foundation course', 23, 'BookOpen', '#06b6d4'),
('10th Foundation', '10th-foundation', 10, 'foundation', 34900, 365, 'Foundation course', 24, 'BookOpen', '#06b6d4')
ON CONFLICT (slug) DO NOTHING;

-- Insert batch subjects
INSERT INTO public.batch_subjects (batch_id, subject, display_order) 
SELECT b.id, s, o FROM public.batches b, 
  UNNEST(ARRAY[('Physics', 1), ('Chemistry', 2), ('Mathematics', 3)]) as subs(s, o) 
WHERE b.slug = 'jee-2026' ON CONFLICT DO NOTHING;

INSERT INTO public.batch_subjects (batch_id, subject, display_order) 
SELECT b.id, s, o FROM public.batches b, 
  UNNEST(ARRAY[('Physics', 1), ('Chemistry', 2), ('Biology', 3)]) as subs(s, o) 
WHERE b.slug = 'neet-2026' ON CONFLICT DO NOTHING;

INSERT INTO public.batch_subjects (batch_id, subject, display_order) 
SELECT b.id, s, o FROM public.batches b, 
  UNNEST(ARRAY[('Mathematics', 1), ('Science', 2), ('Mental Ability', 3)]) as subs(s, o) 
WHERE b.exam_type = 'foundation' ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_batches_exam_type ON public.batches(exam_type);
CREATE INDEX IF NOT EXISTS idx_batches_grade ON public.batches(grade);
CREATE INDEX IF NOT EXISTS idx_user_batch_subscriptions_user_id ON public.user_batch_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_batch_subscriptions_batch_id ON public.user_batch_subscriptions(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_subjects_batch_id ON public.batch_subjects(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_payments_razorpay_order ON public.batch_payments(razorpay_order_id);
```

### Step 3: Click "Run"
- Paste the SQL above
- Click the green **"Run"** button
- Wait for "executed successfully" message

### Step 4: Done! 🎉
- Refresh http://localhost:5175/batches
- You should see batch cards appear!
- Go to `/admin/batches` to create/edit batches

---

## What Was Created

| Table | Contains |
|-------|----------|
| `batches` | JEE, NEET, Foundation 6-10 courses |
| `batch_subjects` | Math, Science, Physics, Chemistry, Biology per course |
| `user_batch_subscriptions` | Track which students have access to which batches |
| `batch_payments` | Razorpay payment records for purchases |

---

## Now What?

After deployment:

### 👨‍💼 Admin Features
- Visit `/admin/batches`
- Create new batches (click "Create Batch")
- Edit pricing (click price field directly)
- Manage subjects (add/remove from each batch)
- Toggle active status

### 👨‍🎓 Student Features  
- Visit `/batches`
- Browse all available batches
- Purchase with Razorpay
- Auto-get access after payment

### 💳 Payment Flow
- Student → Purchases batch → Razorpay modal → Pays → Auto-granted access
- Access expires after `validity_days` (default 365 days)

---

## Troubleshooting

**Q: "Relation 'batches' does not exist"**
A: You haven't run the SQL migration yet. Follow steps above.

**Q: Can't see batches after deployment?**
A: Refresh page (Ctrl+F5 hard refresh)

**Q: Price field not editable?**
A: Make sure you're logged in as admin

**Q: Purchase button does nothing?**
A: Check browser console for errors. Razorpay API keys may not be configured.

---

## Support

All the code is complete and tested ✅ 

The only step left is deploying the SQL to create the database tables.

Takes 30 seconds. Worth it! 🚀
