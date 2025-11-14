-- Comprehensive Schema Cache Fix
-- Run this entire script in Supabase SQL Editor

-- Step 1: Fix chapter_contexts table
-- Drop old columns that might have NOT NULL constraints
ALTER TABLE public.chapter_contexts
    DROP COLUMN IF EXISTS context,
    DROP COLUMN IF EXISTS context_generated_by_ai,
    DROP COLUMN IF EXISTS context_generated_at;

-- Ensure all required columns exist
ALTER TABLE public.chapter_contexts
    ADD COLUMN IF NOT EXISTS main_themes TEXT,
    ADD COLUMN IF NOT EXISTS historical_context TEXT,
    ADD COLUMN IF NOT EXISTS key_verses TEXT,
    ADD COLUMN IF NOT EXISTS practical_applications TEXT,
    ADD COLUMN IF NOT EXISTS cross_references TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Step 2: Verify profiles table has level column
-- (This should already exist, but let's make sure)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'level'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN level INTEGER DEFAULT 1 NOT NULL;
    END IF;
END $$;

-- Step 3: Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Step 4: Verify the fix
SELECT
    'Schema check complete!' as status,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'level'
    ) as profiles_level_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chapter_contexts' AND column_name = 'updated_at'
    ) as chapter_contexts_updated_at_exists,
    NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chapter_contexts' AND column_name = 'context'
    ) as old_context_column_removed;
