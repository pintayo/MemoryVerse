-- =============================================
-- Migration 008: Premium Features (v1.2)
-- =============================================
-- Adds database support for:
-- - Custom verse collections
-- - Enhanced prayer coaching (conversation history)
-- - Advanced analytics
-- - Multiple Bible translations
-- - Export logs
-- =============================================

-- =============================================
-- 1. CUSTOM VERSE COLLECTIONS
-- =============================================

-- Verse collections table
CREATE TABLE IF NOT EXISTS verse_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📖',
  color TEXT DEFAULT '#8B7355',
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT verse_collections_name_length CHECK (char_length(name) <= 100),
  CONSTRAINT verse_collections_description_length CHECK (char_length(description) <= 500)
);

-- Collection items (verses in collections)
CREATE TABLE IF NOT EXISTS verse_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES verse_collections(id) ON DELETE CASCADE,
  verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(collection_id, verse_id)
);

-- Collection sharing
CREATE TABLE IF NOT EXISTS verse_collection_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES verse_collections(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  share_link_code TEXT UNIQUE,
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for collections
CREATE INDEX IF NOT EXISTS idx_verse_collections_user_id ON verse_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_verse_collections_is_public ON verse_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_verse_collections_is_featured ON verse_collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_verse_collection_items_collection_id ON verse_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_verse_collection_items_verse_id ON verse_collection_items(verse_id);
CREATE INDEX IF NOT EXISTS idx_verse_collection_shares_collection_id ON verse_collection_shares(collection_id);

-- RLS Policies for collections
ALTER TABLE verse_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_collection_shares ENABLE ROW LEVEL SECURITY;

-- Users can view their own collections or public ones
CREATE POLICY "Users can view their own collections"
  ON verse_collections FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Users can insert their own collections
CREATE POLICY "Users can create collections"
  ON verse_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own collections
CREATE POLICY "Users can update their own collections"
  ON verse_collections FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete their own collections"
  ON verse_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Collection items policies
CREATE POLICY "Users can view collection items"
  ON verse_collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM verse_collections
      WHERE verse_collections.id = verse_collection_items.collection_id
      AND (verse_collections.user_id = auth.uid() OR verse_collections.is_public = true)
    )
  );

CREATE POLICY "Users can manage their collection items"
  ON verse_collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM verse_collections
      WHERE verse_collections.id = verse_collection_items.collection_id
      AND verse_collections.user_id = auth.uid()
    )
  );

-- =============================================
-- 2. ENHANCED PRAYER COACHING
-- =============================================

-- Prayer conversation history
CREATE TABLE IF NOT EXISTS prayer_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Prayer Session',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS prayer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES prayer_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'grateful', 'hopeful', 'worried')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT prayer_messages_content_length CHECK (char_length(content) <= 5000)
);

-- Prayer insights (AI-generated summaries and trends)
CREATE TABLE IF NOT EXISTS prayer_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('weekly_summary', 'monthly_summary', 'theme', 'growth_area', 'answered_prayer')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT prayer_insights_title_length CHECK (char_length(title) <= 200)
);

-- Indexes for prayer features
CREATE INDEX IF NOT EXISTS idx_prayer_conversations_user_id ON prayer_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_messages_conversation_id ON prayer_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_prayer_messages_user_id ON prayer_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_insights_user_id ON prayer_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_insights_created_at ON prayer_insights(created_at DESC);

-- RLS Policies for prayer features
ALTER TABLE prayer_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prayer conversations"
  ON prayer_conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own prayer messages"
  ON prayer_messages FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own prayer insights"
  ON prayer_insights FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 3. MULTIPLE BIBLE TRANSLATIONS
-- =============================================

-- Bible translations metadata
CREATE TABLE IF NOT EXISTS bible_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- ESV, NIV, KJV, etc.
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  year INTEGER,
  publisher TEXT,
  description TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verses by translation (allows multiple translations)
CREATE TABLE IF NOT EXISTS verses_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  translation_id UUID NOT NULL REFERENCES bible_translations(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(verse_id, translation_id),
  CONSTRAINT verses_translations_text_length CHECK (char_length(text) <= 2000)
);

-- Indexes for translations
CREATE INDEX IF NOT EXISTS idx_bible_translations_code ON bible_translations(code);
CREATE INDEX IF NOT EXISTS idx_bible_translations_is_premium ON bible_translations(is_premium);
CREATE INDEX IF NOT EXISTS idx_verses_translations_verse_id ON verses_translations(verse_id);
CREATE INDEX IF NOT EXISTS idx_verses_translations_translation_id ON verses_translations(translation_id);

-- RLS Policies for translations
ALTER TABLE bible_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verses_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active translations"
  ON bible_translations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view verse translations"
  ON verses_translations FOR SELECT
  USING (true);

-- Insert default translations
INSERT INTO bible_translations (code, name, full_name, year, publisher, is_premium, is_active, sort_order) VALUES
  ('ESV', 'ESV', 'English Standard Version', 2001, 'Crossway', false, true, 1),
  ('NIV', 'NIV', 'New International Version', 2011, 'Biblica', true, false, 2),
  ('KJV', 'KJV', 'King James Version', 1611, 'Public Domain', true, false, 3),
  ('NLT', 'NLT', 'New Living Translation', 2015, 'Tyndale House', true, false, 4),
  ('NASB', 'NASB', 'New American Standard Bible', 2020, 'Lockman Foundation', true, false, 5),
  ('NKJV', 'NKJV', 'New King James Version', 1982, 'Thomas Nelson', true, false, 6)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 4. ADVANCED ANALYTICS
-- =============================================

-- Advanced analytics aggregations
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_verses_memorized INTEGER DEFAULT 0,
  verses_practiced_today INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0,
  average_session_duration INTEGER DEFAULT 0, -- in seconds
  total_practice_time INTEGER DEFAULT 0, -- in seconds
  streak_count INTEGER DEFAULT 0,
  xp_earned_today INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, snapshot_date)
);

-- Learning velocity tracking
CREATE TABLE IF NOT EXISTS learning_velocity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  verses_learned INTEGER DEFAULT 0,
  practice_sessions INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  total_practice_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, week_start_date)
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_id ON analytics_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_learning_velocity_user_id ON learning_velocity(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_velocity_week ON learning_velocity(week_start_date DESC);

-- RLS Policies for analytics
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_velocity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics snapshots"
  ON analytics_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own learning velocity"
  ON learning_velocity FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- 5. EXPORT LOGS
-- =============================================

-- Track export requests for analytics and rate limiting
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'csv', 'json')),
  export_scope TEXT NOT NULL CHECK (export_scope IN ('progress', 'analytics', 'notes', 'full')),
  file_size_kb INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for export logs
CREATE INDEX IF NOT EXISTS idx_export_logs_user_id ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_created_at ON export_logs(created_at DESC);

-- RLS Policy for export logs
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export logs"
  ON export_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create export logs"
  ON export_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 6. FUNCTIONS FOR PREMIUM FEATURES
-- =============================================

-- Function to get user's verse collections with stats
CREATE OR REPLACE FUNCTION get_user_collections_with_stats(p_user_id UUID)
RETURNS TABLE (
  collection_id UUID,
  name TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  verse_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vc.id,
    vc.name,
    vc.description,
    vc.icon,
    vc.color,
    COUNT(vci.id) as verse_count,
    vc.created_at
  FROM verse_collections vc
  LEFT JOIN verse_collection_items vci ON vci.collection_id = vc.id
  WHERE vc.user_id = p_user_id
  GROUP BY vc.id, vc.name, vc.description, vc.icon, vc.color, vc.created_at
  ORDER BY vc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get advanced analytics summary
CREATE OR REPLACE FUNCTION get_advanced_analytics_summary(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_practice_time INTEGER,
  average_accuracy DECIMAL,
  verses_memorized INTEGER,
  practice_sessions INTEGER,
  best_day DATE,
  improvement_rate DECIMAL
) AS $$
DECLARE
  v_start_date DATE := CURRENT_DATE - p_days;
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(total_practice_time), 0)::INTEGER as total_practice_time,
    COALESCE(AVG(accuracy_rate), 0)::DECIMAL as average_accuracy,
    COALESCE(SUM(verses_practiced_today), 0)::INTEGER as verses_memorized,
    COUNT(*)::INTEGER as practice_sessions,
    COALESCE((SELECT snapshot_date FROM analytics_snapshots
              WHERE user_id = p_user_id
              ORDER BY verses_practiced_today DESC LIMIT 1), CURRENT_DATE) as best_day,
    CASE
      WHEN COUNT(*) > 1 THEN
        ((MAX(accuracy_rate) - MIN(accuracy_rate)) / NULLIF(MIN(accuracy_rate), 0) * 100)::DECIMAL
      ELSE 0
    END as improvement_rate
  FROM analytics_snapshots
  WHERE user_id = p_user_id
    AND snapshot_date >= v_start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate daily analytics snapshot
CREATE OR REPLACE FUNCTION generate_daily_analytics_snapshot(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_today DATE := CURRENT_DATE;
  v_verses_today INTEGER;
  v_accuracy DECIMAL;
  v_session_duration INTEGER;
  v_total_time INTEGER;
  v_xp_today INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  -- Calculate today's stats
  SELECT
    COUNT(DISTINCT verse_id),
    COALESCE(AVG(accuracy_percentage), 0),
    COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))), 0),
    COALESCE(SUM(EXTRACT(EPOCH FROM (completed_at - started_at))), 0),
    COALESCE(SUM(xp_earned), 0)
  INTO v_verses_today, v_accuracy, v_session_duration, v_total_time, v_xp_today
  FROM practice_sessions
  WHERE user_id = p_user_id
    AND DATE(completed_at) = v_today;

  -- Insert or update snapshot
  INSERT INTO analytics_snapshots (
    user_id,
    snapshot_date,
    total_verses_memorized,
    verses_practiced_today,
    accuracy_rate,
    average_session_duration,
    total_practice_time,
    streak_count,
    xp_earned_today,
    level
  ) VALUES (
    p_user_id,
    v_today,
    COALESCE((SELECT COUNT(*) FROM user_verse_progress WHERE user_id = p_user_id), 0),
    COALESCE(v_verses_today, 0),
    COALESCE(v_accuracy, 0),
    COALESCE(v_session_duration, 0),
    COALESCE(v_total_time, 0),
    COALESCE(v_profile.current_streak, 0),
    COALESCE(v_xp_today, 0),
    COALESCE(v_profile.level, 1)
  )
  ON CONFLICT (user_id, snapshot_date)
  DO UPDATE SET
    total_verses_memorized = EXCLUDED.total_verses_memorized,
    verses_practiced_today = EXCLUDED.verses_practiced_today,
    accuracy_rate = EXCLUDED.accuracy_rate,
    average_session_duration = EXCLUDED.average_session_duration,
    total_practice_time = EXCLUDED.total_practice_time,
    streak_count = EXCLUDED.streak_count,
    xp_earned_today = EXCLUDED.xp_earned_today,
    level = EXCLUDED.level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. UPDATE EXISTING TABLES
-- =============================================

-- Add preferred translation to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'preferred_translation_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_translation_id UUID REFERENCES bible_translations(id);
  END IF;
END $$;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMENT ON TABLE verse_collections IS 'User-created custom verse collections (Premium feature)';
COMMENT ON TABLE prayer_conversations IS 'Enhanced prayer coaching conversation history (Premium feature)';
COMMENT ON TABLE bible_translations IS 'Available Bible translations (Premium feature)';
COMMENT ON TABLE analytics_snapshots IS 'Daily analytics snapshots for advanced dashboard (Premium feature)';
COMMENT ON TABLE export_logs IS 'Track user export requests (Premium feature)';
