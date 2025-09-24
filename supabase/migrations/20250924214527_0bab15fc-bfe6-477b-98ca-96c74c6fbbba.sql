-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  credits INTEGER NOT NULL DEFAULT 100,
  level INTEGER NOT NULL DEFAULT 1,
  total_credits_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create skill_listings table (when users offer to teach)
CREATE TABLE public.skill_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  credit_price INTEGER NOT NULL DEFAULT 10,
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create skill_requests table (when users want to learn)
CREATE TABLE public.skill_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  max_credit_price INTEGER,
  status TEXT CHECK (status IN ('open', 'matched', 'completed', 'cancelled')) DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table for credit history
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'penalty')) NOT NULL,
  description TEXT NOT NULL,
  skill_listing_id UUID REFERENCES public.skill_listings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_skills table (skills a user knows)
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_listing_id UUID NOT NULL REFERENCES public.skill_listings(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for skills (public read, admin write)
CREATE POLICY "Skills are viewable by everyone" ON public.skills FOR SELECT USING (true);

-- RLS Policies for skill_listings
CREATE POLICY "Skill listings are viewable by everyone" ON public.skill_listings FOR SELECT USING (true);
CREATE POLICY "Users can manage their own listings" ON public.skill_listings FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for skill_requests  
CREATE POLICY "Skill requests are viewable by everyone" ON public.skill_requests FOR SELECT USING (true);
CREATE POLICY "Users can manage their own requests" ON public.skill_requests FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);

-- RLS Policies for user_skills
CREATE POLICY "User skills are viewable by everyone" ON public.user_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage their own skills" ON public.user_skills FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skill_listings_updated_at BEFORE UPDATE ON public.skill_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skill_requests_updated_at BEFORE UPDATE ON public.skill_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user level based on credits
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level = CASE
    WHEN NEW.total_credits_earned >= 10000 THEN 10
    WHEN NEW.total_credits_earned >= 5000 THEN 9
    WHEN NEW.total_credits_earned >= 2500 THEN 8
    WHEN NEW.total_credits_earned >= 1500 THEN 7
    WHEN NEW.total_credits_earned >= 1000 THEN 6
    WHEN NEW.total_credits_earned >= 500 THEN 5
    WHEN NEW.total_credits_earned >= 250 THEN 4
    WHEN NEW.total_credits_earned >= 100 THEN 3
    WHEN NEW.total_credits_earned >= 50 THEN 2
    ELSE 1
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update level when credits change
CREATE TRIGGER update_profile_level 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW 
  WHEN (OLD.total_credits_earned IS DISTINCT FROM NEW.total_credits_earned)
  EXECUTE FUNCTION update_user_level();

-- Insert some sample skills
INSERT INTO public.skills (name, category, description, difficulty_level) VALUES
('JavaScript Programming', 'Programming', 'Learn modern JavaScript fundamentals and ES6+ features', 'beginner'),
('React Development', 'Programming', 'Build dynamic web applications with React', 'intermediate'),
('UI/UX Design', 'Design', 'Create beautiful and user-friendly interfaces', 'intermediate'),
('Digital Marketing', 'Marketing', 'Master social media and online marketing strategies', 'beginner'),
('Data Analysis', 'Analytics', 'Analyze data using Python and statistical methods', 'advanced'),
('Guitar Playing', 'Music', 'Learn acoustic and electric guitar basics', 'beginner'),
('Photography', 'Creative', 'Master composition, lighting, and photo editing', 'intermediate'),
('Public Speaking', 'Communication', 'Develop confidence and presentation skills', 'beginner');