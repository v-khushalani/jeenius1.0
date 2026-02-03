-- Fix Homi Bhabha subjects: Remove Math, keep only Science
DELETE FROM batch_subjects 
WHERE batch_id = (SELECT id FROM batches WHERE slug = '6th-homi-bhabha')
  AND subject = 'Math';

-- Add subscription_plan column to profiles if not exists for batch purchases
-- (This is separate from is_premium which is for the main JEE/NEET subscription)