-- MemoryVerse Test User Data
-- This script creates test users for development and testing

-- ===============================================
-- IMPORTANT: HOW TO USE THIS FILE
-- ===============================================
-- 1. First, create auth users in Supabase Dashboard:
--    Go to Authentication > Users > Add User
--    Create users with the emails and passwords listed below
--
-- 2. After creating each user, copy their UUID from the Users table
--
-- 3. Replace 'YOUR_UUID_HERE_X' in this file with the actual UUIDs
--
-- 4. Run this SQL script in the Supabase SQL Editor
--
-- Note: You CANNOT create passwords via SQL. Supabase Auth handles
-- password hashing through its API/Dashboard only.
-- ===============================================

-- Test Account Credentials (create in Supabase Dashboard first):
-- 1. Email: pintayo@memoryverse.app, Password: Tijdelijk123
-- 2. Email: sarah.johnson@test.com, Password: TestPass123
-- 3. Email: david.chen@test.com, Password: TestPass123
-- 4. Email: maria.garcia@test.com, Password: TestPass123
-- 5. Email: james.wilson@test.com, Password: TestPass123
-- 6. Email: emma.brown@test.com, Password: TestPass123
-- 7. Email: michael.davis@test.com, Password: TestPass123
-- 8. Email: olivia.miller@test.com, Password: TestPass123
-- 9. Email: william.moore@test.com, Password: TestPass123
-- 10. Email: sophia.taylor@test.com, Password: TestPass123

-- ===============================================
-- PROFILES (replace UUIDs with real ones)
-- ===============================================

-- Main test account: pintayo
-- 3 day streak, 450 XP (Level 5 = sqrt(450/100) + 1)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_1', 'pintayo@memoryverse.app', 'Pintayo', '🎯', 450, 3, 3, 5, NOW() - INTERVAL '30 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Test User 2: Sarah Johnson (top of leaderboard)
-- 28 day streak, 2450 XP (Level 6)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_2', 'sarah.johnson@test.com', 'Sarah Johnson', '👩', 2450, 6, 28, 35, NOW() - INTERVAL '60 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Test User 3: David Chen
-- 21 day streak, 2100 XP (Level 5)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_3', 'david.chen@test.com', 'David Chen', '👨', 2100, 5, 21, 28, NOW() - INTERVAL '45 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Test User 4: Maria Garcia
-- 14 day streak, 1820 XP (Level 5)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_4', 'maria.garcia@test.com', 'Maria Garcia', '👩‍🦱', 1820, 5, 14, 21, NOW() - INTERVAL '40 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Test User 5: James Wilson
-- 12 day streak, 1650 XP (Level 5)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_5', 'james.wilson@test.com', 'James Wilson', '🧔', 1650, 5, 12, 18, NOW() - INTERVAL '35 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Test User 6: Emma Brown
-- 8 day streak, 1200 XP (Level 4)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_6', 'emma.brown@test.com', 'Emma Brown', '👱‍♀️', 1200, 4, 8, 15, NOW() - INTERVAL '28 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Test User 7: Michael Davis
-- 7 day streak, 980 XP (Level 4)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_7', 'michael.davis@test.com', 'Michael Davis', '👨‍💼', 980, 4, 7, 12, NOW() - INTERVAL '25 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Test User 8: Olivia Miller
-- 5 day streak, 720 XP (Level 3)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_8', 'olivia.miller@test.com', 'Olivia Miller', '👩‍🎓', 720, 3, 5, 9, NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Test User 9: William Moore
-- 3 day streak, 350 XP (Level 2)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_9', 'william.moore@test.com', 'William Moore', '👨‍🔬', 350, 2, 3, 6, NOW() - INTERVAL '15 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- Test User 10: Sophia Taylor
-- 2 day streak, 180 XP (Level 2)
INSERT INTO public.profiles (id, email, full_name, avatar_url, total_xp, level, current_streak, longest_streak, created_at, updated_at)
VALUES
  ('YOUR_UUID_HERE_10', 'sophia.taylor@test.com', 'Sophia Taylor', '👩‍🏫', 180, 2, 2, 4, NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  total_xp = EXCLUDED.total_xp,
  level = EXCLUDED.level,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  updated_at = NOW();

-- ===============================================
-- DAILY STREAKS (for pintayo)
-- ===============================================

-- Add some daily streak records for pintayo to show consistent activity
INSERT INTO public.daily_streaks (user_id, date, verses_practiced, xp_earned)
VALUES
  ('YOUR_UUID_HERE_1', CURRENT_DATE, 4, 150),
  ('YOUR_UUID_HERE_1', CURRENT_DATE - INTERVAL '1 day', 3, 120),
  ('YOUR_UUID_HERE_1', CURRENT_DATE - INTERVAL '2 days', 5, 180)
ON CONFLICT (user_id, date) DO UPDATE SET
  verses_practiced = EXCLUDED.verses_practiced,
  xp_earned = EXCLUDED.xp_earned;

-- ===============================================
-- ACHIEVEMENTS (for pintayo)
-- ===============================================

-- Add some achievements for pintayo
INSERT INTO public.achievements (user_id, badge_type, badge_name, description, earned_at)
VALUES
  ('YOUR_UUID_HERE_1', 'first-day', 'First Steps', 'Complete your first day', NOW() - INTERVAL '30 days'),
  ('YOUR_UUID_HERE_1', 'ten-verses', 'Memory Builder', 'Memorize 10 verses', NOW() - INTERVAL '15 days'),
  ('YOUR_UUID_HERE_1', 'three-day-streak', 'Consistent Learner', 'Practice 3 days in a row', NOW() - INTERVAL '2 days')
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- ===============================================
-- VERIFY THE DATA
-- ===============================================

-- Query to verify all profiles were created correctly
SELECT
  full_name,
  email,
  total_xp,
  level,
  current_streak,
  longest_streak,
  created_at
FROM public.profiles
ORDER BY total_xp DESC;

-- Query to check leaderboard view
SELECT * FROM public.leaderboard LIMIT 10;
