-- Create assignments table
CREATE TABLE public.assignments (
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

-- Create assignment submissions table
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_urls TEXT[], -- Array of file URLs
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grade INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES auth.users(id)
);

-- Create course materials table
CREATE TABLE public.course_materials (
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

-- Create course chat rooms table
CREATE TABLE public.course_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_listing_id UUID NOT NULL REFERENCES public.skill_listings(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.course_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
CREATE POLICY "Anyone can view assignments for active skill listings" ON public.assignments 
  FOR SELECT USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE is_active = true
    )
  );

CREATE POLICY "Instructors can manage their assignments" ON public.assignments 
  FOR ALL USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for assignment submissions
CREATE POLICY "Students can view their own submissions" ON public.assignment_submissions 
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create submissions" ON public.assignment_submissions 
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions before due date" ON public.assignment_submissions 
  FOR UPDATE USING (
    student_id = auth.uid() AND 
    assignment_id IN (
      SELECT id FROM public.assignments 
      WHERE due_date IS NULL OR due_date > now()
    )
  );

CREATE POLICY "Instructors can view all submissions for their courses" ON public.assignment_submissions 
  FOR SELECT USING (
    assignment_id IN (
      SELECT a.id FROM public.assignments a
      JOIN public.skill_listings sl ON a.skill_listing_id = sl.id
      WHERE sl.user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can grade submissions" ON public.assignment_submissions 
  FOR UPDATE USING (
    assignment_id IN (
      SELECT a.id FROM public.assignments a
      JOIN public.skill_listings sl ON a.skill_listing_id = sl.id
      WHERE sl.user_id = auth.uid()
    )
  );

-- RLS Policies for course materials
CREATE POLICY "Anyone can view course materials for active skill listings" ON public.course_materials 
  FOR SELECT USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE is_active = true
    )
  );

CREATE POLICY "Instructors can manage their course materials" ON public.course_materials 
  FOR ALL USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chat rooms
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

CREATE POLICY "Instructors can manage chat rooms" ON public.course_chat_rooms 
  FOR ALL USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chat messages
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

-- Create triggers for updated_at
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
