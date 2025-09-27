-- =====================================================
-- FIX LEADERBOARD RELATIONSHIP ERROR
-- Resolve the "Could not find a relationship between 'transactions' and 'profiles'"
-- =====================================================

-- 1. Ensure instructor_id column exists and has proper foreign key
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS instructor_id UUID;

-- 2. Set up the foreign key relationship properly
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_instructor_id_fkey;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Update existing transactions to have instructor_id
UPDATE public.transactions 
SET instructor_id = (
  SELECT sl.user_id 
  FROM public.skill_listings sl 
  WHERE sl.id = transactions.skill_listing_id
)
WHERE transaction_type = 'purchase' 
  AND instructor_id IS NULL;

-- 4. Create teach transactions for existing purchases if they don't exist
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

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_instructor_teach ON public.transactions(instructor_id, transaction_type, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 6. Update the purchase function to ensure teach transactions are created
CREATE OR REPLACE FUNCTION public.purchase_skill_with_discount(
  p_skill_listing_id uuid,
  p_student_id uuid
) RETURNS json AS $$
DECLARE
  listing_record record;
  student_record record;
  discount_percentage integer;
  original_amount integer;
  final_amount integer;
  transaction_id uuid;
  teach_transaction_id uuid;
BEGIN
  -- Get skill listing and tutor info
  SELECT sl.*, p.credits as tutor_credits, p.username as tutor_name
  INTO listing_record
  FROM skill_listings sl
  JOIN profiles p ON p.user_id = sl.user_id
  WHERE sl.id = p_skill_listing_id AND sl.is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Skill listing not found or inactive');
  END IF;
  
  -- Get student info
  SELECT credits INTO student_record FROM profiles WHERE user_id = p_student_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Student profile not found');
  END IF;
  
  -- Calculate discount
  discount_percentage := public.calculate_credit_discount(
    listing_record.tutor_credits,
    student_record.credits
  );
  
  original_amount := listing_record.credit_price;
  final_amount := ROUND(original_amount * (100 - discount_percentage) / 100.0);
  
  -- Check if student has enough credits
  IF student_record.credits < final_amount THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'required', final_amount,
      'available', student_record.credits
    );
  END IF;
  
  -- Process purchase transaction
  INSERT INTO transactions (
    user_id,
    instructor_id,
    skill_listing_id,
    transaction_type,
    description,
    original_amount,
    amount,
    discount_percentage,
    discount_reason
  ) VALUES (
    p_student_id,
    listing_record.user_id,
    p_skill_listing_id,
    'purchase',
    'Purchased skill: ' || listing_record.title,
    original_amount,
    -final_amount, -- Negative for student
    discount_percentage,
    'Credit similarity discount'
  ) RETURNING id INTO transaction_id;
  
  -- Create teach transaction for instructor
  INSERT INTO transactions (
    user_id,
    instructor_id,
    skill_listing_id,
    transaction_type,
    description,
    amount
  ) VALUES (
    listing_record.user_id,
    listing_record.user_id,
    p_skill_listing_id,
    'teach',
    'Earned from teaching: ' || listing_record.title,
    final_amount -- Positive for instructor
  ) RETURNING id INTO teach_transaction_id;
  
  -- Deduct credits from student
  UPDATE profiles 
  SET credits = credits - final_amount 
  WHERE user_id = p_student_id;
  
  -- Add credits to tutor
  UPDATE profiles 
  SET credits = credits + final_amount,
      total_credits_earned = total_credits_earned + final_amount
  WHERE user_id = listing_record.user_id;
  
  -- Initialize course progress
  INSERT INTO course_progress (
    user_id,
    skill_listing_id,
    progress_percentage,
    completed_assignments,
    total_assignments
  ) VALUES (
    p_student_id,
    p_skill_listing_id,
    0,
    0,
    0
  ) ON CONFLICT (user_id, skill_listing_id) DO NOTHING;
  
  -- Log enrollment activity
  INSERT INTO course_activity (
    user_id,
    skill_listing_id,
    activity_type,
    activity_data
  ) VALUES (
    p_student_id,
    p_skill_listing_id,
    'enrolled',
    json_build_object('course_title', listing_record.title)
  );
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'teach_transaction_id', teach_transaction_id,
    'original_amount', original_amount,
    'final_amount', final_amount,
    'discount_percentage', discount_percentage,
    'discount_amount', original_amount - final_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.purchase_skill_with_discount(uuid, uuid) TO authenticated;

-- =====================================================
-- RELATIONSHIP ERROR FIXED
-- The leaderboard should now work properly
-- =====================================================
