-- ============================================================================
-- Daily Verses Table
-- Stores the daily verse for each day to ensure all users see the same verse
-- ============================================================================

-- Create daily_verses table
CREATE TABLE IF NOT EXISTS public.daily_verses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    verse_id UUID REFERENCES public.verses(id) ON DELETE SET NULL,
    translation TEXT DEFAULT 'KJV' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT daily_verses_unique_date UNIQUE (date)
);

-- Enable RLS
ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

-- Create policy - anyone can view daily verses (read-only)
DROP POLICY IF EXISTS "Anyone can view daily verses" ON public.daily_verses;
CREATE POLICY "Anyone can view daily verses"
    ON public.daily_verses
    FOR SELECT
    USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_verses_date ON public.daily_verses(date DESC);

-- ============================================================================
-- Function to get or create today's verse
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_or_create_daily_verse(p_translation TEXT DEFAULT 'KJV')
RETURNS TABLE (
    id UUID,
    date DATE,
    verse_id UUID,
    translation TEXT,
    book TEXT,
    chapter INTEGER,
    verse_number INTEGER,
    text TEXT
) AS $$
DECLARE
    v_today DATE;
    v_daily_verse RECORD;
    v_random_verse RECORD;
BEGIN
    v_today := CURRENT_DATE;

    -- Try to get existing daily verse for today
    SELECT dv.id, dv.date, dv.verse_id, dv.translation
    INTO v_daily_verse
    FROM public.daily_verses dv
    WHERE dv.date = v_today
    AND dv.translation = p_translation;

    -- If no verse exists for today, create one
    IF v_daily_verse.id IS NULL THEN
        -- Get a random memorable verse
        SELECT v.id INTO v_random_verse
        FROM public.verses v
        WHERE v.translation = p_translation
        AND v.is_memorable = true
        ORDER BY RANDOM()
        LIMIT 1;

        -- If no memorable verses, get any random verse
        IF v_random_verse.id IS NULL THEN
            SELECT v.id INTO v_random_verse
            FROM public.verses v
            WHERE v.translation = p_translation
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        -- Insert the daily verse
        INSERT INTO public.daily_verses (date, verse_id, translation)
        VALUES (v_today, v_random_verse.id, p_translation)
        RETURNING daily_verses.id, daily_verses.date, daily_verses.verse_id, daily_verses.translation
        INTO v_daily_verse;
    END IF;

    -- Return the daily verse with full verse details
    RETURN QUERY
    SELECT
        v_daily_verse.id,
        v_daily_verse.date,
        v_daily_verse.verse_id,
        v_daily_verse.translation,
        v.book,
        v.chapter,
        v.verse_number,
        v.text
    FROM public.verses v
    WHERE v.id = v_daily_verse.verse_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Usage Limits Table for Premium Features
-- Tracks daily usage of premium features like "Talk about your day"
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usage_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT usage_limits_user_feature UNIQUE (user_id, feature_name)
);

-- Enable RLS
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own usage limits" ON public.usage_limits;
CREATE POLICY "Users can view their own usage limits"
    ON public.usage_limits
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage limits" ON public.usage_limits;
CREATE POLICY "Users can update their own usage limits"
    ON public.usage_limits
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage limits" ON public.usage_limits;
CREATE POLICY "Users can insert their own usage limits"
    ON public.usage_limits
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_feature ON public.usage_limits(user_id, feature_name);

-- ============================================================================
-- Function to check and increment usage
-- Returns remaining usage count or -1 if limit exceeded
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_and_increment_usage(
    p_user_id UUID,
    p_feature_name TEXT,
    p_daily_limit INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
    v_usage RECORD;
    v_today DATE;
    v_remaining INTEGER;
BEGIN
    v_today := CURRENT_DATE;

    -- Get or create usage record
    SELECT * INTO v_usage
    FROM public.usage_limits
    WHERE user_id = p_user_id
    AND feature_name = p_feature_name;

    -- If no record exists, create one
    IF v_usage.id IS NULL THEN
        INSERT INTO public.usage_limits (user_id, feature_name, usage_count, last_reset_at)
        VALUES (p_user_id, p_feature_name, 1, timezone('utc'::text, now()))
        RETURNING * INTO v_usage;

        RETURN p_daily_limit - 1;
    END IF;

    -- Check if we need to reset the count (new day)
    IF v_usage.last_reset_at::DATE < v_today THEN
        UPDATE public.usage_limits
        SET usage_count = 1,
            last_reset_at = timezone('utc'::text, now()),
            updated_at = timezone('utc'::text, now())
        WHERE id = v_usage.id;

        RETURN p_daily_limit - 1;
    END IF;

    -- Check if limit exceeded
    IF v_usage.usage_count >= p_daily_limit THEN
        RETURN -1; -- Limit exceeded
    END IF;

    -- Increment usage
    UPDATE public.usage_limits
    SET usage_count = usage_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_usage.id;

    v_remaining := p_daily_limit - (v_usage.usage_count + 1);
    RETURN v_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to get remaining usage for a feature
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_remaining_usage(
    p_user_id UUID,
    p_feature_name TEXT,
    p_daily_limit INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
    v_usage RECORD;
    v_today DATE;
BEGIN
    v_today := CURRENT_DATE;

    -- Get usage record
    SELECT * INTO v_usage
    FROM public.usage_limits
    WHERE user_id = p_user_id
    AND feature_name = p_feature_name;

    -- If no record, full limit available
    IF v_usage.id IS NULL THEN
        RETURN p_daily_limit;
    END IF;

    -- If last reset was before today, full limit available
    IF v_usage.last_reset_at::DATE < v_today THEN
        RETURN p_daily_limit;
    END IF;

    -- Return remaining
    RETURN GREATEST(0, p_daily_limit - v_usage.usage_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.daily_verses IS 'Stores daily verse for synchronization across all users';
COMMENT ON TABLE public.usage_limits IS 'Tracks usage limits for premium features';
COMMENT ON FUNCTION public.get_or_create_daily_verse IS 'Gets or creates the daily verse for today';
COMMENT ON FUNCTION public.check_and_increment_usage IS 'Checks usage limit and increments count. Returns remaining uses or -1 if exceeded.';
COMMENT ON FUNCTION public.get_remaining_usage IS 'Returns remaining usage count for a feature';

-- ============================================================================
-- Bible Navigation Helper Functions
-- These make the BibleVersePicker much more efficient
-- ============================================================================

-- Function to get all unique books for a translation
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

-- Function to get all chapters for a book
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

COMMENT ON FUNCTION public.get_bible_books IS 'Returns distinct list of Bible books for a translation';
COMMENT ON FUNCTION public.get_bible_chapters IS 'Returns distinct list of chapters for a book';
