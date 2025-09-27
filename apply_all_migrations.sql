-- =====================================================
-- COMPREHENSIVE MIGRATION SCRIPT
-- Apply all changes to fix 404 errors and enable real-time chat
-- =====================================================

-- 1. Fix transaction types constraint
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_transaction_type_check
CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'penalty', 'purchase', 'teach'));

-- 2. Create course management tables
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_listing_id UUID NOT NULL REFERENCES public.skill_listings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMPTZ,
  max_points INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_urls TEXT[],
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_listing_id UUID NOT NULL REFERENCES public.skill_listings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_listing_id UUID NOT NULL REFERENCES public.skill_listings(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.course_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create course progress tracking tables
CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_listing_id UUID NOT NULL REFERENCES public.skill_listings(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_assignments INTEGER DEFAULT 0,
  total_assignments INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT now(),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, skill_listing_id)
);

CREATE TABLE IF NOT EXISTS public.course_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_listing_id UUID NOT NULL REFERENCES public.skill_listings(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('enrolled', 'assignment_submitted', 'material_viewed', 'chat_message', 'video_call', 'completed')),
  activity_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS on all tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_activity ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for assignments
DROP POLICY IF EXISTS "Anyone can view assignments for active skill listings" ON public.assignments;
CREATE POLICY "Anyone can view assignments for active skill listings" ON public.assignments 
  FOR SELECT USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE is_active = true
    )
  );

DROP POLICY IF EXISTS "Instructors can manage their assignments" ON public.assignments;
CREATE POLICY "Instructors can manage their assignments" ON public.assignments 
  FOR ALL USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- 6. Create RLS policies for assignment submissions
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.assignment_submissions;
CREATE POLICY "Students can view their own submissions" ON public.assignment_submissions 
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can create submissions" ON public.assignment_submissions;
CREATE POLICY "Students can create submissions" ON public.assignment_submissions 
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update their own submissions before due date" ON public.assignment_submissions;
CREATE POLICY "Students can update their own submissions before due date" ON public.assignment_submissions 
  FOR UPDATE USING (
    student_id = auth.uid() AND 
    assignment_id IN (
      SELECT id FROM public.assignments 
      WHERE due_date IS NULL OR due_date > now()
    )
  );

DROP POLICY IF EXISTS "Instructors can view all submissions for their courses" ON public.assignment_submissions;
CREATE POLICY "Instructors can view all submissions for their courses" ON public.assignment_submissions 
  FOR SELECT USING (
    assignment_id IN (
      SELECT a.id FROM public.assignments a
      JOIN public.skill_listings sl ON a.skill_listing_id = sl.id
      WHERE sl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can grade submissions" ON public.assignment_submissions;
CREATE POLICY "Instructors can grade submissions" ON public.assignment_submissions 
  FOR UPDATE USING (
    assignment_id IN (
      SELECT a.id FROM public.assignments a
      JOIN public.skill_listings sl ON a.skill_listing_id = sl.id
      WHERE sl.user_id = auth.uid()
    )
  );

-- 7. Create RLS policies for course materials
DROP POLICY IF EXISTS "Anyone can view course materials for active skill listings" ON public.course_materials;
CREATE POLICY "Anyone can view course materials for active skill listings" ON public.course_materials 
  FOR SELECT USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE is_active = true
    )
  );

DROP POLICY IF EXISTS "Instructors can manage their course materials" ON public.course_materials;
CREATE POLICY "Instructors can manage their course materials" ON public.course_materials 
  FOR ALL USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- 8. Create RLS policies for chat rooms
DROP POLICY IF EXISTS "Enrolled students can view chat rooms" ON public.course_chat_rooms;
CREATE POLICY "Enrolled students can view chat rooms" ON public.course_chat_rooms 
  FOR SELECT USING (
    skill_listing_id IN (
      SELECT sl.id FROM public.skill_listings sl
      WHERE sl.is_active = true AND (
        sl.user_id = auth.uid() OR -- Instructor
        sl.id IN (
          SELECT skill_listing_id FROM public.transactions 
          WHERE user_id = auth.uid() AND transaction_type = 'purchase'
        ) -- Enrolled student
      )
    )
  );

DROP POLICY IF EXISTS "Instructors can manage chat rooms" ON public.course_chat_rooms;
CREATE POLICY "Instructors can manage chat rooms" ON public.course_chat_rooms 
  FOR ALL USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- 9. Create RLS policies for chat messages
DROP POLICY IF EXISTS "Enrolled users can view messages" ON public.chat_messages;
CREATE POLICY "Enrolled users can view messages" ON public.chat_messages 
  FOR SELECT USING (
    room_id IN (
      SELECT cr.id FROM public.course_chat_rooms cr
      JOIN public.skill_listings sl ON cr.skill_listing_id = sl.id
      WHERE sl.is_active = true AND (
        sl.user_id = auth.uid() OR -- Instructor
        sl.id IN (
          SELECT skill_listing_id FROM public.transactions 
          WHERE user_id = auth.uid() AND transaction_type = 'purchase'
        ) -- Enrolled student
      )
    )
  );

DROP POLICY IF EXISTS "Enrolled users can send messages" ON public.chat_messages;
CREATE POLICY "Enrolled users can send messages" ON public.chat_messages 
  FOR INSERT WITH CHECK (
    room_id IN (
      SELECT cr.id FROM public.course_chat_rooms cr
      JOIN public.skill_listings sl ON cr.skill_listing_id = sl.id
      WHERE sl.is_active = true AND (
        sl.user_id = auth.uid() OR -- Instructor
        sl.id IN (
          SELECT skill_listing_id FROM public.transactions 
          WHERE user_id = auth.uid() AND transaction_type = 'purchase'
        ) -- Enrolled student
      )
    )
  );

-- 10. Create RLS policies for course progress
DROP POLICY IF EXISTS "Users can view their own progress" ON public.course_progress;
CREATE POLICY "Users can view their own progress" ON public.course_progress 
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own progress" ON public.course_progress;
CREATE POLICY "Users can update their own progress" ON public.course_progress 
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view progress for their courses" ON public.course_progress;
CREATE POLICY "Instructors can view progress for their courses" ON public.course_progress 
  FOR SELECT USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- 11. Create RLS policies for course activity
DROP POLICY IF EXISTS "Users can view their own activity" ON public.course_activity;
CREATE POLICY "Users can view their own activity" ON public.course_activity 
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own activity" ON public.course_activity;
CREATE POLICY "Users can insert their own activity" ON public.course_activity 
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can view activity for their courses" ON public.course_activity;
CREATE POLICY "Instructors can view activity for their courses" ON public.course_activity 
  FOR SELECT USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- 12. Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO NOTHING;

-- 13. Create storage policies for course materials
DROP POLICY IF EXISTS "Anyone can view course materials" ON storage.objects;
CREATE POLICY "Anyone can view course materials" ON storage.objects 
FOR SELECT USING (bucket_id = 'course-materials');

DROP POLICY IF EXISTS "Authenticated users can upload course materials" ON storage.objects;
CREATE POLICY "Authenticated users can upload course materials" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'course-materials' AND 
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Instructors can manage their course materials" ON storage.objects;
CREATE POLICY "Instructors can manage their course materials" ON storage.objects 
FOR ALL USING (
  bucket_id = 'course-materials' AND 
  auth.uid() IS NOT NULL AND
  -- Check if user is instructor for this course
  (storage.foldername(name))[2] IN (
    SELECT sl.id::text FROM public.skill_listings sl 
    WHERE sl.user_id = auth.uid()
  )
);

-- 14. Create function to update course progress
CREATE OR REPLACE FUNCTION update_course_progress(
  p_user_id UUID,
  p_skill_listing_id UUID
) RETURNS VOID AS $$
DECLARE
  v_total_assignments INTEGER;
  v_completed_assignments INTEGER;
  v_progress_percentage INTEGER;
BEGIN
  -- Get total assignments for this course
  SELECT COUNT(*) INTO v_total_assignments
  FROM public.assignments
  WHERE skill_listing_id = p_skill_listing_id;

  -- Get completed assignments for this user
  SELECT COUNT(*) INTO v_completed_assignments
  FROM public.assignment_submissions s
  JOIN public.assignments a ON s.assignment_id = a.id
  WHERE s.student_id = p_user_id 
    AND a.skill_listing_id = p_skill_listing_id
    AND s.grade IS NOT NULL;

  -- Calculate progress percentage
  IF v_total_assignments > 0 THEN
    v_progress_percentage := ROUND((v_completed_assignments::FLOAT / v_total_assignments::FLOAT) * 100);
  ELSE
    v_progress_percentage := 0;
  END IF;

  -- Update or insert progress
  INSERT INTO public.course_progress (user_id, skill_listing_id, progress_percentage, completed_assignments, total_assignments, last_activity)
  VALUES (p_user_id, p_skill_listing_id, v_progress_percentage, v_completed_assignments, v_total_assignments, now())
  ON CONFLICT (user_id, skill_listing_id)
  DO UPDATE SET
    progress_percentage = v_progress_percentage,
    completed_assignments = v_completed_assignments,
    total_assignments = v_total_assignments,
    last_activity = now(),
    completed_at = CASE 
      WHEN v_progress_percentage = 100 AND course_progress.completed_at IS NULL THEN now()
      ELSE course_progress.completed_at
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create trigger to update progress when assignment is graded
CREATE OR REPLACE FUNCTION trigger_update_course_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if grade is being set (not NULL)
  IF NEW.grade IS NOT NULL AND (OLD.grade IS NULL OR OLD.grade IS DISTINCT FROM NEW.grade) THEN
    PERFORM update_course_progress(NEW.student_id, (
      SELECT a.skill_listing_id 
      FROM public.assignments a 
      WHERE a.id = NEW.assignment_id
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_progress_on_grading ON public.assignment_submissions;
CREATE TRIGGER update_progress_on_grading
  AFTER UPDATE ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_course_progress();

-- 16. Update the purchase function to initialize course progress
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
    'original_amount', original_amount,
    'final_amount', final_amount,
    'discount_percentage', discount_percentage,
    'discount_amount', original_amount - final_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 17. Create trigger for updated_at on assignments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
CREATE TRIGGER update_assignments_updated_at 
  BEFORE UPDATE ON public.assignments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- All tables, policies, and functions have been created
-- =====================================================
