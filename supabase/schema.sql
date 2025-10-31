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
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '😊')
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
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for verses (public read)
DROP POLICY IF EXISTS "Verses are viewable by everyone" ON public.verses;
CREATE POLICY "Verses are viewable by everyone"
    ON public.verses FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for user_verse_progress
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_verse_progress;
CREATE POLICY "Users can view their own progress"
    ON public.user_verse_progress FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_verse_progress;
CREATE POLICY "Users can insert their own progress"
    ON public.user_verse_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_verse_progress;
CREATE POLICY "Users can update their own progress"
    ON public.user_verse_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for practice_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.practice_sessions;
CREATE POLICY "Users can view their own sessions"
    ON public.practice_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.practice_sessions;
CREATE POLICY "Users can insert their own sessions"
    ON public.practice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.achievements;
CREATE POLICY "Users can view their own achievements"
    ON public.achievements FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.achievements;
CREATE POLICY "Users can insert their own achievements"
    ON public.achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_streaks
DROP POLICY IF EXISTS "Users can view their own streaks" ON public.daily_streaks;
CREATE POLICY "Users can view their own streaks"
    ON public.daily_streaks FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own streaks" ON public.daily_streaks;
CREATE POLICY "Users can insert their own streaks"
    ON public.daily_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own streaks" ON public.daily_streaks;
CREATE POLICY "Users can update their own streaks"
    ON public.daily_streaks FOR UPDATE
    USING (auth.uid() = user_id);

-- Insert sample verses for testing (50 popular Bible verses)
INSERT INTO public.verses (book, chapter, verse_number, text, translation, category, difficulty) VALUES
-- Easy verses (difficulty 1)
('John', 3, 16, 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', 'NIV', 'promise', 1),
('Philippians', 4, 13, 'I can do all this through him who gives me strength.', 'NIV', 'encouragement', 1),
('Psalm', 23, 1, 'The Lord is my shepherd, I lack nothing.', 'NIV', 'comfort', 1),
('John', 14, 6, 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me."', 'NIV', 'truth', 1),
('Psalm', 46, 1, 'God is our refuge and strength, an ever-present help in trouble.', 'NIV', 'comfort', 1),
('Matthew', 11, 28, 'Come to me, all you who are weary and burdened, and I will give you rest.', 'NIV', 'comfort', 1),
('Proverbs', 3, 6, 'In all your ways submit to him, and he will make your paths straight.', 'NIV', 'wisdom', 1),
('Psalm', 118, 24, 'The Lord has done it this very day; let us rejoice today and be glad.', 'NIV', 'joy', 1),
('1 John', 4, 8, 'Whoever does not love does not know God, because God is love.', 'NIV', 'love', 1),
('Joshua', 1, 9, 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', 'NIV', 'encouragement', 1),

-- Medium verses (difficulty 2)
('Proverbs', 3, 5, 'Trust in the Lord with all your heart and lean not on your own understanding;', 'NIV', 'wisdom', 2),
('Matthew', 6, 33, 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', 'NIV', 'wisdom', 2),
('Romans', 12, 2, 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God''s will is—his good, pleasing and perfect will.', 'NIV', 'transformation', 2),
('Galatians', 5, 22, 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness,', 'NIV', 'character', 2),
('Ephesians', 2, 8, 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—', 'NIV', 'salvation', 2),
('2 Corinthians', 5, 17, 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!', 'NIV', 'transformation', 2),
('James', 1, 2, 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds,', 'NIV', 'perseverance', 2),
('1 Corinthians', 10, 13, 'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.', 'NIV', 'strength', 2),
('Hebrews', 11, 1, 'Now faith is confidence in what we hope for and assurance about what we do not see.', 'NIV', 'faith', 2),
('Matthew', 5, 16, 'In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.', 'NIV', 'witness', 2),
('Romans', 5, 8, 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.', 'NIV', 'love', 2),
('Psalm', 119, 105, 'Your word is a lamp for my feet, a light on my path.', 'NIV', 'guidance', 2),
('Colossians', 3, 23, 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters,', 'NIV', 'work', 2),
('Proverbs', 16, 3, 'Commit to the Lord whatever you do, and he will establish your plans.', 'NIV', 'planning', 2),
('1 Peter', 5, 7, 'Cast all your anxiety on him because he cares for you.', 'NIV', 'peace', 2),

-- Hard verses (difficulty 3)
('Jeremiah', 29, 11, 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', 'NIV', 'promise', 3),
('Romans', 8, 28, 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', 'NIV', 'promise', 3),
('Isaiah', 40, 31, 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', 'NIV', 'encouragement', 3),
('Philippians', 4, 6, 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', 'NIV', 'peace', 3),
('2 Timothy', 1, 7, 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', 'NIV', 'courage', 3),
('Isaiah', 41, 10, 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', 'NIV', 'comfort', 3),
('Psalm', 37, 4, 'Take delight in the Lord, and he will give you the desires of your heart.', 'NIV', 'delight', 3),
('Proverbs', 18, 10, 'The name of the Lord is a fortified tower; the righteous run to it and are safe.', 'NIV', 'protection', 3),
('Matthew', 28, 19, 'Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit,', 'NIV', 'mission', 3),
('Hebrews', 12, 2, 'Fixing our eyes on Jesus, the pioneer and perfecter of faith. For the joy set before him he endured the cross, scorning its shame, and sat down at the right hand of the throne of God.', 'NIV', 'perseverance', 3),
('Romans', 8, 38, 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers,', 'NIV', 'assurance', 3),
('1 Thessalonians', 5, 16, 'Rejoice always,', 'NIV', 'joy', 1),
('1 Thessalonians', 5, 17, 'pray continually,', 'NIV', 'prayer', 1),
('1 Thessalonians', 5, 18, 'give thanks in all circumstances; for this is God''s will for you in Christ Jesus.', 'NIV', 'gratitude', 2),
('Micah', 6, 8, 'He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.', 'NIV', 'justice', 3),
('Psalm', 100, 5, 'For the Lord is good and his love endures forever; his faithfulness continues through all generations.', 'NIV', 'praise', 2),
('Matthew', 6, 34, 'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.', 'NIV', 'peace', 2),
('1 John', 1, 9, 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.', 'NIV', 'forgiveness', 2),
('Ephesians', 6, 10, 'Finally, be strong in the Lord and in his mighty power.', 'NIV', 'strength', 2),
('Psalm', 27, 1, 'The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?', 'NIV', 'courage', 2),
('Acts', 1, 8, 'But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.', 'NIV', 'mission', 3),
('Revelation', 21, 4, 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.', 'NIV', 'hope', 3),
('John', 15, 5, 'I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.', 'NIV', 'connection', 3),
('Romans', 6, 23, 'For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.', 'NIV', 'salvation', 2),
('Psalm', 34, 8, 'Taste and see that the Lord is good; blessed is the one who takes refuge in him.', 'NIV', 'goodness', 2),
('Ecclesiastes', 3, 1, 'There is a time for everything, and a season for every activity under the heavens:', 'NIV', 'timing', 2),
('James', 4, 8, 'Come near to God and he will come near to you. Wash your hands, you sinners, and purify your hearts, you double-minded.', 'NIV', 'nearness', 2)
ON CONFLICT DO NOTHING;
