-- Migration: Add chapter_contexts table
-- Created: 2025-11-14
-- Description: Adds table for storing AI-generated chapter summaries and context

-- Create chapter_contexts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chapter_contexts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    translation TEXT DEFAULT 'KJV' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chapter_contexts_book_chapter_translation_key'
    ) THEN
        ALTER TABLE public.chapter_contexts
        ADD CONSTRAINT chapter_contexts_book_chapter_translation_key
        UNIQUE(book, chapter, translation);
    END IF;
END $$;

-- Add columns if they don't exist
ALTER TABLE public.chapter_contexts
    ADD COLUMN IF NOT EXISTS main_themes TEXT,
    ADD COLUMN IF NOT EXISTS historical_context TEXT,
    ADD COLUMN IF NOT EXISTS key_verses TEXT,
    ADD COLUMN IF NOT EXISTS practical_applications TEXT,
    ADD COLUMN IF NOT EXISTS cross_references TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add index for querying chapter contexts
CREATE INDEX IF NOT EXISTS idx_chapter_contexts_book_chapter
  ON public.chapter_contexts (book, chapter, translation);

-- Add comments for documentation
COMMENT ON TABLE public.chapter_contexts IS 'AI-generated chapter summaries and contextual information';
COMMENT ON COLUMN public.chapter_contexts.main_themes IS 'Main themes and teachings of the chapter';
COMMENT ON COLUMN public.chapter_contexts.historical_context IS 'Historical and cultural context';
COMMENT ON COLUMN public.chapter_contexts.key_verses IS 'Key verses and their significance';
COMMENT ON COLUMN public.chapter_contexts.practical_applications IS 'Practical applications for daily life';
COMMENT ON COLUMN public.chapter_contexts.cross_references IS 'Related Bible passages';

-- Enable RLS
ALTER TABLE public.chapter_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policy - anyone can read chapter contexts
CREATE POLICY "Anyone can view chapter contexts" ON public.chapter_contexts
    FOR SELECT USING (true);

-- RLS Policy - authenticated users can update (for admin/AI generation)
CREATE POLICY "Authenticated users can insert chapter contexts" ON public.chapter_contexts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update chapter contexts" ON public.chapter_contexts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON public.chapter_contexts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.chapter_contexts TO authenticated;

-- IMPORTANT: After running this migration, refresh the schema cache
-- Run this command in the SQL Editor:
-- NOTIFY pgrst, 'reload schema';
