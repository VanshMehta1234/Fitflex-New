-- Ensure profiles table has xp_points and level columns
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Ensure required indexes exist
CREATE INDEX IF NOT EXISTS idx_profiles_xp_points ON public.profiles(xp_points);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level);

-- Create or update RLS policies
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for profiles: users can view any profile, but only update their own
CREATE POLICY IF NOT EXISTS "Users can view any profile"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create or update trigger function to maintain synchronized levels
-- This ensures that when XP is updated, the level is automatically adjusted
CREATE OR REPLACE FUNCTION public.sync_profile_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if xp_points has changed
  IF NEW.xp_points IS DISTINCT FROM OLD.xp_points THEN
    -- Update level based on XP thresholds
    NEW.level := 
      CASE
        WHEN NEW.xp_points >= 10750 THEN 20
        WHEN NEW.xp_points >= 9700 THEN 19
        WHEN NEW.xp_points >= 8700 THEN 18
        WHEN NEW.xp_points >= 7750 THEN 17
        WHEN NEW.xp_points >= 6850 THEN 16
        WHEN NEW.xp_points >= 6000 THEN 15
        WHEN NEW.xp_points >= 5200 THEN 14
        WHEN NEW.xp_points >= 4500 THEN 13
        WHEN NEW.xp_points >= 3850 THEN 12
        WHEN NEW.xp_points >= 3250 THEN 11
        WHEN NEW.xp_points >= 2700 THEN 10
        WHEN NEW.xp_points >= 2200 THEN 9
        WHEN NEW.xp_points >= 1750 THEN 8
        WHEN NEW.xp_points >= 1350 THEN 7
        WHEN NEW.xp_points >= 1000 THEN 6
        WHEN NEW.xp_points >= 700 THEN 5
        WHEN NEW.xp_points >= 450 THEN 4
        WHEN NEW.xp_points >= 250 THEN 3
        WHEN NEW.xp_points >= 100 THEN 2
        ELSE 1
      END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sync_profile_level_trigger'
  ) THEN
    CREATE TRIGGER sync_profile_level_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_level();
  END IF;
END
$$; 