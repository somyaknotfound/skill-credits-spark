-- Ensure profiles.user_id is unique so it can be referenced by foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_namespace n ON n.oid = c.connamespace
    WHERE  c.conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add FK from skill_listings.user_id to profiles.user_id for PostgREST relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_namespace n ON n.oid = c.connamespace
    WHERE  c.conname = 'skill_listings_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.skill_listings
    ADD CONSTRAINT skill_listings_user_id_profiles_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;


