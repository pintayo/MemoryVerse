-- ============================================================================
-- Add Favorites/Starred Verses Feature
-- ============================================================================
-- Run this in Supabase SQL Editor to add favorites functionality
-- ============================================================================

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    verse_id UUID REFERENCES public.verses(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,  -- Optional notes for the favorite verse
    UNIQUE(user_id, verse_id) -- Prevent duplicate favorites
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_verse_id ON public.user_favorites(verse_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
CREATE POLICY "Users can view their own favorites"
    ON public.user_favorites
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.user_favorites;
CREATE POLICY "Users can insert their own favorites"
    ON public.user_favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own favorites" ON public.user_favorites;
CREATE POLICY "Users can update their own favorites"
    ON public.user_favorites
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.user_favorites;
CREATE POLICY "Users can delete their own favorites"
    ON public.user_favorites
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add downloaded_books table for offline functionality (premium feature)
CREATE TABLE IF NOT EXISTS public.downloaded_books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    book TEXT NOT NULL,
    translation TEXT NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verse_count INTEGER NOT NULL,
    storage_size_bytes BIGINT DEFAULT 0,
    UNIQUE(user_id, book, translation)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_downloaded_books_user_id ON public.downloaded_books(user_id);
CREATE INDEX IF NOT EXISTS idx_downloaded_books_book ON public.downloaded_books(book);

-- Enable RLS
ALTER TABLE public.downloaded_books ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.downloaded_books;
CREATE POLICY "Users can view their own downloads"
    ON public.downloaded_books
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.downloaded_books;
CREATE POLICY "Users can insert their own downloads"
    ON public.downloaded_books
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own downloads" ON public.downloaded_books;
CREATE POLICY "Users can delete their own downloads"
    ON public.downloaded_books
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.downloaded_books TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Favorites and offline download tables created successfully!';
    RAISE NOTICE 'Run this SQL in your Supabase project to enable these features.';
END $$;
