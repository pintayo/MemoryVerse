-- Migration: Fix chapter_contexts schema issues
-- Created: 2025-11-14
-- Description: Remove old 'context' column and fix schema cache

-- Drop the old 'context' column if it exists (from old schema)
ALTER TABLE public.chapter_contexts
    DROP COLUMN IF EXISTS context,
    DROP COLUMN IF EXISTS context_generated_by_ai,
    DROP COLUMN IF EXISTS context_generated_at;

-- Ensure all our columns exist
ALTER TABLE public.chapter_contexts
    ADD COLUMN IF NOT EXISTS main_themes TEXT,
    ADD COLUMN IF NOT EXISTS historical_context TEXT,
    ADD COLUMN IF NOT EXISTS key_verses TEXT,
    ADD COLUMN IF NOT EXISTS practical_applications TEXT,
    ADD COLUMN IF NOT EXISTS cross_references TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
