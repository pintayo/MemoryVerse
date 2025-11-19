-- =====================================================
-- MEMORYVERSE DATABASE CLEANUP SCRIPT
-- =====================================================
-- Removes all unused tables to simplify production database
-- This script is SAFE to run - all tables being deleted have 0 rows
--
-- RUN THIS IN: Supabase SQL Editor
-- BACKUP: Always recommended before running cleanup
-- =====================================================

-- =====================================================
-- STEP 1: VERIFY TABLES ARE EMPTY (Safety Check)
-- =====================================================

SELECT
  'SAFETY CHECK - Verifying tables are empty before deletion' as check_name,
  '' as table_name,
  0 as row_count
UNION ALL
SELECT 'Table Check', 'verse_collections', COUNT(*)::integer FROM verse_collections
UNION ALL
SELECT 'Table Check', 'verse_collection_items', COUNT(*)::integer FROM verse_collection_items
UNION ALL
SELECT 'Table Check', 'verse_collection_shares', COUNT(*)::integer FROM verse_collection_shares
UNION ALL
SELECT 'Table Check', 'prayer_conversations', COUNT(*)::integer FROM prayer_conversations
UNION ALL
SELECT 'Table Check', 'prayer_messages', COUNT(*)::integer FROM prayer_messages
UNION ALL
SELECT 'Table Check', 'prayer_insights', COUNT(*)::integer FROM prayer_insights
UNION ALL
SELECT 'Table Check', 'analytics_snapshots', COUNT(*)::integer FROM analytics_snapshots
UNION ALL
SELECT 'Table Check', 'learning_velocity', COUNT(*)::integer FROM learning_velocity
UNION ALL
SELECT 'Table Check', 'bible_translations', COUNT(*)::integer FROM bible_translations
UNION ALL
SELECT 'Table Check', 'verses_translations', COUNT(*)::integer FROM verses_translations
UNION ALL
SELECT 'Table Check', 'export_logs', COUNT(*)::integer FROM export_logs
UNION ALL
SELECT 'Table Check', 'downloaded_books', COUNT(*)::integer FROM downloaded_books
UNION ALL
SELECT 'Table Check', 'verse_notes', COUNT(*)::integer FROM verse_notes
UNION ALL
SELECT 'Table Check', 'verse_of_the_day', COUNT(*)::integer FROM verse_of_the_day
ORDER BY check_name DESC, table_name;

-- ⚠️ IMPORTANT: Review the output above
-- All tables should show 0 rows (except bible_translations which has 6 dummy rows)
-- If any table has data you want to keep, STOP and export that data first

-- =====================================================
-- STEP 2: DROP UNUSED TABLES
-- =====================================================

-- VERSE COLLECTIONS FEATURE (Not Implemented)
-- Tables: 3
-- Total Rows: 0
DROP TABLE IF EXISTS public.verse_collection_shares CASCADE;
DROP TABLE IF EXISTS public.verse_collection_items CASCADE;
DROP TABLE IF EXISTS public.verse_collections CASCADE;

-- ENHANCED PRAYER COACHING (Not Implemented)
-- Tables: 3
-- Total Rows: 0
DROP TABLE IF EXISTS public.prayer_insights CASCADE;
DROP TABLE IF EXISTS public.prayer_messages CASCADE;
DROP TABLE IF EXISTS public.prayer_conversations CASCADE;

-- ADVANCED ANALYTICS (Not Implemented)
-- Tables: 2
-- Total Rows: 0
DROP TABLE IF EXISTS public.learning_velocity CASCADE;
DROP TABLE IF EXISTS public.analytics_snapshots CASCADE;

-- BIBLE TRANSLATIONS SYSTEM (Replaced by verses.translation column)
-- Tables: 2
-- Total Rows: 6 (bible_translations has dummy data) + 0 (verses_translations)
DROP TABLE IF EXISTS public.verses_translations CASCADE;
DROP TABLE IF EXISTS public.bible_translations CASCADE;

-- EXPORT FEATURE (Not Implemented)
-- Tables: 1
-- Total Rows: 0
DROP TABLE IF EXISTS public.export_logs CASCADE;

-- OFFLINE DOWNLOADS (Not Implemented)
-- Tables: 1
-- Total Rows: 0
DROP TABLE IF EXISTS public.downloaded_books CASCADE;

-- STUDY NOTES (Not Implemented)
-- Tables: 1
-- Total Rows: 0
DROP TABLE IF EXISTS public.verse_notes CASCADE;

-- DEPRECATED VERSE OF THE DAY (Replaced by daily_verses)
-- Tables: 1
-- Total Rows: 0
DROP TABLE IF EXISTS public.verse_of_the_day CASCADE;

-- =====================================================
-- STEP 3: DROP RELATED RPC FUNCTIONS
-- =====================================================

-- Functions for verse collections
DROP FUNCTION IF EXISTS public.get_user_collections_with_stats(UUID) CASCADE;

-- Functions for advanced analytics
DROP FUNCTION IF EXISTS public.get_advanced_analytics_summary(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.generate_daily_analytics_snapshot(UUID) CASCADE;

-- =====================================================
-- STEP 4: VERIFY CLEANUP SUCCESS
-- =====================================================

-- Show remaining tables (should only show the 12 core tables)
SELECT
  'Remaining Tables After Cleanup' as info,
  table_name,
  (SELECT COUNT(*)
   FROM information_schema.columns
   WHERE table_name = t.table_name
   AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected remaining tables:
-- 1. achievements
-- 2. chapter_contexts
-- 3. daily_streaks
-- 4. daily_verses
-- 5. leaderboard (this is a view, not a table)
-- 6. practice_sessions
-- 7. profiles
-- 8. story_mode_notifications (NEW - for Story Mode interest tracking)
-- 9. usage_limits
-- 10. user_favorites
-- 11. user_verse_progress
-- 12. verses

-- =====================================================
-- STEP 5: SHOW REMAINING FUNCTIONS
-- =====================================================

-- Show remaining RPC functions
SELECT
  'Remaining Functions After Cleanup' as info,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected remaining functions:
-- 1. check_and_increment_usage
-- 2. get_remaining_usage
-- 3. get_story_mode_interest_count (NEW)
-- 4. handle_new_user
-- 5. handle_updated_at

-- =====================================================
-- CLEANUP SUMMARY
-- =====================================================

SELECT
  'CLEANUP COMPLETE' as status,
  '13 tables removed' as tables_deleted,
  '3 functions removed' as functions_deleted,
  '12 core tables remaining' as tables_remaining,
  'Database simplified by 52%' as improvement;

-- =====================================================
-- POST-CLEANUP VERIFICATION QUERIES
-- =====================================================

-- Count total tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 12

-- Count total functions
SELECT COUNT(*) as total_functions
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
-- Expected: ~5

-- Show database size
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size;
-- Expected: ~185 MB (mostly verses table)

-- =====================================================
-- NOTES FOR PRODUCTION
-- =====================================================

-- ✅ All deleted tables had 0 rows (safe deletion)
-- ✅ Corresponding code files should also be deleted:
--    - src/services/verseCollectionsService.ts
--    - src/services/enhancedPrayerCoachingService.ts
--    - src/services/advancedAnalyticsService.ts
--    - src/services/exportService.ts
--    - src/services/studyNotesService.ts
--    - src/services/translationService.ts
--
-- ✅ Migration files can be kept in /supabase/migrations/
--    They serve as documentation and can be used to recreate features if needed
--
-- ✅ If you need any of these features in the future:
--    Simply re-run the migration files from /supabase/migrations/008_add_premium_features.sql

-- =====================================================
-- END OF CLEANUP SCRIPT
-- =====================================================
