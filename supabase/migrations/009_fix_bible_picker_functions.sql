-- Migration: Create Bible navigation RPC functions
-- This fixes the BibleVersePicker book list display issue

-- Function to get distinct list of Bible books
CREATE OR REPLACE FUNCTION public.get_bible_books(p_translation TEXT DEFAULT 'KJV')
RETURNS TABLE (book TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT v.book
    FROM public.verses v
    WHERE v.translation = p_translation
    ORDER BY v.book;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get distinct list of chapters for a book
CREATE OR REPLACE FUNCTION public.get_bible_chapters(
    p_book TEXT,
    p_translation TEXT DEFAULT 'KJV'
)
RETURNS TABLE (chapter INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT v.chapter
    FROM public.verses v
    WHERE v.book = p_book
    AND v.translation = p_translation
    ORDER BY v.chapter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON FUNCTION public.get_bible_books IS 'Returns distinct list of Bible books for a translation - fixes BibleVersePicker display';
COMMENT ON FUNCTION public.get_bible_chapters IS 'Returns distinct list of chapters for a book - fixes BibleVersePicker display';

-- Verify functions work by testing them (optional but recommended)
-- SELECT * FROM get_bible_books('KJV') LIMIT 5;
-- SELECT * FROM get_bible_chapters('Genesis', 'KJV') LIMIT 5;
