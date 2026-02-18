-- ==============================================
-- Add automatic user_role creation on profile creation
-- And clean up unused goal_change_audit table
-- ==============================================

-- Step 1: Create trigger to automatically create user_role entry when profile is created
CREATE OR REPLACE FUNCTION public.create_user_role_on_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert a new row in user_roles table with 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_user_role_on_profile_creation ON public.profiles;

-- Create the trigger
CREATE TRIGGER trigger_create_user_role_on_profile_creation
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_user_role_on_profile_creation();

-- Step 2: Create any missing user_role entries for existing profiles (backward compatibility)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Drop the goal_change_audit table (no longer needed)
DROP TABLE IF EXISTS public.goal_change_audit CASCADE;

-- Step 4: Mark migration as complete
SELECT 'Migration complete! User roles will now be created automatically, and goal_change_audit has been removed.' as status;
