-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-materials', 'course-materials', true);

-- Create storage policies for course materials
CREATE POLICY "Anyone can view course materials" ON storage.objects 
FOR SELECT USING (bucket_id = 'course-materials');

CREATE POLICY "Authenticated users can upload course materials" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'course-materials' AND 
  auth.uid() IS NOT NULL
);

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
