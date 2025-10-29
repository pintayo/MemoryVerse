-- MemoryVerse Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

    -- Preferences
    preferred_translation TEXT DEFAULT 'NIV' NOT NULL,
    daily_goal INTEGER DEFAULT 1 NOT NULL,
    reminder_enabled BOOLEAN DEFAULT true NOT NULL,
    reminder_time TIME,

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
    translation TEXT DEFAULT 'NIV' NOT NULL,
    category TEXT, -- e.g., 'comfort', 'wisdom', 'promise', etc.
    difficulty INTEGER DEFAULT 1 NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Unique constraint on book, chapter, verse, and translation
    UNIQUE(book, chapter, verse_number, translation)
);

-- User verse progress table
CREATE TABLE IF NOT EXISTS public.user_verse_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    verse_id UUID REFERENCES public.verses(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'learning' NOT NULL CHECK (status IN ('learning', 'reviewing', 'mastered')),
    accuracy_score NUMERIC(5,2) DEFAULT 0.0 NOT NULL,
    attempts INTEGER DEFAULT 0 NOT NULL,
    last_practiced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    next_review_at TIMESTAMP WITH TIME ZONE,
    mastered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- One progress record per user per verse
    UNIQUE(user_id, verse_id)
);

-- Practice sessions table
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    verse_id UUID REFERENCES public.verses(id) ON DELETE CASCADE NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('read', 'recall', 'recite')),
    user_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    accuracy_percentage NUMERIC(5,2) NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0 NOT NULL,
    hints_used INTEGER DEFAULT 0 NOT NULL,
    xp_earned INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Achievements/Badges table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_type TEXT NOT NULL, -- e.g., 'first-verse', 'week-streak', 'perfect-recital'
    badge_name TEXT NOT NULL,
    description TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- One badge of each type per user
    UNIQUE(user_id, badge_type)
);

-- Daily streaks table
CREATE TABLE IF NOT EXISTS public.daily_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    verses_practiced INTEGER DEFAULT 0 NOT NULL,
    xp_earned INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- One record per user per day
    UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_verse_progress_user_id ON public.user_verse_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verse_progress_verse_id ON public.user_verse_progress(verse_id);
CREATE INDEX IF NOT EXISTS idx_user_verse_progress_status ON public.user_verse_progress(status);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_verse_id ON public.practice_sessions(verse_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON public.practice_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_user_id ON public.daily_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_date ON public.daily_streaks(date);
CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON public.verses(book, chapter);
CREATE INDEX IF NOT EXISTS idx_verses_category ON public.verses(category);
CREATE INDEX IF NOT EXISTS idx_verses_difficulty ON public.verses(difficulty);

-- Create leaderboard view
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    p.total_xp,
    p.level,
    p.current_streak,
    COUNT(uvp.id) FILTER (WHERE uvp.status = 'mastered') as verses_mastered
FROM public.profiles p
LEFT JOIN public.user_verse_progress uvp ON p.id = uvp.user_id
GROUP BY p.id, p.full_name, p.avatar_url, p.total_xp, p.level, p.current_streak
ORDER BY p.total_xp DESC, p.current_streak DESC;

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_user_verse_progress ON public.user_verse_progress;
CREATE TRIGGER set_updated_at_user_verse_progress
    BEFORE UPDATE ON public.user_verse_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verse_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for verses (public read)
CREATE POLICY "Verses are viewable by everyone"
    ON public.verses FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for user_verse_progress
CREATE POLICY "Users can view their own progress"
    ON public.user_verse_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON public.user_verse_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON public.user_verse_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for practice_sessions
CREATE POLICY "Users can view their own sessions"
    ON public.practice_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON public.practice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Users can view their own achievements"
    ON public.achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
    ON public.achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_streaks
CREATE POLICY "Users can view their own streaks"
    ON public.daily_streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
    ON public.daily_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
    ON public.daily_streaks FOR UPDATE
    USING (auth.uid() = user_id);

-- Insert some sample verses for testing
INSERT INTO public.verses (book, chapter, verse_number, text, translation, category, difficulty) VALUES
('John', 3, 16, 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', 'NIV', 'promise', 2),
('Philippians', 4, 13, 'I can do all this through him who gives me strength.', 'NIV', 'encouragement', 1),
('Proverbs', 3, 5, 'Trust in the Lord with all your heart and lean not on your own understanding;', 'NIV', 'wisdom', 2),
('Jeremiah', 29, 11, 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', 'NIV', 'promise', 3),
('Psalm', 23, 1, 'The Lord is my shepherd, I lack nothing.', 'NIV', 'comfort', 1),
('Romans', 8, 28, 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', 'NIV', 'promise', 3),
('Matthew', 6, 33, 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', 'NIV', 'wisdom', 2),
('Isaiah', 40, 31, 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', 'NIV', 'encouragement', 3)
ON CONFLICT DO NOTHING;
