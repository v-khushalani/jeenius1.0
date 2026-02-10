-- =============================================
-- GOAL LOCK + FREE/PRO TIER SYSTEM
-- =============================================

-- 1. Add goal lock fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS selected_goal VARCHAR(50),
ADD COLUMN IF NOT EXISTS goal_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS goal_locked_at TIMESTAMP WITH TIME ZONE;

-- Create index for analytics
CREATE INDEX IF NOT EXISTS idx_profiles_goal ON public.profiles(selected_goal);
CREATE INDEX IF NOT EXISTS idx_profiles_goal_locked ON public.profiles(goal_locked);

-- 2. Create goal change audit log
CREATE TABLE IF NOT EXISTS public.goal_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_goal VARCHAR(50),
  new_goal VARCHAR(50),
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(20) CHECK (status IN ('blocked', 'success')),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_goal_audit_user ON public.goal_change_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_audit_time ON public.goal_change_audit(attempted_at DESC);

-- Enable RLS on goal_change_audit
ALTER TABLE public.goal_change_audit ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own goal audit" ON public.goal_change_audit
FOR SELECT USING (auth.uid() = user_id);

-- System inserts via service role only
CREATE POLICY "System can insert goal audit" ON public.goal_change_audit
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all goal audits" ON public.goal_change_audit
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 3. Add tier support to batches
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS free_mode_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pro_mode_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS free_duration_days INT DEFAULT 7,
ADD COLUMN IF NOT EXISTS free_content_limit INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS goal_aligned VARCHAR(50);

-- Update existing batches with goal alignment
UPDATE public.batches SET goal_aligned = 'foundation' WHERE exam_type = 'foundation' OR exam_type LIKE 'Foundation%';
UPDATE public.batches SET goal_aligned = 'jee' WHERE exam_type = 'jee' OR exam_type = 'JEE';
UPDATE public.batches SET goal_aligned = 'neet' WHERE exam_type = 'neet' OR exam_type = 'NEET';
UPDATE public.batches SET goal_aligned = 'cet' WHERE exam_type = 'cet' OR exam_type = 'CET' OR exam_type = 'MHT-CET';
UPDATE public.batches SET goal_aligned = 'scholarship' WHERE exam_type = 'scholarship';
UPDATE public.batches SET goal_aligned = 'olympiad' WHERE exam_type = 'olympiad' OR exam_type = 'homi_bhabha';

-- 4. Create batch access tiers table
CREATE TABLE IF NOT EXISTS public.batch_access_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  tier_name VARCHAR(20) NOT NULL CHECK (tier_name IN ('free', 'pro')),
  description TEXT,
  price_paise INT DEFAULT 0,
  duration_days INT DEFAULT 7,
  content_limit INT, -- NULL = unlimited
  features JSONB DEFAULT '{"videos": true, "pdfs": false, "tests": false, "solutions": false, "liveClasses": false, "doubtSupport": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(batch_id, tier_name)
);

-- Enable RLS on batch_access_tiers
ALTER TABLE public.batch_access_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can read tiers
CREATE POLICY "Tiers are viewable by everyone" ON public.batch_access_tiers
FOR SELECT USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage tiers" ON public.batch_access_tiers
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add tier to user_batch_subscriptions
ALTER TABLE public.user_batch_subscriptions 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS features_unlocked JSONB;

-- 6. Create default tiers for existing batches
INSERT INTO public.batch_access_tiers (batch_id, tier_name, description, price_paise, duration_days, content_limit, features)
SELECT 
  id,
  'free',
  'Try before you buy - limited access',
  0,
  7,
  10,
  '{"videos": true, "pdfs": false, "tests": false, "solutions": false, "liveClasses": false, "doubtSupport": false}'::jsonb
FROM public.batches
ON CONFLICT (batch_id, tier_name) DO NOTHING;

INSERT INTO public.batch_access_tiers (batch_id, tier_name, description, price_paise, duration_days, content_limit, features)
SELECT 
  id,
  'pro',
  'Full access to all content and features',
  price,
  validity_days,
  NULL,
  '{"videos": true, "pdfs": true, "tests": true, "solutions": true, "liveClasses": true, "doubtSupport": true}'::jsonb
FROM public.batches
ON CONFLICT (batch_id, tier_name) DO NOTHING;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_batch_tiers_batch ON public.batch_access_tiers(batch_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON public.user_batch_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_batches_goal ON public.batches(goal_aligned);

-- 8. Function to check if goal can be changed
CREATE OR REPLACE FUNCTION public.can_change_goal(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT COALESCE(
    (SELECT goal_locked FROM profiles WHERE id = p_user_id),
    false
  );
$$;

-- 9. Function to lock goal (one-time operation)
CREATE OR REPLACE FUNCTION public.lock_user_goal(
  p_user_id UUID,
  p_goal VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_already_locked BOOLEAN;
BEGIN
  -- Check if already locked
  SELECT goal_locked INTO v_already_locked
  FROM profiles WHERE id = p_user_id;
  
  IF v_already_locked THEN
    -- Log blocked attempt
    INSERT INTO goal_change_audit (user_id, new_goal, status, reason)
    VALUES (p_user_id, p_goal, 'blocked', 'Goal already locked');
    RETURN FALSE;
  END IF;
  
  -- Lock the goal
  UPDATE profiles SET
    selected_goal = p_goal,
    goal_locked = true,
    goal_locked_at = now(),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Log success
  INSERT INTO goal_change_audit (user_id, new_goal, status, reason)
  VALUES (p_user_id, p_goal, 'success', 'Initial goal selection');
  
  RETURN TRUE;
END;
$$;

-- 10. Function to check content access based on tier
CREATE OR REPLACE FUNCTION public.check_tier_access(
  p_user_id UUID,
  p_batch_id UUID,
  p_feature VARCHAR(50) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subscription RECORD;
  v_result JSONB;
BEGIN
  -- Get user's subscription for this batch
  SELECT 
    ubs.tier,
    ubs.expires_at,
    ubs.features_unlocked,
    bat.features as tier_features,
    bat.content_limit
  INTO v_subscription
  FROM user_batch_subscriptions ubs
  JOIN batch_access_tiers bat ON bat.batch_id = ubs.batch_id AND bat.tier_name = ubs.tier
  WHERE ubs.user_id = p_user_id 
    AND ubs.batch_id = p_batch_id
    AND ubs.status = 'active'
    AND ubs.expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'hasAccess', false,
      'tier', 'none',
      'reason', 'No active subscription'
    );
  END IF;
  
  -- Check specific feature if requested
  IF p_feature IS NOT NULL THEN
    IF NOT (COALESCE(v_subscription.features_unlocked, v_subscription.tier_features) ->> p_feature)::boolean THEN
      RETURN jsonb_build_object(
        'hasAccess', false,
        'tier', v_subscription.tier,
        'reason', 'Feature not available in current tier',
        'feature', p_feature
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'hasAccess', true,
    'tier', v_subscription.tier,
    'expiresAt', v_subscription.expires_at,
    'features', COALESCE(v_subscription.features_unlocked, v_subscription.tier_features),
    'contentLimit', v_subscription.content_limit
  );
END;
$$;

-- 11. Trigger to prevent goal changes after lock
CREATE OR REPLACE FUNCTION public.prevent_goal_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If goal was locked and trying to change it
  IF OLD.goal_locked = true AND (
    NEW.selected_goal IS DISTINCT FROM OLD.selected_goal OR
    NEW.goal_locked = false
  ) THEN
    -- Log the blocked attempt
    INSERT INTO goal_change_audit (user_id, old_goal, new_goal, status, reason)
    VALUES (OLD.id, OLD.selected_goal, NEW.selected_goal, 'blocked', 'Attempted to change locked goal');
    
    -- Keep old values
    NEW.selected_goal := OLD.selected_goal;
    NEW.goal_locked := OLD.goal_locked;
    NEW.goal_locked_at := OLD.goal_locked_at;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_prevent_goal_change ON public.profiles;
CREATE TRIGGER trigger_prevent_goal_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_goal_change();
