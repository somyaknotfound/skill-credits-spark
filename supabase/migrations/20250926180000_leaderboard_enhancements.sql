-- =====================================================
-- LEADERBOARD ENHANCEMENTS
-- Support for time-based leaderboards and teach transactions
-- =====================================================

-- 1. Add instructor_id to transactions table for better tracking
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES auth.users(id);

-- 2. Create index for better performance on leaderboard queries
CREATE INDEX IF NOT EXISTS idx_transactions_teach_type ON public.transactions(transaction_type, created_at) 
WHERE transaction_type = 'teach';

CREATE INDEX IF NOT EXISTS idx_transactions_instructor ON public.transactions(instructor_id, created_at);

-- 3. Create function to get leaderboard data with time filtering
CREATE OR REPLACE FUNCTION get_leaderboard_data(
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
      COUNT(DISTINCT t.skill_listing_id) as skills_taught,
      AVG(r.rating) as avg_rating
    FROM public.transactions t
    LEFT JOIN public.skill_listings sl ON t.skill_listing_id = sl.id
    LEFT JOIN public.reviews r ON r.reviewed_id = t.instructor_id
    WHERE t.transaction_type = 'teach'
      AND t.created_at >= start_date
      AND t.instructor_id IS NOT NULL
    GROUP BY t.instructor_id
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
      COALESCE(is.avg_rating, 0) as avg_rating,
      ROW_NUMBER() OVER (ORDER BY is.total_credits DESC) as rank_position
    FROM instructor_stats is
    JOIN public.profiles p ON p.user_id = is.instructor_id
  ),
  trending_check AS (
    SELECT 
      ri.*,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.transactions t2
          WHERE t2.instructor_id = ri.instructor_id
            AND t2.transaction_type = 'teach'
            AND t2.created_at >= (now() - interval '7 days')
            AND t2.created_at < (now() - interval '1 day')
        ) THEN true
        ELSE false
      END as is_trending
    FROM ranked_instructors ri
  )
  SELECT 
    tc.user_id,
    tc.full_name,
    tc.username,
    tc.avatar_url,
    tc.level,
    tc.total_credits,
    tc.skills_taught,
    tc.avg_rating,
    tc.rank_position,
    tc.is_trending
  FROM trending_check tc
  ORDER BY tc.total_credits DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to update instructor_id when purchase happens
CREATE OR REPLACE FUNCTION update_instructor_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Set instructor_id to the skill listing owner
  NEW.instructor_id := (
    SELECT user_id 
    FROM public.skill_listings 
    WHERE id = NEW.skill_listing_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to automatically set instructor_id
DROP TRIGGER IF EXISTS set_instructor_on_purchase ON public.transactions;
CREATE TRIGGER set_instructor_on_purchase
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.transaction_type = 'purchase')
  EXECUTE FUNCTION update_instructor_on_purchase();

-- 6. Create function to insert teach transaction when purchase happens
CREATE OR REPLACE FUNCTION create_teach_transaction()
RETURNS TRIGGER AS $$
DECLARE
  instructor_user_id UUID;
  skill_title TEXT;
BEGIN
  -- Get instructor user_id and skill title
  SELECT sl.user_id, sl.title
  INTO instructor_user_id, skill_title
  FROM public.skill_listings sl
  WHERE sl.id = NEW.skill_listing_id;

  -- Insert teach transaction for instructor
  INSERT INTO public.transactions (
    user_id,
    instructor_id,
    skill_listing_id,
    transaction_type,
    amount,
    description,
    created_at
  ) VALUES (
    instructor_user_id,
    instructor_user_id,
    NEW.skill_listing_id,
    'teach',
    ABS(NEW.amount), -- Positive amount for instructor
    'Earned from teaching: ' || skill_title,
    NEW.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to create teach transaction when purchase happens
DROP TRIGGER IF EXISTS create_teach_on_purchase ON public.transactions;
CREATE TRIGGER create_teach_on_purchase
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.transaction_type = 'purchase')
  EXECUTE FUNCTION create_teach_transaction();

-- 8. Update existing transactions to have instructor_id (backfill)
UPDATE public.transactions 
SET instructor_id = (
  SELECT sl.user_id 
  FROM public.skill_listings sl 
  WHERE sl.id = transactions.skill_listing_id
)
WHERE transaction_type = 'purchase' 
  AND instructor_id IS NULL;

-- 9. Create teach transactions for existing purchases
INSERT INTO public.transactions (
  user_id,
  instructor_id,
  skill_listing_id,
  transaction_type,
  amount,
  description,
  created_at
)
SELECT 
  sl.user_id as user_id,
  sl.user_id as instructor_id,
  t.skill_listing_id,
  'teach',
  ABS(t.amount) as amount,
  'Earned from teaching: ' || sl.title as description,
  t.created_at
FROM public.transactions t
JOIN public.skill_listings sl ON sl.id = t.skill_listing_id
WHERE t.transaction_type = 'purchase'
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t2
    WHERE t2.skill_listing_id = t.skill_listing_id
      AND t2.transaction_type = 'teach'
      AND t2.instructor_id = sl.user_id
  );

-- 10. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_leaderboard_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_instructor_on_purchase() TO authenticated;
GRANT EXECUTE ON FUNCTION create_teach_transaction() TO authenticated;
