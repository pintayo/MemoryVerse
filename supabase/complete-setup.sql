-- ============================================================================
-- MemoryVerse Complete Database Setup
-- ============================================================================
-- Run this entire file in Supabase SQL Editor to set up everything
-- This file is IDEMPOTENT - safe to run multiple times
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. DROP EXISTING POLICIES (Clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view verses" ON public.verses;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_verse_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_verse_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_verse_progress;
DROP POLICY IF EXISTS "Users can view their own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can create their own practice sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can view their own daily streaks" ON public.daily_streaks;
DROP POLICY IF EXISTS "Users can insert their own daily streaks" ON public.daily_streaks;
DROP POLICY IF EXISTS "Users can update their own daily streaks" ON public.daily_streaks;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Gamification
    total_xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    verses_memorized INTEGER DEFAULT 0 NOT NULL,
    -- Preferences
    preferred_translation TEXT DEFAULT 'KJV' NOT NULL,
    daily_goal INTEGER DEFAULT 1 NOT NULL,
    reminder_enabled BOOLEAN DEFAULT true NOT NULL,
    reminder_time TIME DEFAULT '09:00:00',
    -- Premium
    is_premium BOOLEAN DEFAULT false NOT NULL,
    premium_expires_at TIMESTAMP WITH TIME ZONE
);

-- Verses table
CREATE TABLE IF NOT EXISTS public.verses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    text TEXT NOT NULL,
    translation TEXT DEFAULT 'KJV' NOT NULL,
    category TEXT,
    difficulty INTEGER DEFAULT 1 NOT NULL,
    context TEXT,
    context_generated_by_ai BOOLEAN,
    context_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(book, chapter, verse_number, translation)
);

-- User verse progress
CREATE TABLE IF NOT EXISTS public.user_verse_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    verse_id UUID REFERENCES public.verses(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'learning' NOT NULL,
    times_practiced INTEGER DEFAULT 0 NOT NULL,
    times_correct INTEGER DEFAULT 0 NOT NULL,
    last_practiced_at TIMESTAMP WITH TIME ZONE,
    mastery_level INTEGER DEFAULT 0 NOT NULL,
    next_review_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, verse_id)
);

-- Practice sessions
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    verse_id UUID REFERENCES public.verses(id) ON DELETE CASCADE NOT NULL,
    session_type TEXT NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    accuracy_percentage DECIMAL(5,2),
    hints_used INTEGER DEFAULT 0 NOT NULL,
    time_spent_seconds INTEGER,
    xp_earned INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, badge_type)
);

-- Daily streaks
CREATE TABLE IF NOT EXISTS public.daily_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- ============================================================================
-- 3. VIEWS
-- ============================================================================

-- Drop and recreate leaderboard view (fixes column name issue)
DROP VIEW IF EXISTS public.leaderboard;

CREATE VIEW public.leaderboard AS
SELECT
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    p.total_xp,
    p.level,
    p.current_streak,
    COUNT(DISTINCT uvp.verse_id) as verses_learned
FROM public.profiles p
LEFT JOIN public.user_verse_progress uvp ON p.id = uvp.user_id
GROUP BY p.id, p.full_name, p.avatar_url, p.total_xp, p.level, p.current_streak
ORDER BY p.total_xp DESC, p.current_streak DESC;

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- Function to automatically create profile on signup
-- ⭐ UPDATED: Now sets default avatar to 😊
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '😊')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_user_verse_progress ON public.user_verse_progress;
CREATE TRIGGER set_updated_at_user_verse_progress
    BEFORE UPDATE ON public.user_verse_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verse_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for verses (public read)
CREATE POLICY "Anyone can view verses" ON public.verses
    FOR SELECT USING (true);

-- RLS Policies for user_verse_progress
CREATE POLICY "Users can view their own progress" ON public.user_verse_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_verse_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_verse_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for practice_sessions
CREATE POLICY "Users can view their own practice sessions" ON public.practice_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own practice sessions" ON public.practice_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Users can view their own achievements" ON public.achievements
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for daily_streaks
CREATE POLICY "Users can view their own daily streaks" ON public.daily_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily streaks" ON public.daily_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily streaks" ON public.daily_streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. INDEXES (Performance optimization)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_verse_progress_user_id ON public.user_verse_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verse_progress_verse_id ON public.user_verse_progress(verse_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_verse_id ON public.practice_sessions(verse_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON public.practice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_id ON public.daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_date ON public.daily_streaks(date);
CREATE INDEX IF NOT EXISTS idx_verses_translation ON public.verses(translation);
CREATE INDEX IF NOT EXISTS idx_verses_category ON public.verses(category);

-- ============================================================================
-- 8. SAMPLE DATA - 50 Popular Bible Verses
-- ============================================================================

INSERT INTO public.verses (book, chapter, verse_number, text, translation, category, difficulty) VALUES
('John', 3, 16, 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', 'NIV', 'salvation', 1),
('Philippians', 4, 13, 'I can do all this through him who gives me strength.', 'NIV', 'strength', 1),
('Jeremiah', 29, 11, 'For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future.', 'NIV', 'hope', 2),
('Proverbs', 3, 5, 'Trust in the Lord with all your heart and lean not on your own understanding.', 'NIV', 'trust', 1),
('Romans', 8, 28, 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', 'NIV', 'comfort', 2),
('Psalm', 23, 1, 'The Lord is my shepherd, I lack nothing.', 'NIV', 'comfort', 1),
('Matthew', 6, 33, 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', 'NIV', 'priorities', 2),
('Isaiah', 41, 10, 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', 'NIV', 'courage', 2),
('Psalm', 46, 1, 'God is our refuge and strength, an ever-present help in trouble.', 'NIV', 'strength', 1),
('Joshua', 1, 9, 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', 'NIV', 'courage', 2),
('Romans', 12, 2, 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God''s will is—his good, pleasing and perfect will.', 'NIV', 'transformation', 3),
('Ephesians', 2, 8, 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God.', 'NIV', 'salvation', 2),
('Psalm', 119, 105, 'Your word is a lamp for my feet, a light on my path.', 'NIV', 'guidance', 1),
('Proverbs', 22, 6, 'Start children off on the way they should go, and even when they are old they will not turn from it.', 'NIV', 'family', 2),
('James', 1, 2, 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds.', 'NIV', 'perseverance', 2),
('2 Timothy', 1, 7, 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', 'NIV', 'courage', 2),
('1 Corinthians', 13, 4, 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.', 'NIV', 'love', 2),
('Matthew', 28, 20, 'And surely I am with you always, to the very end of the age.', 'NIV', 'comfort', 1),
('Psalm', 27, 1, 'The Lord is my light and my salvation— whom shall I fear? The Lord is the stronghold of my life— of whom shall I be afraid?', 'NIV', 'courage', 2),
('Isaiah', 40, 31, 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', 'NIV', 'strength', 2),
('Galatians', 5, 22, 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness.', 'NIV', 'character', 2),
('Hebrews', 11, 1, 'Now faith is confidence in what we hope for and assurance about what we do not see.', 'NIV', 'faith', 2),
('1 John', 4, 19, 'We love because he first loved us.', 'NIV', 'love', 1),
('Psalm', 91, 11, 'For he will command his angels concerning you to guard you in all your ways.', 'NIV', 'protection', 2),
('Matthew', 5, 16, 'In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.', 'NIV', 'witness', 2),
('Romans', 5, 8, 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.', 'NIV', 'salvation', 2),
('Colossians', 3, 23, 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.', 'NIV', 'work', 2),
('Psalm', 37, 4, 'Take delight in the Lord, and he will give you the desires of your heart.', 'NIV', 'joy', 1),
('Proverbs', 16, 3, 'Commit to the Lord whatever you do, and he will establish your plans.', 'NIV', 'guidance', 2),
('Matthew', 11, 28, 'Come to me, all you who are weary and burdened, and I will give you rest.', 'NIV', 'rest', 1),
('1 Peter', 5, 7, 'Cast all your anxiety on him because he cares for you.', 'NIV', 'peace', 1),
('Philippians', 4, 6, 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', 'NIV', 'peace', 2),
('Romans', 15, 13, 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.', 'NIV', 'hope', 2),
('Ephesians', 6, 10, 'Finally, be strong in the Lord and in his mighty power.', 'NIV', 'strength', 1),
('Hebrews', 13, 5, 'Keep your lives free from the love of money and be content with what you have, because God has said, "Never will I leave you; never will I forsake you."', 'NIV', 'contentment', 3),
('1 Thessalonians', 5, 16, 'Rejoice always.', 'NIV', 'joy', 1),
('Psalm', 118, 24, 'The Lord has done it this very day; let us rejoice today and be glad.', 'NIV', 'joy', 1),
('Proverbs', 17, 17, 'A friend loves at all times, and a brother is born for a time of adversity.', 'NIV', 'friendship', 2),
('Mark', 11, 24, 'Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours.', 'NIV', 'prayer', 2),
('2 Corinthians', 5, 17, 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!', 'NIV', 'transformation', 2),
('Psalm', 121, 2, 'My help comes from the Lord, the Maker of heaven and earth.', 'NIV', 'help', 1),
('Matthew', 7, 7, 'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.', 'NIV', 'prayer', 1),
('John', 14, 6, 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me."', 'NIV', 'salvation', 2),
('Psalm', 34, 8, 'Taste and see that the Lord is good; blessed is the one who takes refuge in him.', 'NIV', 'trust', 1),
('Isaiah', 26, 3, 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', 'NIV', 'peace', 2),
('Zephaniah', 3, 17, 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.', 'NIV', 'love', 3),
('John', 15, 5, 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.', 'NIV', 'fruitfulness', 2),
('Micah', 6, 8, 'He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.', 'NIV', 'justice', 3),
('Lamentations', 3, 22, 'Because of the Lord''s great love we are not consumed, for his compassions never fail.', 'NIV', 'love', 2),
('Matthew', 22, 37, 'Jesus replied: "Love the Lord your God with all your heart and with all your soul and with all your mind."', 'NIV', 'love', 2)
ON CONFLICT (book, chapter, verse_number, translation) DO NOTHING;

-- ============================================================================
-- 9. UPDATE EXISTING USER (YOUR ACCOUNT)
-- ============================================================================

-- Update your profile to ensure avatar is set
UPDATE public.profiles
SET avatar_url = COALESCE(avatar_url, '😊')
WHERE id = 'ba11cade-5714-4825-85ed-1372deeab846';

-- ============================================================================
-- 10. ADDITIONAL MIGRATIONS
-- ============================================================================

-- Migration 002: Add context columns to verses (AI-generated context)
ALTER TABLE public.verses
  ADD COLUMN IF NOT EXISTS context TEXT,
  ADD COLUMN IF NOT EXISTS context_generated_by_ai BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS context_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_verses_missing_context
  ON public.verses (id)
  WHERE context IS NULL OR context = '';

CREATE INDEX IF NOT EXISTS idx_verses_ai_context
  ON public.verses (context_generated_by_ai, context_generated_at)
  WHERE context_generated_by_ai = true;

COMMENT ON COLUMN public.verses.context IS 'AI-generated spiritual context and explanation for the verse (1-3 sentences)';
COMMENT ON COLUMN public.verses.context_generated_by_ai IS 'Flag indicating whether context was generated by AI (true) or manually entered (false)';
COMMENT ON COLUMN public.verses.context_generated_at IS 'Timestamp when the context was generated';

-- Migration 003: Add UPDATE policy for verses
DROP POLICY IF EXISTS "Authenticated users can update verse context" ON public.verses;
CREATE POLICY "Authenticated users can update verse context"
    ON public.verses FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Migration 004: Add chapter_contexts table
CREATE TABLE IF NOT EXISTS public.chapter_contexts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    translation TEXT DEFAULT 'KJV' NOT NULL,
    main_themes TEXT,
    historical_context TEXT,
    key_verses TEXT,
    practical_applications TEXT,
    cross_references TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chapter_contexts_book_chapter_translation_key UNIQUE(book, chapter, translation)
);

CREATE INDEX IF NOT EXISTS idx_chapter_contexts_book_chapter
  ON public.chapter_contexts (book, chapter, translation);

COMMENT ON TABLE public.chapter_contexts IS 'AI-generated chapter summaries and contextual information';
COMMENT ON COLUMN public.chapter_contexts.main_themes IS 'Main themes and teachings of the chapter';
COMMENT ON COLUMN public.chapter_contexts.historical_context IS 'Historical and cultural context';
COMMENT ON COLUMN public.chapter_contexts.key_verses IS 'Key verses and their significance';
COMMENT ON COLUMN public.chapter_contexts.practical_applications IS 'Practical applications for daily life';
COMMENT ON COLUMN public.chapter_contexts.cross_references IS 'Related Bible passages';

ALTER TABLE public.chapter_contexts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view chapter contexts" ON public.chapter_contexts;
CREATE POLICY "Anyone can view chapter contexts" ON public.chapter_contexts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert chapter contexts" ON public.chapter_contexts;
CREATE POLICY "Authenticated users can insert chapter contexts" ON public.chapter_contexts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update chapter contexts" ON public.chapter_contexts;
CREATE POLICY "Authenticated users can update chapter contexts" ON public.chapter_contexts
    FOR UPDATE USING (auth.role() = 'authenticated');

GRANT SELECT ON public.chapter_contexts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.chapter_contexts TO authenticated;

-- Migration 006: Add daily_verses table
CREATE TABLE IF NOT EXISTS public.daily_verses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    verse_id UUID REFERENCES public.verses(id) ON DELETE SET NULL,
    translation TEXT DEFAULT 'KJV' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT daily_verses_unique_date UNIQUE (date)
);

ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view daily verses" ON public.daily_verses;
CREATE POLICY "Anyone can view daily verses"
    ON public.daily_verses
    FOR SELECT
    USING (true);

CREATE INDEX IF NOT EXISTS idx_daily_verses_date ON public.daily_verses(date DESC);

COMMENT ON TABLE public.daily_verses IS 'Stores daily verse for synchronization across all users';

-- Function to get or create today's verse
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

    SELECT dv.id, dv.date, dv.verse_id, dv.translation
    INTO v_daily_verse
    FROM public.daily_verses dv
    WHERE dv.date = v_today
    AND dv.translation = p_translation;

    IF v_daily_verse.id IS NULL THEN
        SELECT v.id INTO v_random_verse
        FROM public.verses v
        WHERE v.translation = p_translation
        AND v.is_memorable = true
        ORDER BY RANDOM()
        LIMIT 1;

        IF v_random_verse.id IS NULL THEN
            SELECT v.id INTO v_random_verse
            FROM public.verses v
            WHERE v.translation = p_translation
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;

        INSERT INTO public.daily_verses (date, verse_id, translation)
        VALUES (v_today, v_random_verse.id, p_translation)
        RETURNING daily_verses.id, daily_verses.date, daily_verses.verse_id, daily_verses.translation
        INTO v_daily_verse;
    END IF;

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

COMMENT ON FUNCTION public.get_or_create_daily_verse IS 'Gets or creates the daily verse for today';

-- Migration 006: Add usage_tracking table for premium features and prayer abuse prevention
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    feature_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT usage_tracking_user_feature_date UNIQUE (user_id, feature_name, date)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage tracking" ON public.usage_tracking;
CREATE POLICY "Users can view their own usage tracking"
    ON public.usage_tracking
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage tracking" ON public.usage_tracking;
CREATE POLICY "Users can update their own usage tracking"
    ON public.usage_tracking
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage tracking" ON public.usage_tracking;
CREATE POLICY "Users can insert their own usage tracking"
    ON public.usage_tracking
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature_date ON public.usage_tracking(user_id, feature_name, date);

COMMENT ON TABLE public.usage_tracking IS 'Tracks daily usage of premium features and enforces rate limits';

-- Bible navigation helper functions
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

-- Migration 007: Add subscription_tier column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT;

COMMENT ON COLUMN public.profiles.subscription_tier IS 'User subscription tier: basic, standard, or premium. NULL for free users.';

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
ON public.profiles(subscription_tier);

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS check_subscription_tier;

ALTER TABLE public.profiles
ADD CONSTRAINT check_subscription_tier
CHECK (subscription_tier IS NULL OR subscription_tier IN ('basic', 'standard', 'premium'));

-- Migration 008: Add trigger for usage_tracking updated_at
DROP TRIGGER IF EXISTS set_updated_at_usage_tracking ON public.usage_tracking;
CREATE TRIGGER set_updated_at_usage_tracking
    BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- SETUP COMPLETE! ✅
-- ============================================================================

-- Verify installation
SELECT 'Setup complete!' as status,
       (SELECT COUNT(*) FROM public.verses) as verse_count,
       (SELECT COUNT(*) FROM public.profiles) as user_count;

-- Show your profile
SELECT id, email, full_name, avatar_url, total_xp, level, current_streak
FROM public.profiles
WHERE id = 'ba11cade-5714-4825-85ed-1372deeab846';
