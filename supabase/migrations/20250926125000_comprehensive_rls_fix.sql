-- Comprehensive RLS fix for skills and profiles

-- First, ensure we have a proper policy for skills
DROP POLICY IF EXISTS "Authenticated users can insert skills" ON public.skills;
DROP POLICY IF EXISTS "Allow authenticated users to insert skills" ON public.skills;

-- Create policies for skills
CREATE POLICY "Anyone can read skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert skills" ON public.skills FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update skills" ON public.skills FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Ensure profiles table has proper policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a function to ensure user has a profile
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.user_id,
    COALESCE(NEW.user_id::text, 'user_' || substr(NEW.user_id::text, 1, 8)),
    COALESCE(NEW.user_id::text, 'User')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create profile when skill_listing is created
DROP TRIGGER IF EXISTS ensure_profile_on_skill_listing ON public.skill_listings;
CREATE TRIGGER ensure_profile_on_skill_listing
  BEFORE INSERT ON public.skill_listings
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_profile();
