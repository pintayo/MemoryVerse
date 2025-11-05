-- MemoryVerse Test User Data
-- This script creates test users for development and testing
-- Run this AFTER creating the auth users in Supabase Auth

-- First, you need to create auth users in Supabase Dashboard or via API:
-- Email: pintayo@memoryverse.app, Password: Tijdelijk123
-- Email: sarah.johnson@test.com, Password: TestPass123
-- Email: david.chen@test.com, Password: TestPass123
-- Email: maria.garcia@test.com, Password: TestPass123
-- Email: james.wilson@test.com, Password: TestPass123
-- Email: emma.brown@test.com, Password: TestPass123
-- Email: michael.davis@test.com, Password: TestPass123
-- Email: olivia.miller@test.com, Password: TestPass123
-- Email: william.moore@test.com, Password: TestPass123
-- Email: sophia.taylor@test.com, Password: TestPass123

-- Then run this script to populate profiles
-- Replace the UUIDs below with the actual auth.users IDs from Supabase

-- Main test account: pintayo
-- 3 day streak, 450 XP
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'pintayo@memoryverse.app', 'Pintayo', '🎯', 450, 3, 5, 12, NOW() - INTERVAL '30 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Test User 2: Sarah Johnson (top of leaderboard)
-- 28 day streak, 2450 XP
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'sarah.johnson@test.com', 'Sarah Johnson', '👩', 2450, 28, 35, 78, NOW() - INTERVAL '60 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Test User 3: David Chen
-- 21 day streak, 2100 XP
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'david.chen@test.com', 'David Chen', '👨', 2100, 21, 28, 65, NOW() - INTERVAL '45 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Test User 4: Maria Garcia
-- 14 day streak, 1820 XP
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000004', 'maria.garcia@test.com', 'Maria Garcia', '👩‍🦱', 1820, 14, 21, 52, NOW() - INTERVAL '40 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Test User 5: James Wilson
-- 12 day streak, 1650 XP (pintayo's rank comparison)
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000005', 'james.wilson@test.com', 'James Wilson', '🧔', 1650, 12, 18, 48, NOW() - INTERVAL '35 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Test User 6: Emma Brown
-- 8 day streak, 1200 XP
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000006', 'emma.brown@test.com', 'Emma Brown', '👱‍♀️', 1200, 8, 15, 38, NOW() - INTERVAL '28 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Test User 7: Michael Davis
-- 7 day streak, 980 XP
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000007', 'michael.davis@test.com', 'Michael Davis', '👨‍💼', 980, 7, 12, 32, NOW() - INTERVAL '25 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Test User 8: Olivia Miller
-- 5 day streak, 720 XP
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000008', 'olivia.miller@test.com', 'Olivia Miller', '👩‍🎓', 720, 5, 9, 24, NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Test User 9: William Moore
-- 3 day streak, 350 XP
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000009', 'william.moore@test.com', 'William Moore', '👨‍🔬', 350, 3, 6, 15, NOW() - INTERVAL '15 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Test User 10: Sophia Taylor
-- 2 day streak, 180 XP
INSERT INTO profiles (id, email, full_name, avatar, total_xp, current_streak, longest_streak, verses_memorized, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'sophia.taylor@test.com', 'Sophia Taylor', '👩‍🏫', 180, 2, 4, 8, NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar,
  total_xp = EXCLUDED.total_xp,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  verses_memorized = EXCLUDED.verses_memorized;

-- Add some daily streak records for pintayo to show consistent activity
INSERT INTO daily_streaks (user_id, practice_date, verses_practiced, xp_earned)
VALUES
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 4, 150),
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 3, 120),
  ('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 5, 180)
ON CONFLICT (user_id, practice_date) DO UPDATE SET
  verses_practiced = EXCLUDED.verses_practiced,
  xp_earned = EXCLUDED.xp_earned;

-- Add some achievements for pintayo
INSERT INTO achievements (user_id, badge_type, name, description, earned_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'streak', 'First Steps', 'Complete your first day', NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0000-000000000001', 'verses', 'Memory Builder', 'Memorize 10 verses', NOW() - INTERVAL '15 days'),
  ('00000000-0000-0000-0000-000000000001', 'practice', 'Consistent Learner', 'Practice 3 days in a row', NOW() - INTERVAL '2 days')
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- Verify the data
SELECT
  full_name,
  total_xp,
  current_streak,
  verses_memorized,
  email
FROM profiles
ORDER BY total_xp DESC;
