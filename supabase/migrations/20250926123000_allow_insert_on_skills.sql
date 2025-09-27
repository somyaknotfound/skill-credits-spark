-- Allow authenticated users to insert new skills under RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'skills' AND policyname = 'Authenticated users can insert skills'
  ) THEN
    CREATE POLICY "Authenticated users can insert skills"
      ON public.skills
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;


