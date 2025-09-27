-- =====================================================
-- FIX LEADERBOARD RELATIONSHIPS
-- Resolve the relationship issue between transactions and profiles
-- =====================================================

-- 1. Ensure the instructor_id foreign key is properly set up
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_instructor_id_fkey;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create a simpler leaderboard query that doesn't rely on complex joins
CREATE OR REPLACE FUNCTION get_simple_leaderboard_data(
  time_period TEXT DEFAULT 'all_time'
) RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  level INTEGER,
  total_credits BIGINT,
  skills_taught BIGINT,
  avg_rating NUMERIC,
  rank_position BIGINT,
  is_trending BOOLEAN
) AS $$
DECLARE
  start_date TIMESTAMPTZ;
BEGIN
  -- Determine start date based on time period
  CASE time_period
    WHEN 'weekly' THEN start_date := now() - interval '7 days';
    WHEN 'monthly' THEN start_date := now() - interval '30 days';
    ELSE start_date := '1970-01-01'::timestamptz; -- All time
  END CASE;

  RETURN QUERY
  WITH instructor_stats AS (
    SELECT 
      t.instructor_id,
      SUM(t.amount) as total_credits,
      COUNT(DISTINCT t.skill_listing_id) as skills_taught
    FROM public.transactions t
    WHERE t.transaction_type = 'teach'
      AND t.created_at >= start_date
      AND t.instructor_id IS NOT NULL
    GROUP BY t.instructor_id
  ),
  instructor_profiles AS (
    SELECT 
      p.user_id,
      p.full_name,
      p.username,
      p.avatar_url,
      p.level
    FROM public.profiles p
    WHERE p.user_id IN (SELECT instructor_id FROM instructor_stats)
  ),
  combined_data AS (
    SELECT 
      is.instructor_id,
      ip.full_name,
      ip.username,
      ip.avatar_url,
      ip.level,
      is.total_credits,
      is.skills_taught,
      4.5 as avg_rating, -- Default rating for now
      ROW_NUMBER() OVER (ORDER BY is.total_credits DESC) as rank_position,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.transactions t2
          WHERE t2.instructor_id = is.instructor_id
            AND t2.transaction_type = 'teach'
            AND t2.created_at >= (now() - interval '7 days')
        ) THEN true
        ELSE false
      END as is_trending
    FROM instructor_stats is
    JOIN instructor_profiles ip ON ip.user_id = is.instructor_id
  )
  SELECT 
    cd.instructor_id as user_id,
    cd.full_name,
    cd.username,
    cd.avatar_url,
    cd.level,
    cd.total_credits,
    cd.skills_taught,
    cd.avg_rating,
    cd.rank_position,
    cd.is_trending
  FROM combined_data cd
  ORDER BY cd.total_credits DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_simple_leaderboard_data(TEXT) TO authenticated;

-- 4. Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_transactions_instructor_teach ON public.transactions(instructor_id, transaction_type, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
