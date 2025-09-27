-- =====================================================
-- COMPREHENSIVE DATABASE SCHEMA OPTIMIZATION
-- Scalable P2P learning platform with efficient leaderboards
-- =====================================================

-- 1. Clean up and optimize profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  credits_balance INTEGER DEFAULT 0 CHECK (credits_balance >= 0),
  total_credits_earned INTEGER DEFAULT 0,
  total_credits_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Optimized skills table
DROP TABLE IF EXISTS public.skills CASCADE;
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  price INTEGER NOT NULL CHECK (price > 0),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Optimized transactions table
DROP TABLE IF EXISTS public.transactions CASCADE;
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('teach', 'learn')),
  credits INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Ratings table
DROP TABLE IF EXISTS public.ratings CASCADE;
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, skill_id) -- One rating per student per skill
);

-- 5. Progress tracking table
DROP TABLE IF EXISTS public.progress CASCADE;
CREATE TABLE public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_activity TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, skill_id)
);

-- 6. Leaderboard history for trending detection
CREATE TABLE public.leaderboard_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
  rank_position INTEGER NOT NULL,
  total_credits BIGINT NOT NULL,
  skills_taught INTEGER NOT NULL,
  avg_rating NUMERIC(3,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Performance indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_credits ON public.profiles(credits_balance DESC);
CREATE INDEX idx_skills_instructor ON public.skills(instructor_id, created_at DESC);
CREATE INDEX idx_skills_category ON public.skills(category, is_active);
CREATE INDEX idx_skills_active ON public.skills(is_active, created_at DESC);
CREATE INDEX idx_transactions_student ON public.transactions(student_id, created_at DESC);
CREATE INDEX idx_transactions_instructor ON public.transactions(instructor_id, created_at DESC);
CREATE INDEX idx_transactions_skill ON public.transactions(skill_id, created_at DESC);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type, created_at DESC);
CREATE INDEX idx_ratings_instructor ON public.ratings(instructor_id, rating DESC);
CREATE INDEX idx_ratings_skill ON public.ratings(skill_id, rating DESC);
CREATE INDEX idx_progress_student ON public.progress(student_id, updated_at DESC);
CREATE INDEX idx_progress_skill ON public.progress(skill_id, progress_percent DESC);

-- 8. Materialized views for leaderboards
CREATE MATERIALIZED VIEW public.weekly_leaderboard AS
SELECT 
  p.id as instructor_id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.level,
  COALESCE(SUM(t.credits), 0) as total_credits,
  COUNT(DISTINCT t.skill_id) as skills_taught,
  COALESCE(AVG(r.rating), 0) as avg_rating,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.credits), 0) DESC) as rank_position
FROM public.profiles p
LEFT JOIN public.transactions t ON p.id = t.instructor_id 
  AND t.transaction_type = 'teach' 
  AND t.created_at >= (now() - interval '7 days')
LEFT JOIN public.ratings r ON p.id = r.instructor_id
WHERE p.id IN (SELECT DISTINCT instructor_id FROM public.skills)
GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.level
HAVING COALESCE(SUM(t.credits), 0) > 0
ORDER BY total_credits DESC;

CREATE MATERIALIZED VIEW public.monthly_leaderboard AS
SELECT 
  p.id as instructor_id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.level,
  COALESCE(SUM(t.credits), 0) as total_credits,
  COUNT(DISTINCT t.skill_id) as skills_taught,
  COALESCE(AVG(r.rating), 0) as avg_rating,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.credits), 0) DESC) as rank_position
FROM public.profiles p
LEFT JOIN public.transactions t ON p.id = t.instructor_id 
  AND t.transaction_type = 'teach' 
  AND t.created_at >= (now() - interval '30 days')
LEFT JOIN public.ratings r ON p.id = r.instructor_id
WHERE p.id IN (SELECT DISTINCT instructor_id FROM public.skills)
GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.level
HAVING COALESCE(SUM(t.credits), 0) > 0
ORDER BY total_credits DESC;

CREATE MATERIALIZED VIEW public.all_time_leaderboard AS
SELECT 
  p.id as instructor_id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.level,
  COALESCE(SUM(t.credits), 0) as total_credits,
  COUNT(DISTINCT t.skill_id) as skills_taught,
  COALESCE(AVG(r.rating), 0) as avg_rating,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.credits), 0) DESC) as rank_position
FROM public.profiles p
LEFT JOIN public.transactions t ON p.id = t.instructor_id 
  AND t.transaction_type = 'teach'
LEFT JOIN public.ratings r ON p.id = r.instructor_id
WHERE p.id IN (SELECT DISTINCT instructor_id FROM public.skills)
GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.level
HAVING COALESCE(SUM(t.credits), 0) > 0
ORDER BY total_credits DESC;

-- 9. Credit balance trigger function
CREATE OR REPLACE FUNCTION update_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'learn' THEN
    -- Deduct credits from student
    UPDATE public.profiles 
    SET 
      credits_balance = credits_balance - NEW.credits,
      total_credits_spent = total_credits_spent + NEW.credits,
      updated_at = now()
    WHERE id = NEW.student_id;
    
    -- Add credits to instructor
    UPDATE public.profiles 
    SET 
      credits_balance = credits_balance + NEW.credits,
      total_credits_earned = total_credits_earned + NEW.credits,
      updated_at = now()
    WHERE id = NEW.instructor_id;
    
  ELSIF NEW.transaction_type = 'teach' THEN
    -- This is handled by the 'learn' transaction above
    -- This trigger ensures consistency
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for credit balance updates
DROP TRIGGER IF EXISTS trigger_update_credit_balance ON public.transactions;
CREATE TRIGGER trigger_update_credit_balance
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_balance();

-- 11. P2P course purchase function
CREATE OR REPLACE FUNCTION purchase_skill_p2p(
  p_skill_id UUID,
  p_student_id UUID
) RETURNS JSON AS $$
DECLARE
  skill_record RECORD;
  student_record RECORD;
  learn_transaction_id UUID;
  teach_transaction_id UUID;
  result JSON;
BEGIN
  -- Get skill details
  SELECT s.*, p.credits_balance as instructor_credits
  INTO skill_record
  FROM public.skills s
  JOIN public.profiles p ON p.id = s.instructor_id
  WHERE s.id = p_skill_id AND s.is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Skill not found or inactive');
  END IF;
  
  -- Get student details
  SELECT credits_balance INTO student_record 
  FROM public.profiles 
  WHERE id = p_student_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Student profile not found');
  END IF;
  
  -- Check if student has enough credits
  IF student_record.credits_balance < skill_record.price THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'required', skill_record.price,
      'available', student_record.credits_balance
    );
  END IF;
  
  -- Check if student already purchased this skill
  IF EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE student_id = p_student_id 
      AND skill_id = p_skill_id 
      AND transaction_type = 'learn'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already purchased this skill');
  END IF;
  
  -- Create learn transaction (this will trigger credit balance updates)
  INSERT INTO public.transactions (
    student_id,
    instructor_id,
    skill_id,
    transaction_type,
    credits,
    description
  ) VALUES (
    p_student_id,
    skill_record.instructor_id,
    p_skill_id,
    'learn',
    skill_record.price,
    'Purchased skill: ' || skill_record.title
  ) RETURNING id INTO learn_transaction_id;
  
  -- Create teach transaction
  INSERT INTO public.transactions (
    student_id,
    instructor_id,
    skill_id,
    transaction_type,
    credits,
    description
  ) VALUES (
    p_student_id,
    skill_record.instructor_id,
    p_skill_id,
    'teach',
    skill_record.price,
    'Earned from teaching: ' || skill_record.title
  ) RETURNING id INTO teach_transaction_id;
  
  -- Initialize progress tracking
  INSERT INTO public.progress (
    student_id,
    skill_id,
    progress_percent,
    last_activity
  ) VALUES (
    p_student_id,
    p_skill_id,
    0,
    now()
  ) ON CONFLICT (student_id, skill_id) DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'learn_transaction_id', learn_transaction_id,
    'teach_transaction_id', teach_transaction_id,
    'skill_title', skill_record.title,
    'credits_paid', skill_record.price
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_leaderboards()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.weekly_leaderboard;
  REFRESH MATERIALIZED VIEW public.monthly_leaderboard;
  REFRESH MATERIALIZED VIEW public.all_time_leaderboard;
  
  -- Record leaderboard history for trending detection
  INSERT INTO public.leaderboard_history (instructor_id, period_type, rank_position, total_credits, skills_taught, avg_rating)
  SELECT instructor_id, 'weekly', rank_position, total_credits, skills_taught, avg_rating
  FROM public.weekly_leaderboard;
  
  INSERT INTO public.leaderboard_history (instructor_id, period_type, rank_position, total_credits, skills_taught, avg_rating)
  SELECT instructor_id, 'monthly', rank_position, total_credits, skills_taught, avg_rating
  FROM public.monthly_leaderboard;
  
  INSERT INTO public.leaderboard_history (instructor_id, period_type, rank_position, total_credits, skills_taught, avg_rating)
  SELECT instructor_id, 'all_time', rank_position, total_credits, skills_taught, avg_rating
  FROM public.all_time_leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_history ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 15. RLS Policies for skills
CREATE POLICY "Anyone can view active skills" ON public.skills 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Instructors can manage their skills" ON public.skills 
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = instructor_id));

-- 16. RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE id IN (student_id, instructor_id)
    )
  );
CREATE POLICY "System can insert transactions" ON public.transactions 
  FOR INSERT WITH CHECK (true);

-- 17. RLS Policies for ratings
CREATE POLICY "Users can view ratings for skills they purchased" ON public.ratings 
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE id = student_id
    ) OR
    skill_id IN (
      SELECT skill_id FROM public.transactions 
      WHERE student_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      ) AND transaction_type = 'learn'
    )
  );
CREATE POLICY "Students can rate skills they purchased" ON public.ratings 
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ) AND
    skill_id IN (
      SELECT skill_id FROM public.transactions 
      WHERE student_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      ) AND transaction_type = 'learn'
    )
  );

-- 18. RLS Policies for progress
CREATE POLICY "Students can view their own progress" ON public.progress 
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Students can update their own progress" ON public.progress 
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "System can insert progress" ON public.progress 
  FOR INSERT WITH CHECK (true);

-- 19. RLS Policies for leaderboard history
CREATE POLICY "Anyone can view leaderboard history" ON public.leaderboard_history 
  FOR SELECT USING (true);

-- 20. Grant permissions
GRANT EXECUTE ON FUNCTION purchase_skill_p2p(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_leaderboards() TO authenticated;
GRANT SELECT ON public.weekly_leaderboard TO authenticated;
GRANT SELECT ON public.monthly_leaderboard TO authenticated;
GRANT SELECT ON public.all_time_leaderboard TO authenticated;

-- 21. Create indexes on materialized views
CREATE INDEX idx_weekly_leaderboard_rank ON public.weekly_leaderboard(rank_position);
CREATE INDEX idx_monthly_leaderboard_rank ON public.monthly_leaderboard(rank_position);
CREATE INDEX idx_all_time_leaderboard_rank ON public.all_time_leaderboard(rank_position);

-- 22. Initial refresh of materialized views
SELECT refresh_leaderboards();

-- =====================================================
-- SCHEMA OPTIMIZATION COMPLETE
-- All tables, triggers, views, and policies are ready
-- =====================================================
