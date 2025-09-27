-- =====================================================
-- FIX CHAT SYSTEM - SUPABASE API KEY ERROR
-- This migration fixes the chat system and ensures proper RLS policies
-- =====================================================

-- 1. Ensure chat tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.course_chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_listing_id UUID NOT NULL REFERENCES public.skill_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.course_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_chat_rooms_skill_listing_id ON public.course_chat_rooms(skill_listing_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- 3. Enable RLS
ALTER TABLE public.course_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for course_chat_rooms
DROP POLICY IF EXISTS "Users can view chat rooms for enrolled courses" ON public.course_chat_rooms;
CREATE POLICY "Users can view chat rooms for enrolled courses" ON public.course_chat_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.skill_listing_id = course_chat_rooms.skill_listing_id
      AND t.user_id = auth.uid()
      AND t.transaction_type = 'learn'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.skill_listings sl
      WHERE sl.id = course_chat_rooms.skill_listing_id
      AND sl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can create chat rooms" ON public.course_chat_rooms;
CREATE POLICY "Instructors can create chat rooms" ON public.course_chat_rooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.skill_listings sl
      WHERE sl.id = course_chat_rooms.skill_listing_id
      AND sl.user_id = auth.uid()
    )
  );

-- 5. Create RLS policies for chat_messages
DROP POLICY IF EXISTS "Users can view messages in enrolled courses" ON public.chat_messages;
CREATE POLICY "Users can view messages in enrolled courses" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_chat_rooms ccr
      JOIN public.transactions t ON t.skill_listing_id = ccr.skill_listing_id
      WHERE ccr.id = chat_messages.room_id
      AND t.user_id = auth.uid()
      AND t.transaction_type = 'learn'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.course_chat_rooms ccr
      JOIN public.skill_listings sl ON sl.id = ccr.skill_listing_id
      WHERE ccr.id = chat_messages.room_id
      AND sl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages in enrolled courses" ON public.chat_messages;
CREATE POLICY "Users can send messages in enrolled courses" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.course_chat_rooms ccr
        JOIN public.transactions t ON t.skill_listing_id = ccr.skill_listing_id
        WHERE ccr.id = chat_messages.room_id
        AND t.user_id = auth.uid()
        AND t.transaction_type = 'learn'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.course_chat_rooms ccr
        JOIN public.skill_listings sl ON sl.id = ccr.skill_listing_id
        WHERE ccr.id = chat_messages.room_id
        AND sl.user_id = auth.uid()
      )
    )
  );

-- 6. Create function to ensure chat room exists
CREATE OR REPLACE FUNCTION ensure_chat_room_exists(skill_listing_id_param UUID)
RETURNS UUID AS $$
DECLARE
  room_id UUID;
BEGIN
  -- Check if room already exists
  SELECT id INTO room_id
  FROM public.course_chat_rooms
  WHERE skill_listing_id = skill_listing_id_param;
  
  -- If room doesn't exist, create it
  IF room_id IS NULL THEN
    INSERT INTO public.course_chat_rooms (skill_listing_id)
    VALUES (skill_listing_id_param)
    RETURNING id INTO room_id;
  END IF;
  
  RETURN room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION ensure_chat_room_exists(UUID) TO authenticated;

-- 8. Create trigger to auto-create chat rooms when skill listings are created
CREATE OR REPLACE FUNCTION create_chat_room_for_skill_listing()
RETURNS TRIGGER AS $$
BEGIN
  -- Create chat room for new skill listing
  INSERT INTO public.course_chat_rooms (skill_listing_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_create_chat_room ON public.skill_listings;
CREATE TRIGGER trigger_create_chat_room
  AFTER INSERT ON public.skill_listings
  FOR EACH ROW
  EXECUTE FUNCTION create_chat_room_for_skill_listing();

-- 9. Create chat rooms for existing skill listings
INSERT INTO public.course_chat_rooms (skill_listing_id)
SELECT id FROM public.skill_listings
WHERE id NOT IN (SELECT skill_listing_id FROM public.course_chat_rooms)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CHAT SYSTEM FIXED
-- API key errors should now be resolved with proper RLS policies
-- =====================================================
