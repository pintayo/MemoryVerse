-- Fix daily verse to use user's local date instead of server UTC date
-- This prevents users in different timezones from seeing yesterday's verse

DROP FUNCTION IF EXISTS public.get_or_create_daily_verse(TEXT);

CREATE OR REPLACE FUNCTION public.get_or_create_daily_verse(
    p_translation TEXT DEFAULT 'KJV',
    p_local_date DATE DEFAULT NULL
)
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
    -- Use provided local date, or fall back to server's CURRENT_DATE
    v_today := COALESCE(p_local_date, CURRENT_DATE);

    -- Try to get existing daily verse for this date
    SELECT dv.id, dv.date, dv.verse_id, dv.translation
    INTO v_daily_verse
    FROM public.daily_verses dv
    WHERE dv.date = v_today
    AND dv.translation = p_translation;

    -- If no verse exists for this date, create one
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

COMMENT ON FUNCTION public.get_or_create_daily_verse IS 'Gets or creates the daily verse for a specific date (user''s local date)';
