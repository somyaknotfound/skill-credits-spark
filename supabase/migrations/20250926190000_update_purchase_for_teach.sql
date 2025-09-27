-- Update the purchase function to also create teach transactions
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
  teach_transaction_id uuid;
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
