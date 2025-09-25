-- Add discount fields to transactions table
ALTER TABLE public.transactions 
ADD COLUMN discount_percentage integer DEFAULT 0,
ADD COLUMN original_amount integer,
ADD COLUMN discount_reason text;

-- Update existing transactions to have original_amount same as amount
UPDATE public.transactions 
SET original_amount = amount 
WHERE original_amount IS NULL;

-- Create function to calculate discount based on credit difference
CREATE OR REPLACE FUNCTION public.calculate_credit_discount(
  tutor_credits integer,
  student_credits integer
) RETURNS integer AS $$
DECLARE
  credit_difference integer;
  discount_percentage integer;
BEGIN
  -- Calculate absolute difference in credits
  credit_difference := ABS(tutor_credits - student_credits);
  
  -- Calculate discount percentage based on similarity
  -- The smaller the difference, the higher the discount
  IF credit_difference <= 50 THEN
    discount_percentage := 25; -- 25% discount for very similar credits
  ELSIF credit_difference <= 100 THEN
    discount_percentage := 20; -- 20% discount
  ELSIF credit_difference <= 200 THEN
    discount_percentage := 15; -- 15% discount
  ELSIF credit_difference <= 500 THEN
    discount_percentage := 10; -- 10% discount
  ELSIF credit_difference <= 1000 THEN
    discount_percentage := 5;  -- 5% discount
  ELSE
    discount_percentage := 0;  -- No discount for very different credits
  END IF;
  
  RETURN discount_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to process skill purchase with discount
CREATE OR REPLACE FUNCTION public.purchase_skill_with_discount(
  p_skill_listing_id uuid,
  p_student_id uuid
) RETURNS json AS $$
DECLARE
  listing_record record;
  tutor_record record;
  student_record record;
  discount_percentage integer;
  original_amount integer;
  final_amount integer;
  transaction_id uuid;
  result json;
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
  
  -- Process transaction
  INSERT INTO transactions (
    user_id,
    skill_listing_id,
    transaction_type,
    description,
    original_amount,
    amount,
    discount_percentage,
    discount_reason
  ) VALUES (
    p_student_id,
    p_skill_listing_id,
    'purchase',
    'Purchased skill: ' || listing_record.title,
    original_amount,
    final_amount,
    discount_percentage,
    'Credit similarity discount'
  ) RETURNING id INTO transaction_id;
  
  -- Deduct credits from student
  UPDATE profiles 
  SET credits = credits - final_amount 
  WHERE user_id = p_student_id;
  
  -- Add credits to tutor
  UPDATE profiles 
  SET credits = credits + final_amount,
      total_credits_earned = total_credits_earned + final_amount
  WHERE user_id = listing_record.user_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'original_amount', original_amount,
    'final_amount', final_amount,
    'discount_percentage', discount_percentage,
    'discount_amount', original_amount - final_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;