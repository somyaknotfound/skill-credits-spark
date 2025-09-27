-- Create course progress tracking table
CREATE TABLE public.course_progress (
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

-- Create course activity log table
CREATE TABLE public.course_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_listing_id UUID NOT NULL REFERENCES public.skill_listings(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('enrolled', 'assignment_submitted', 'material_viewed', 'chat_message', 'video_call', 'completed')),
  activity_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_progress
CREATE POLICY "Users can view their own progress" ON public.course_progress 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON public.course_progress 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Instructors can view progress for their courses" ON public.course_progress 
  FOR SELECT USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for course_activity
CREATE POLICY "Users can view their own activity" ON public.course_activity 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own activity" ON public.course_activity 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can view activity for their courses" ON public.course_activity 
  FOR SELECT USING (
    skill_listing_id IN (
      SELECT id FROM public.skill_listings WHERE user_id = auth.uid()
    )
  );

-- Function to update course progress
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

-- Trigger to update progress when assignment is graded
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

CREATE TRIGGER update_progress_on_grading
  AFTER UPDATE ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_course_progress();
