# Story Mode & AI Companion Implementation Strategy

Based on the comprehensive codebase exploration, this document outlines the architecture and implementation approach for Story Mode and AI Companion features in MemoryVerse.

---

## EXECUTIVE SUMMARY

**Status**: Ready to implement - all foundational components exist
**Complexity**: Medium (builds on existing patterns)
**Timeline**: Story Mode (2-3 weeks), AI Companion (3-4 weeks)
**Premium**: Both should be premium features

---

## PART 1: STORY MODE IMPLEMENTATION

### 1.1 Vision

Transform MemoryVerse from a verse-by-verse learning app into a **narrative journey** where users follow biblical stories (Genesis creation, David's journey, Jesus's ministry, Paul's missions, etc.) learning related verses in sequence.

### 1.2 Key Components

#### A. Data Layer

**New Services:**
- `storyModeService.ts` - CRUD operations for stories
- `storyProgressService.ts` - Track user position in stories
- `narrativeContextGenerator.ts` - Generate story-specific context

**New Database Tables:**
```sql
stories                 -- Story metadata
story_verses           -- Verse ordering within stories
user_story_progress    -- User position tracking
story_achievements     -- Story completion badges
```

#### B. UI Components

**New Screens:**
1. **StoriesHomeScreen** - Browse available stories (grid/list)
   - Filters: Testament, theme, difficulty
   - Progress indicators (20 verses of 40)
   - Premium badge for paid stories

2. **StoryDetailScreen** - Story overview before starting
   - Story description
   - Verse count and estimated time
   - Learning objectives
   - Start button

3. **StoryLearningScreen** - Main learning interface
   - Current verse (with context)
   - Progress bar (verse N of M)
   - Navigation (previous/next)
   - Story background information
   - Checkpoints (every 5 verses)

4. **StoryCompletionScreen** - Celebration on story completion
   - XP earned
   - Badge unlocked
   - Statistics (accuracy, time spent)
   - Share button
   - Next story recommendation

**Enhanced Components:**
- `StoryProgressBar` - Visual progress indicator
- `StoryCard` - List/grid item for stories
- `NarrativeContext` - Story-specific contextual sidebar

#### C. Navigation Changes

**Add to RootNavigator:**
```typescript
<Stack.Screen
  name="Stories"
  component={StoriesHomeScreen}
  options={{ title: 'Story Mode' }}
/>
<Stack.Screen
  name="StoryDetail"
  component={StoryDetailScreen}
/>
<Stack.Screen
  name="StoryLearning"
  component={StoryLearningScreen}
/>
<Stack.Screen
  name="StoryCompletion"
  component={StoryCompletionScreen}
/>
```

**Add to Home Screen:**
- Story Mode button (prominent placement)
- "Continue story" shortcut if in progress

#### D. Feature Integration

**With Existing Systems:**
1. **XP System** - Grant bonus XP for story completion (1.5x multiplier)
2. **Achievements** - New achievement categories:
   - Story completions (5, 10, 20)
   - Perfect accuracy in story
   - Speed runs (complete story in X days)
3. **Spaced Repetition** - Integrated with SR algorithm
4. **Analytics** - Track story engagement metrics

#### E. Implementation Checklist

```
PHASE 1: Backend Setup (Week 1)
- [ ] Create database migrations
- [ ] Implement storyModeService
- [ ] Implement storyProgressService
- [ ] Create REST endpoints for story data

PHASE 2: Core UI (Week 1.5)
- [ ] Build StoriesHomeScreen
- [ ] Build StoryDetailScreen
- [ ] Build StoryLearningScreen
- [ ] Create navigation flow

PHASE 3: Polish & Integration (Week 2)
- [ ] Completion screen with stats
- [ ] Achievement system
- [ ] XP bonus logic
- [ ] Analytics tracking

PHASE 4: Testing & Edge Cases (Week 3)
- [ ] Guest mode handling
- [ ] Offline support
- [ ] Premium gating
- [ ] Load testing
```

---

## PART 2: AI COMPANION IMPLEMENTATION

### 2.1 Vision

Create an **AI prayer partner** that:
- Listens to user's concerns/prayers
- Provides biblical guidance and encouragement
- Learns user's prayer patterns
- Offers timely check-ins and reminders
- Maintains persistent conversation history

### 2.2 Key Components

#### A. Data Layer

**New Services:**
- `aiCompanionService.ts` - Companion conversation management
- `companionPromptService.ts` - AI prompt engineering
- `companionInsightsService.ts` - Analyze prayer patterns

**Existing Tables to Use:**
- `prayer_conversations` - Already exists!
- `prayer_messages` - Already exists!
- `prayer_insights` - Already exists!

**New Tables Needed:**
```sql
companion_interactions     -- Track companion touches/check-ins
companion_settings         -- Per-user companion personality/style
companion_insights_summary -- Daily/weekly companion-specific insights
```

#### B. UI Components

**New Screens:**
1. **CompanionChatScreen** - Main chat interface
   - Conversation view (messages stacked)
   - User input box with voice/text options
   - Typing indicators
   - Timestamp grouping
   - Suggestion chips ("Pray about work", "Thank God", etc.)

2. **CompanionInsightsScreen** - Analysis of prayer patterns
   - Weekly summary (themes, sentiment trends)
   - Growth areas identified by AI
   - Scripture recommendations based on prayers
   - Answered prayers tracker

3. **CompanionSettingsScreen** - Personalization
   - Companion personality (gentle, encouraging, direct)
   - Prayer reminders frequency
   - Topics to focus on
   - Notification preferences

**Enhanced Components:**
- `CompanionBubble` - Chat message bubble (styled)
- `CompanionAvatar` - Companion character/icon
- `PrayerSuggestion` - Suggested prayer prompts
- `InsightCard` - Pattern/insight visualization

#### C. Navigation Changes

**Add to RootNavigator:**
```typescript
<Stack.Screen
  name="Companion"
  component={CompanionChatScreen}
  options={{ 
    title: 'Prayer Companion',
    headerRight: () => <InsightButton />
  }}
/>
<Stack.Screen
  name="CompanionInsights"
  component={CompanionInsightsScreen}
/>
<Stack.Screen
  name="CompanionSettings"
  component={CompanionSettingsScreen}
/>
```

**Add to Home Screen:**
- Companion quick-access button
- "Companion has new insights" badge

**Add to Profile:**
- Companion stats section
- Latest companion insight
- Settings link

#### D. AI Integration

**Prompt Strategy:**
```typescript
// System prompt for companion
const COMPANION_SYSTEM_PROMPT = `
You are a compassionate prayer companion in a Bible memorization app.
Your role is to:
1. Listen empathetically to user's prayers and concerns
2. Respond with biblical encouragement and relevant Scripture references
3. Suggest related verses to meditate on
4. Help users develop deeper prayer habits
5. Celebrate their spiritual growth

Personality: Warm, encouraging, faithful. Reference the Bible naturally.
Never be preachy - be conversational and genuine.
`;

// User context added to each request
{
  userId: "...",
  prayerHistory: [...],  // Last 5 prayers
  preferences: "...",    // User's selected topics
  streak: 7,            // Current habit streak
  conversationHistory: [...], // Recent chat
}
```

**API Calls:**
- Use existing `contextGenerator` pattern
- Perplexity or OpenAI for chat responses
- Rate limiting: 5 messages/day for free, unlimited for premium

#### E. Feature Integration

**With Existing Systems:**
1. **Prayer Training Screen** - Add "Chat with Companion" option
2. **Notifications** - Daily companion check-in prompts
3. **Insights** - `prayer_insights` table stores companion analysis
4. **Analytics** - Track engagement metrics
5. **Leaderboard** - Optional: "Most Prayerful" stats

#### F. Implementation Checklist

```
PHASE 1: AI Backend (Week 1)
- [ ] Set up companion prompt engineering
- [ ] Implement API call patterns (Perplexity/OpenAI)
- [ ] Create message validation & safety filters
- [ ] Set up usage rate limiting

PHASE 2: Core UI (Week 1.5)
- [ ] Build CompanionChatScreen
- [ ] Implement message sending/receiving
- [ ] Add typing indicators and animations
- [ ] Create voice input integration

PHASE 3: Insights & Analysis (Week 2)
- [ ] Implement sentiment analysis
- [ ] Build pattern detection
- [ ] Create InsightsScreen
- [ ] Add AI-generated recommendations

PHASE 4: Polish & Safety (Week 3)
- [ ] User safety filters (no medical advice, etc.)
- [ ] Conversation quality improvements
- [ ] Edge case handling
- [ ] Premium feature gating
- [ ] Testing and refinement
```

---

## PART 3: ARCHITECTURE PATTERNS TO FOLLOW

### 3.1 Service Layer Pattern

Both features should follow the established service pattern:

```typescript
// storyModeService.ts
class StoryModeService {
  async getStories(options?: FilterOptions): Promise<Story[]> { }
  async getStory(storyId: string): Promise<Story | null> { }
  async getUserProgress(userId: string, storyId: string): Promise<StoryProgress> { }
  async updateProgress(userId: string, storyId: string, verseIndex: number): Promise<void> { }
  async completeStory(userId: string, storyId: string): Promise<StoryCompletion> { }
}

export const storyModeService = new StoryModeService();
```

### 3.2 Feature Flag Integration

**Add to featureFlags.ts:**
```typescript
storyMode: {
  enabled: true,
  premium: false,  // Or true if making premium-only
  description: 'Guided narrative Scripture learning',
  version: 'v1.5',
},

aiCompanion: {
  enabled: true,
  premium: true,  // Premium feature
  description: 'AI-powered prayer companion',
  version: 'v2.0',
},
```

### 3.3 Premium Feature Gating

**Use existing pattern:**
```typescript
const { guardAction, PromptComponent } = useGuestProtection();
const isPremium = useHasPremium();
const canUseCompanion = useFeatureFlag('aiCompanion');

const handleOpenCompanion = async () => {
  if (await guardAction('ai_companion')) return;  // Not authenticated
  if (!canUseCompanion) return;  // Feature disabled
  if (!isPremium) return <PremiumPrompt />;  // Not premium
  
  navigation.navigate('Companion');
};
```

### 3.4 State Management

**For Story Mode:**
```typescript
// Local state (in component)
const [currentStory, setCurrentStory] = useState<Story | null>(null);
const [userProgress, setUserProgress] = useState<StoryProgress | null>(null);
const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

// Load on mount
useEffect(() => {
  loadStory();
}, [storyId]);

// Use context for auth
const { user, profile } = useAuth();
```

**For AI Companion:**
```typescript
// Consider adding CompanionContext for shared state
// to avoid prop drilling through multiple screens
const CompanionContext = createContext<CompanionContextType>(null);

// Stores:
// - conversation history
// - current chat state
// - insights summary
// - user preferences
```

---

## PART 4: DATABASE SCHEMA ADDITIONS

### Story Mode Tables

```sql
-- Stories metadata
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  book_of_bible TEXT,  -- "Genesis", "Acts", etc.
  testament TEXT,       -- "Old Testament", "New Testament"
  theme TEXT,           -- "Creation", "Redemption", "Mission", etc.
  difficulty INT DEFAULT 2,  -- 1-5 scale
  estimated_duration_hours INT,
  is_published BOOLEAN DEFAULT false,
  order_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stories to verses junction
CREATE TABLE story_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  verse_id UUID NOT NULL REFERENCES verses(id),
  order_in_story INT NOT NULL,
  narrative_context TEXT,  -- Story-specific context
  learning_objective TEXT, -- What user should learn
  checkpoint BOOLEAN DEFAULT false,  -- Every 5 verses
  created_at TIMESTAMP DEFAULT NOW()
);

-- User story progress
CREATE TABLE user_story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_verse_index INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_xp_earned INT DEFAULT 0,
  accuracy_percentage FLOAT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- Story completion achievements
CREATE TABLE story_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  achievement_type TEXT,  -- "completion", "perfect_accuracy", "speedrun"
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, story_id, achievement_type)
);
```

### AI Companion Tables

```sql
-- Companion interaction tracking
CREATE TABLE companion_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT,  -- "chat", "check_in", "insight_viewed"
  context JSONB,  -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);

-- User companion preferences
CREATE TABLE companion_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality TEXT DEFAULT 'warm',  -- "warm", "direct", "gentle"
  prayer_focus_topics TEXT[],  -- ["family", "work", "health"]
  check_in_frequency TEXT DEFAULT 'daily',  -- "daily", "weekly", "off"
  preferred_scripture_themes TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Companion conversation summaries
CREATE TABLE companion_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_period TEXT,  -- "daily", "weekly", "monthly"
  summary_date DATE,
  key_themes TEXT[],
  sentiment_trend TEXT,  -- "improving", "stable", "declining"
  ai_generated_summary TEXT,
  recommended_verses UUID[],  -- Array of verse IDs
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Enable RLS on New Tables

```sql
-- Story Mode RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_story_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_achievements ENABLE ROW LEVEL SECURITY;

-- Public can read stories
CREATE POLICY "Stories are public" ON stories
  FOR SELECT USING (is_published = true);

-- Users can only see their own progress
CREATE POLICY "Users see own story progress" ON user_story_progress
  FOR SELECT USING (auth.uid() = user_id);

-- AI Companion RLS
ALTER TABLE companion_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own companion data" ON companion_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users see own companion settings" ON companion_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users see own companion summaries" ON companion_summaries
  FOR SELECT USING (auth.uid() = user_id);
```

---

## PART 5: ANALYTICS & TRACKING

### Story Mode Metrics

```typescript
// analyticsService extensions
analyticsService.logStoryStarted(storyId, storyTitle);
analyticsService.logStoryProgress(storyId, verseIndex, totalVerses);
analyticsService.logStoryCompleted(storyId, duration, accuracy, xpEarned);
analyticsService.logStoryAchievementEarned(achievementType, storyId);
```

### AI Companion Metrics

```typescript
analyticsService.logCompanionChatMessage(role, characterCount);
analyticsService.logCompanionInsightViewed(insightType);
analyticsService.logCompanionCheckInResponse(hasResponded);
analyticsService.logCompanionEngagementScore(score);
```

---

## PART 6: TESTING STRATEGY

### Story Mode Tests
- [ ] Story loading and verse ordering
- [ ] Progress persistence across sessions
- [ ] XP and achievement calculations
- [ ] Premium feature gating
- [ ] Guest mode limitations
- [ ] Spaced repetition integration

### AI Companion Tests
- [ ] Message sending and receiving
- [ ] API rate limiting
- [ ] Conversation history retrieval
- [ ] Sentiment analysis accuracy
- [ ] Safety filter effectiveness
- [ ] Premium feature restrictions

---

## PART 7: ROLLOUT STRATEGY

### Phased Release

**Week 1: Beta Testing**
- Internal team testing
- Fix critical bugs
- Gather feedback

**Week 2: Limited Release**
- Release to 10% of users
- Monitor stability
- Collect usage data

**Week 3: Full Release**
- Roll out to all users
- Monitor performance
- Iterate based on feedback

---

## PART 8: QUICK START CHECKLIST

Before starting implementation:

- [ ] Read `CODEBASE_EXPLORATION.md` - Understand current architecture
- [ ] Read `CODE_PATTERNS_REFERENCE.md` - Learn established patterns
- [ ] Review `featureFlags.ts` - Understand feature gating
- [ ] Review `usageLimitsService.ts` - Understand rate limiting
- [ ] Review `prayerCoachingService.ts` - Reference for AI patterns
- [ ] Review `verseCollectionsService.ts` - Reference for collection management
- [ ] Review `spacedRepetitionService.ts` - Understand SR algorithm
- [ ] Plan database migrations
- [ ] Design UI mockups
- [ ] Plan API integrations

---

## PART 9: RELATED EXISTING CODE

**Reference these when implementing:**

Story Mode:
- `src/services/verseCollectionsService.ts` - Similar organization
- `src/screens/FavoritesScreen.tsx` - Collection browsing pattern
- `src/services/spacedRepetitionService.ts` - Learning algorithm
- `src/services/achievementService.ts` - Achievement system

AI Companion:
- `src/services/contextGenerator.ts` - AI API pattern
- `src/services/dailyPrayerService.ts` - Prayer generation
- `src/services/enhancedPrayerCoachingService.ts` - Coaching patterns
- `src/services/prayerInputValidator.ts` - Input validation
- `src/services/prayerOutputValidator.ts` - Safety filtering

---

## CONCLUSION

Both Story Mode and AI Companion are achievable with the existing architecture. The codebase has:
- ✅ Strong foundation (authentication, premium features, animations)
- ✅ Appropriate patterns (services, contexts, feature flags)
- ✅ Database schema ready (prayer tables exist)
- ✅ AI integration framework (Perplexity API already integrated)

**Next Steps:**
1. Get stakeholder approval for specs
2. Create detailed UI mockups
3. Create database migrations
4. Begin Story Mode implementation (less complex)
5. Build AI Companion features
6. Integrate, test, and refine
7. Soft launch and gather feedback

