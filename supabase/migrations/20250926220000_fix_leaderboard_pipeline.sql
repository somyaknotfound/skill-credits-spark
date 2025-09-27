-- =====================================================
-- FIX LEADERBOARD DATA PIPELINE
-- Debug and fix leaderboard system with proper data flow
-- =====================================================

-- 1. First, let's check and fix the existing schema
-- Ensure we have the right table structure for the current system

-- Create a function to debug leaderboard data
CREATE OR REPLACE FUNCTION debug_leaderboard_data()
RETURNS TABLE (
  table_name TEXT,
  record_count BIGINT,
  sample_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'profiles'::TEXT,
    COUNT(*)::BIGINT,
    jsonb_build_object('sample', jsonb_agg(
      jsonb_build_object(
        'id', id,
        'full_name', full_name,
        'credits_balance', credits_balance
      )
    ) FILTER (WHERE id IS NOT NULL))
  FROM public.profiles
  WHERE id IS NOT NULL
  LIMIT 5;
  
  RETURN QUERY
  SELECT 
    'skill_listings'::TEXT,
    COUNT(*)::BIGINT,
    jsonb_build_object('sample', jsonb_agg(
      jsonb_build_object(
        'id', id,
        'title', title,
        'user_id', user_id,
        'is_active', is_active
      )
    ) FILTER (WHERE id IS NOT NULL))
  FROM public.skill_listings
  WHERE id IS NOT NULL
  LIMIT 5;
  
  RETURN QUERY
  SELECT 
    'transactions'::TEXT,
    COUNT(*)::BIGINT,
    jsonb_build_object('sample', jsonb_agg(
      jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'skill_listing_id', skill_listing_id,
        'transaction_type', transaction_type,
        'amount', amount
      )
    ) FILTER (WHERE id IS NOT NULL))
  FROM public.transactions
  WHERE id IS NOT NULL
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a comprehensive leaderboard function that works with current schema
CREATE OR REPLACE FUNCTION get_leaderboard_data_fixed(
  time_period TEXT DEFAULT 'all_time'
) RETURNS TABLE (
  instructor_id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  level INTEGER,
  total_credits BIGINT,
  skills_taught BIGINT,
  avg_rating NUMERIC,
  rank_position BIGINT,
  is_trending BOOLEAN,
  students_taught BIGINT,
  courses_completed BIGINT
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
  WITH instructor_activities AS (
    -- Get all instructors who have taught skills
    SELECT DISTINCT sl.user_id as instructor_id
    FROM public.skill_listings sl
    WHERE sl.is_active = true
  ),
  instructor_stats AS (
    SELECT 
      ia.instructor_id,
      -- Calculate total credits earned from teaching
      COALESCE(SUM(
        CASE 
          WHEN t.transaction_type = 'teach' THEN ABS(t.amount)
          ELSE 0 
        END
      ), 0) as total_credits,
      -- Count unique skills taught
      COUNT(DISTINCT sl.id) as skills_taught,
      -- Count students taught
      COUNT(DISTINCT t.user_id) as students_taught,
      -- Count course completions (students who completed their courses)
      COUNT(DISTINCT CASE 
        WHEN cp.progress_percent >= 100 THEN cp.student_id 
        ELSE NULL 
      END) as courses_completed
    FROM instructor_activities ia
    LEFT JOIN public.skill_listings sl ON sl.user_id = ia.instructor_id AND sl.is_active = true
    LEFT JOIN public.transactions t ON t.skill_listing_id = sl.id 
      AND t.transaction_type = 'teach'
      AND t.created_at >= start_date
    LEFT JOIN public.course_progress cp ON cp.skill_listing_id = sl.id
    GROUP BY ia.instructor_id
  ),
  instructor_ratings AS (
    SELECT 
      r.reviewed_id as instructor_id,
      AVG(r.rating) as avg_rating
    FROM public.reviews r
    WHERE r.created_at >= start_date
    GROUP BY r.reviewed_id
  ),
  ranked_instructors AS (
    SELECT 
      is.instructor_id,
      p.full_name,
      p.username,
      p.avatar_url,
      p.level,
      is.total_credits,
      is.skills_taught,
      is.students_taught,
      is.courses_completed,
      COALESCE(ir.avg_rating, 4.5) as avg_rating,
      ROW_NUMBER() OVER (ORDER BY is.total_credits DESC) as rank_position,
      -- Check if instructor has recent activity (trending)
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.transactions t2
          JOIN public.skill_listings sl2 ON t2.skill_listing_id = sl2.id
          WHERE sl2.user_id = is.instructor_id
            AND t2.transaction_type = 'teach'
            AND t2.created_at >= (now() - interval '7 days')
        ) THEN true
        ELSE false
      END as is_trending
    FROM instructor_stats is
    JOIN public.profiles p ON p.user_id = is.instructor_id
    LEFT JOIN instructor_ratings ir ON ir.instructor_id = is.instructor_id
    WHERE is.total_credits > 0
  )
  SELECT 
    ri.instructor_id,
    ri.full_name,
    ri.username,
    ri.avatar_url,
    ri.level,
    ri.total_credits,
    ri.skills_taught,
    ri.avg_rating,
    ri.rank_position,
    ri.is_trending,
    ri.students_taught,
    ri.courses_completed
  FROM ranked_instructors ri
  ORDER BY ri.total_credits DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create triggers to refresh materialized views when data changes
CREATE OR REPLACE FUNCTION trigger_refresh_leaderboards()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh all leaderboard materialized views
  REFRESH MATERIALIZED VIEW IF EXISTS public.weekly_leaderboard;
  REFRESH MATERIALIZED VIEW IF EXISTS public.monthly_leaderboard;
  REFRESH MATERIALIZED VIEW IF EXISTS public.all_time_leaderboard;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create triggers for key tables
DROP TRIGGER IF EXISTS refresh_leaderboards_on_transactions ON public.transactions;
CREATE TRIGGER refresh_leaderboards_on_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_leaderboards();

DROP TRIGGER IF EXISTS refresh_leaderboards_on_skill_listings ON public.skill_listings;
CREATE TRIGGER refresh_leaderboards_on_skill_listings
  AFTER INSERT OR UPDATE OR DELETE ON public.skill_listings
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_leaderboards();

DROP TRIGGER IF EXISTS refresh_leaderboards_on_progress ON public.course_progress;
CREATE TRIGGER refresh_leaderboards_on_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.course_progress
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_leaderboards();

-- 5. Create a function to manually refresh leaderboards
CREATE OR REPLACE FUNCTION refresh_all_leaderboards()
RETURNS VOID AS $$
BEGIN
  -- Refresh materialized views if they exist
  BEGIN
    REFRESH MATERIALIZED VIEW public.weekly_leaderboard;
  EXCEPTION WHEN undefined_table THEN
    -- Create if doesn't exist
    CREATE MATERIALIZED VIEW public.weekly_leaderboard AS
    SELECT * FROM get_leaderboard_data_fixed('weekly');
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW public.monthly_leaderboard;
  EXCEPTION WHEN undefined_table THEN
    CREATE MATERIALIZED VIEW public.monthly_leaderboard AS
    SELECT * FROM get_leaderboard_data_fixed('monthly');
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW public.all_time_leaderboard;
  EXCEPTION WHEN undefined_table THEN
    CREATE MATERIALIZED VIEW public.all_time_leaderboard AS
    SELECT * FROM get_leaderboard_data_fixed('all_time');
  END;
  
  -- Log the refresh
  INSERT INTO public.leaderboard_history (
    instructor_id, 
    period_type, 
    rank_position, 
    total_credits, 
    skills_taught, 
    avg_rating
  )
  SELECT 
    instructor_id, 
    'weekly', 
    rank_position, 
    total_credits, 
    skills_taught, 
    avg_rating
  FROM get_leaderboard_data_fixed('weekly')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION debug_leaderboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_data_fixed(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_leaderboards() TO authenticated;

-- 7. Initial refresh
SELECT refresh_all_leaderboards();

-- =====================================================
-- LEADERBOARD PIPELINE FIXED
-- Data should now flow properly from activities to leaderboards
-- =====================================================
