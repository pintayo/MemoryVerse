-- Create daily_activities table to track all types of daily spiritual activities
-- This will be used for streak calculation instead of just practice_sessions

CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'verse', 'practice', 'understand', 'chapter', 'review'
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one activity type per user per day (can have multiple types same day)
  UNIQUE(user_id, activity_type, activity_date)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date ON public.daily_activities(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_type ON public.daily_activities(user_id, activity_type);

-- Enable RLS
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own activities"
  ON public.daily_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.daily_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.daily_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to record daily activity (upsert)
CREATE OR REPLACE FUNCTION record_daily_activity(
  p_user_id UUID,
  p_activity_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.daily_activities (user_id, activity_type, activity_date)
  VALUES (p_user_id, p_activity_type, CURRENT_DATE)
  ON CONFLICT (user_id, activity_type, activity_date)
  DO NOTHING; -- Already recorded today
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate current streak based on daily_activities
CREATE OR REPLACE FUNCTION calculate_current_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_had_activity BOOLEAN;
BEGIN
  -- Loop backwards from today
  LOOP
    -- Check if user had ANY activity on this date
    SELECT EXISTS (
      SELECT 1 FROM public.daily_activities
      WHERE user_id = p_user_id
      AND activity_date = v_current_date
    ) INTO v_had_activity;

    IF v_had_activity THEN
      v_streak := v_streak + 1;
      v_current_date := v_current_date - 1; -- Go to previous day
    ELSE
      -- If it's today or yesterday, allow grace period
      IF v_current_date >= CURRENT_DATE - 1 THEN
        v_current_date := v_current_date - 1;
        CONTINUE;
      END IF;
      -- Streak is broken
      EXIT;
    END IF;

    -- Safety limit to prevent infinite loop
    IF v_streak > 10000 THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update profile streak (call after recording activity)
CREATE OR REPLACE FUNCTION update_profile_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Calculate current streak
  v_current_streak := calculate_current_streak(p_user_id);

  -- Get current longest streak
  SELECT longest_streak INTO v_longest_streak
  FROM public.profiles
  WHERE id = p_user_id;

  -- Update profile
  UPDATE public.profiles
  SET
    current_streak = v_current_streak,
    longest_streak = GREATEST(COALESCE(v_longest_streak, 0), v_current_streak),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_daily_activity(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_current_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_streak(UUID) TO authenticated;
