-- =============================================
-- Migration: Story Mode Notification Tracking
-- =============================================
-- Tracks users interested in Story Mode launch
-- =============================================

-- Create story_mode_notifications table
CREATE TABLE IF NOT EXISTS public.story_mode_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  notified BOOLEAN DEFAULT false,
  interested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one entry per user (prevent duplicates)
  UNIQUE(user_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_story_mode_notifications_user_id ON public.story_mode_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_story_mode_notifications_notified ON public.story_mode_notifications(notified);

-- Enable RLS
ALTER TABLE public.story_mode_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own notification status
CREATE POLICY "Users can view their own notification status"
  ON public.story_mode_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notification request
CREATE POLICY "Users can insert their own notification request"
  ON public.story_mode_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification request
CREATE POLICY "Users can update their own notification request"
  ON public.story_mode_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get count of interested users (for admin)
CREATE OR REPLACE FUNCTION get_story_mode_interest_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.story_mode_notifications);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE public.story_mode_notifications IS 'Users interested in Story Mode launch notifications';
