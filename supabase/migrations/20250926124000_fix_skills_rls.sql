-- Drop existing policy if it exists and create a new one
DROP POLICY IF EXISTS "Authenticated users can insert skills" ON public.skills;

-- Create a simple policy that allows authenticated users to insert
CREATE POLICY "Allow authenticated users to insert skills"
  ON public.skills
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow updates for authenticated users
CREATE POLICY "Allow authenticated users to update skills"
  ON public.skills
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
