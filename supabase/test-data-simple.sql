-- MemoryVerse Test User Data - SIMPLIFIED VERSION
--
-- STEP 1: Create your test user in Supabase Dashboard
-- Go to: Authentication > Users > Add User
-- Email: pintayo@memoryverse.app
-- Password: Tijdelijk123
-- Auto Confirm: YES
--
-- STEP 2: Copy the UUID from the Users table (looks like: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
--
-- STEP 3: Replace 'PASTE_YOUR_UUID_HERE' below with your actual UUID
--
-- STEP 4: Run this SQL in the Supabase SQL Editor

-- Your main test account profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  avatar_url,
  total_xp,
  level,
  current_streak,
  longest_streak
)
VALUES (
  'PASTE_YOUR_UUID_HERE',  -- <-- REPLACE THIS with your UUID from Step 2
  'pintayo@memoryverse.app',
  'Pintayo',
  '🎯',
  450,
  3,
  3,
  5
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Add some recent activity
INSERT INTO public.daily_streaks (user_id, date, verses_practiced, xp_earned)
VALUES
  ('PASTE_YOUR_UUID_HERE', CURRENT_DATE, 4, 150),  -- <-- REPLACE THIS too
  ('PASTE_YOUR_UUID_HERE', CURRENT_DATE - 1, 3, 120),
  ('PASTE_YOUR_UUID_HERE', CURRENT_DATE - 2, 5, 180)
ON CONFLICT (user_id, date) DO UPDATE SET
  verses_practiced = EXCLUDED.verses_practiced,
  xp_earned = EXCLUDED.xp_earned;

-- Add some achievements
INSERT INTO public.achievements (user_id, badge_type, badge_name, description)
VALUES
  ('PASTE_YOUR_UUID_HERE', 'first-day', 'First Steps', 'Complete your first day'),  -- <-- REPLACE THIS too
  ('PASTE_YOUR_UUID_HERE', 'ten-verses', 'Memory Builder', 'Memorize 10 verses'),
  ('PASTE_YOUR_UUID_HERE', 'three-day-streak', 'Consistent Learner', 'Practice 3 days in a row')
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- Verify it worked
SELECT
  full_name,
  email,
  total_xp,
  current_streak,
  level
FROM public.profiles
WHERE email = 'pintayo@memoryverse.app';
