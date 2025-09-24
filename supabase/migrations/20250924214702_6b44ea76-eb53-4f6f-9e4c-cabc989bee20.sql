-- Fix security issues by updating functions with proper search_path

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the handle_new_user function (already has security definer, just add search_path)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the update_user_level function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;