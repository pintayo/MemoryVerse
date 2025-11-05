# 📖 MemoryVerse - Complete Project Status

**Last Updated**: 2025-11-05
**Current Version**: Beta (Pre-Production)
**Production Readiness**: ~85%

---

## 🎯 Project Overview

MemoryVerse is a mobile Bible verse memorization app built with React Native/Expo. It uses gamification (XP, levels, streaks), AI-powered contextual explanations, and spaced repetition to help users memorize Scripture effectively.

### Tech Stack
- **Frontend**: React Native (TypeScript) + Expo
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Perplexity API (with fallback to OpenAI/Anthropic)
- **State Management**: React Context + Local State
- **Navigation**: React Navigation (Stack Navigator)
- **Styling**: Custom theme system (warm parchment aesthetic)

---

## ✅ IMPLEMENTED FEATURES (Current)

### 🔐 Authentication & User Management
- **Email/Password Authentication** via Supabase Auth
- **User Profiles** with customizable avatars and display names
- **Profile Editing** screen with bio, avatar selection
- **Session Management** with automatic token refresh
- **Password Reset** flow (email-based)

**Files**:
- `src/screens/LoginScreen.tsx`
- `src/screens/SignUpScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/contexts/AuthContext.tsx`

---

### 📚 Verse Learning System

#### Verse Card View (Understanding Mode)
**Location**: `src/screens/VerseCardScreen.tsx`

Features:
- **Swipeable Flashcards** with flip animation (verse front, reference back)
- **AI Context Generation** (auto-generates when verse loads)
  - Shows historical context, cultural background, theological meaning
  - Saves to database for future reference
  - Uses Perplexity API with fallback to OpenAI/Anthropic
- **Show Context Button** toggles between verse and context view
- **Progress Tracking** for each verse (familiarity levels)
- **Verse Navigation** with left/right arrow buttons
- **Bible Verse Picker** (Bible icon in header)
  - Book → Chapter → Verse selection flow
  - Random verse button
  - Scrollable grid layout
- **Increased verse display** to 15 lines (from 10)

Technical Details:
- Context generation uses `useRef` to track which verses already have context (prevents duplicates)
- Auto-generates context when verse changes: `useEffect(() => { generateContextForCurrentVerse(); }, [currentVerseIndex, verses.length]);`
- Context saved to `verse_context` table in Supabase
- Flip animation using `Animated.spring()`

Known Issues Fixed:
- ✅ Context generation was broken (fixed by restoring `verses.length` dependency)
- ✅ Context view stuck after pressing "Next" (fixed by resetting `showContext` state)

---

#### Practice Mode (Recall)
**Location**: `src/screens/RecallScreen.tsx`

Features:
- **5 Verses Per Lesson** (configurable in `practiceConfig.ts`)
- **Fill-in-the-Blank** format with blanked-out words
- **Speech Input** for answers (using Expo Speech Recognition)
- **Text Input** as fallback
- **Real-time Feedback** (correct/incorrect/partial)
- **Answer Reveal**
  - "Give Answer" button shows full verse
  - Wrong answers automatically reveal correct verse
- **XP System** with accuracy-based rewards:
  - Perfect (100%): 20 XP
  - Good (80-99%): 15 XP
  - Okay (60-79%): 10 XP
  - Poor (<60%): 5 XP
  - Gave Up: 0 XP
- **Lesson Complete Modal** shows:
  - Score (X/5 with percentage)
  - XP earned this lesson
  - Animated XP progress bar
  - Current level and XP to next level
  - Gold star for perfect score, checkmark otherwise
  - Spring animation entrance

Technical Details:
- Always loads 5 random verses: `practiceConfig.versesPerLesson`
- Blanks out 30-50% of words in verse
- Speech recognition with timeout and error handling
- XP calculation:
  ```typescript
  const accuracy = correctWords / totalWords;
  if (accuracy === 1.0) xpEarned = 20;
  else if (accuracy >= 0.8) xpEarned = 15;
  else if (accuracy >= 0.6) xpEarned = 10;
  else if (accuracy >= 0.4) xpEarned = 5;
  ```
- Updates `user_verse_progress` table with accuracy
- Updates user profile with new XP and level

Known Issues Fixed:
- ✅ Was showing 1/1 verse instead of 5 (fixed by removing `verseId` check)
- ✅ Wrong answers didn't reveal verse (fixed by showing verse when `feedback === 'incorrect'`)
- ✅ XP display showing "450/100" (fixed by calculating XP within current level)

---

### 📊 Leveling & XP System

**Formula**:
- Level = `floor(sqrt(totalXP / 100)) + 1`
- XP for current level = `(currentLevel - 1)² × 100`
- XP for next level = `(currentLevel)² × 100`
- XP needed for level = `xpForNextLevel - xpForCurrentLevel`
- Current XP in level = `totalXP - xpForCurrentLevel`

**Example**:
- Total XP: 450
- Current Level: 3 (because `sqrt(450/100) + 1 = 3.12...`)
- XP for Level 3: `(3-1)² × 100 = 400`
- XP for Level 4: `(4-1)² × 100 = 900`
- XP in current level: `450 - 400 = 50`
- XP needed for next level: `900 - 400 = 500`
- Display: "Level 3 | 50/500 XP"

**XP Sources**:
- Practice lessons (5-20 XP per verse)
- Daily login bonus (+10 XP)
- Streak maintenance (+5 XP per day)

**Files**:
- `src/services/profile.ts` (level calculation)
- `src/components/LessonCompleteModal.tsx` (XP display)

---

### 🎯 Practice Configuration

**Location**: `src/config/practiceConfig.ts`

```typescript
export const practiceConfig = {
  versesPerLesson: 5,
  xp: {
    perfect: 20,    // 100% accuracy
    good: 15,       // 80-99% accuracy
    okay: 10,       // 60-79% accuracy
    poor: 5,        // <60% accuracy
    gaveUp: 0,      // Used "Give Answer"
  },
};
```

---

### 🎨 UI Components

#### Theme System
**Location**: `src/theme.ts`

Color Palette:
- **Primary**: Sage green, oatmeal, cream
- **Secondary**: Light gold, warm terracotta
- **Background**: Off-white parchment, warm parchment
- **Text**: Charcoal, warm brown, muted text
- **Accent**: Gold, soft rose, muted olive

Typography:
- **Scripture Font**: Georgia (serif)
- **UI Font**: System default (sans-serif)
- **Sizes**: xs(10), sm(12), md(14), lg(16), xl(18), xxl(24), xxxl(32)

Spacing:
- xs(4), sm(8), md(12), lg(16), xl(24), xxl(32), xxxl(48)

Border Radius:
- sm(4), md(8), lg(12), xl(16), full(9999)

Shadows:
- sm, md, lg, xl (with warm shadow colors)

---

#### Custom Components

**Button** (`src/components/Button.tsx`)
- Primary, secondary, outline variants
- Loading state with spinner
- Disabled state
- Custom icon support

**Card** (`src/components/Card.tsx`)
- Elevated style with shadow
- Warm parchment background
- Rounded corners

**Input** (`src/components/Input.tsx`)
- Text input with label
- Error state
- Secure text entry
- Icon support

**VerseText** (`src/components/VerseText.tsx`)
- Formatted Scripture display
- Georgia serif font
- Proper line height

**VerseReference** (`src/components/VerseReference.tsx`)
- Formatted reference (Book Chapter:Verse)
- Gold color accent

**LessonCompleteModal** (`src/components/LessonCompleteModal.tsx`)
- Score display with percentage
- XP earned badge
- Animated progress bar (1.5s timing animation)
- Level display
- Spring animation entrance
- Gold star for perfect, checkmark otherwise

**BibleVersePicker** (`src/components/BibleVersePicker.tsx`)
- Multi-step modal (Books → Chapters → Verses)
- Loads unique books/chapters from database
- Grid layout for books (2 columns)
- Grid layout for chapters (5 columns)
- List layout for verses
- Random verse button with shuffle icon
- Back navigation between steps
- "Explain All Verses in [Book] [Chapter]" button (when `onChapterSelect` provided)
- Slide-up animation

---

### 🗄️ Database Schema

**Supabase Tables**:

#### `profiles`
```sql
- id (uuid, FK to auth.users)
- email (text)
- username (text, unique)
- display_name (text)
- avatar_url (text)
- bio (text)
- level (integer, default 1)
- total_xp (integer, default 0)
- streak_count (integer, default 0)
- last_practice_date (date)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `verses`
```sql
- id (uuid, PK)
- book (text)
- chapter (integer)
- verse_number (integer)
- text (text)
- translation (text, default 'NIV')
- created_at (timestamp)
```

#### `verse_context`
```sql
- id (uuid, PK)
- verse_id (uuid, FK to verses)
- context_text (text)
- generated_at (timestamp)
- model_used (text) -- e.g., 'perplexity', 'openai', 'anthropic'
```

#### `user_verse_progress`
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- verse_id (uuid, FK to verses)
- familiarity_level (integer, 0-5)
- times_practiced (integer)
- last_practiced (timestamp)
- accuracy (numeric) -- 0.0 to 1.0
- created_at (timestamp)
- UNIQUE(user_id, verse_id)
```

#### `learning_sessions`
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- verse_id (uuid, FK to verses)
- session_type (text) -- 'learn', 'practice', 'review'
- accuracy (numeric)
- time_spent (integer) -- seconds
- completed (boolean)
- created_at (timestamp)
```

**RLS Policies**: All tables have Row Level Security enabled
- Users can only read/write their own data
- Verses table is read-only for all authenticated users
- Profiles table allows users to update their own profile

---

### 🔊 Speech Recognition

**Location**: `src/screens/RecallScreen.tsx`

Features:
- Uses Expo Speech Recognition API
- Visual feedback with waveform animation
- Timeout after 10 seconds
- Error handling with fallback to text input
- Automatic result processing

Known Issues:
- Speech recognition errors frequently (needs investigation)
- May need to switch to different service (Google Speech API?)

---

### 🏆 Gamification Elements

#### Implemented
- **XP System** (earn XP from practice, login, streaks)
- **Leveling System** (visual level display)
- **Streak Tracking** (consecutive days of practice)
- **Accuracy Tracking** (per verse and overall)
- **Progress Visualization** (animated XP bar)

#### Not Yet Implemented
- Achievements/badges
- Leaderboards
- Daily challenges
- Rewards shop

---

### 🙏 Prayer Mode

**Location**: `src/screens/PrayScreen.tsx`

Features:
- Dedicated prayer screen
- Prayer list management
- Integration with verse learning (pray about verses)

Status: Basic implementation, needs enhancement

---

### 📱 Navigation Structure

**Main Navigation** (Tab Navigator):
- **Learn** (Home) - VerseCardScreen
- **Practice** - RecallScreen
- **Pray** - PrayScreen
- **Profile** - ProfileScreen
- **Understanding** - UnderstandScreen (AI context/explanations)

**Stack Navigator**:
- Auth Stack: Login, SignUp
- Main Stack: All main screens

---

### 🤖 AI Integration

**Primary Provider**: Perplexity API
- Model: `sonar` (default) or `sonar-pro`
- Used for context generation
- Fast and cost-effective

**Fallback Providers**:
1. OpenAI GPT-4
2. Anthropic Claude

**Context Generation Prompt**:
```
Provide a brief, insightful context for this Bible verse:

[Book Chapter:Verse]
"[verse text]"

Include:
1. Historical/cultural context (2-3 sentences)
2. Theological significance (2-3 sentences)
3. Practical application (1-2 sentences)

Keep it concise, clear, and accessible.
```

**Files**:
- `src/services/ai/contextGenerator.ts`
- `src/services/ai/perplexity.ts`
- `src/services/ai/openai.ts`
- `src/services/ai/anthropic.ts`

---

### 📝 Logging System

**Location**: `src/utils/logger.ts`

Features:
- Conditional logging (dev vs production)
- Colored console output in dev
- Error tracking integration points (Sentry ready)
- Log levels: log, warn, error, info, debug

Production behavior:
- Silences regular logs
- Only shows errors
- Sends errors to tracking service (when configured)

---

### 🎭 Error Handling

**ErrorBoundary** (`src/components/ErrorBoundary.tsx`)
- Catches React component errors
- Shows friendly error screen
- Logs errors for debugging

**Service-level Error Handling**:
- Try-catch blocks in all async operations
- User-friendly error messages
- Automatic retry for network errors
- Fallback behaviors (e.g., AI provider fallback)

---

## 🎨 Design Philosophy

**Visual Theme**: Warm, parchment-like, approachable
- Inspired by ancient manuscripts
- Warm earth tones (sage, oatmeal, gold)
- Soft shadows and rounded corners
- High readability with proper contrast

**User Experience**:
- Minimal taps to core functionality
- Clear visual feedback for all actions
- Loading states for async operations
- Smooth animations (spring, timing)
- Gesture support (swipe, flip)

**Accessibility**:
- Proper font sizes
- Sufficient color contrast
- Screen reader support (needs enhancement)
- Haptic feedback (needs implementation)

---

## 🔧 Development Setup

**Prerequisites**:
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

**Environment Variables** (`.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_key
EXPO_PUBLIC_PERPLEXITY_MODEL=sonar
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key (optional)
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key (optional)
```

**Installation**:
```bash
npm install
npx expo start
```

**Running**:
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Web (limited support)
npx expo start --web
```

---

## 📋 WISHLIST FEATURES (Planned)

### 🔖 High Priority

#### 1. Verse Bookmarking
**Description**: Allow users to bookmark/favorite verses for quick access

Features:
- Bookmark button on verse card
- "My Bookmarks" section in profile or dedicated tab
- Quick access to bookmarked verses
- Sort by date added, book order, or custom
- Sync across devices

Database:
```sql
-- New table
bookmarked_verses (
  id uuid PK,
  user_id uuid FK,
  verse_id uuid FK,
  notes text,
  created_at timestamp,
  UNIQUE(user_id, verse_id)
)
```

UI:
- Heart/bookmark icon on verse cards
- Filled when bookmarked, outline when not
- Toast notification on bookmark

---

#### 2. Bible Chat Buddy Integration
**Description**: Interactive AI companion to discuss verses and theology

Features:
- Chat interface on Understanding screen
- Ask questions about current verse
- Theological discussions
- Personalized explanations
- Context-aware responses

Example Use Cases:
- "What does this verse mean for me today?"
- "How does this relate to [another verse]?"
- "Can you explain this in simpler terms?"
- "What's the original Greek/Hebrew word here?"

Technical:
- Use Claude or GPT-4 for conversations
- Maintain conversation history (5-10 messages)
- Context includes current verse, user's learning history
- Save interesting Q&A for future reference

UI:
- Chat icon/button on Understanding screen
- Modal or slide-up chat interface
- Message bubbles (user vs AI)
- Quick prompt suggestions

Files to Create:
- `src/components/BibleChatBuddy.tsx`
- `src/services/ai/chatService.ts`
- `src/screens/ChatScreen.tsx` (optional dedicated screen)

---

#### 3. Chapter Selection for Bulk Explanations
**Description**: Select entire chapter and choose which verses to explain

Status: Partially implemented (UI button exists, functionality pending)

Features:
- "Explain All Verses in [Book] [Chapter]" button in verse picker
- Opens checklist of all verses in chapter
- Select multiple verses
- Generate context for all selected verses (batch operation)
- Show progress indicator during generation
- Save all to database

Technical:
- Batch AI requests (5-10 at a time to avoid rate limits)
- Progress bar showing X/Y verses processed
- Cancel operation support
- Cache results immediately

UI:
- Checkbox list of verses with preview text
- "Select All" / "Deselect All" buttons
- "Generate Context (X verses selected)" button
- Progress modal with cancel option

Implementation:
- Modify `BibleVersePicker` component
- Add `handleChapterSelect` in `UnderstandScreen`
- Create batch generation service method

---

### 🎯 Medium Priority

#### 4. Advanced Practice Modes
**Description**: More variety in practice/recall methods

Modes:
- **Type Mode**: Type the verse word-by-word (current)
- **First Letter Mode**: Show first letter of each word as hint
- **Word Bank Mode**: Drag words into blanks from shuffled list
- **Multiple Choice**: Choose correct word for each blank
- **Pure Recall**: No hints, just reference shown

Configuration:
- User can choose preferred mode(s)
- Adaptive difficulty (easier modes for new verses)
- XP multiplier for harder modes

---

#### 5. Spaced Repetition Algorithm
**Description**: Smart scheduling of verse review based on forgetting curve

Features:
- Calculate next review date based on accuracy
- Review queue sorted by urgency
- "Review Today" section on home screen
- Notifications for due reviews

Algorithm (simplified):
```
interval = previousInterval × easeFactor
easeFactor = based on accuracy (0.8 - 2.5)
```

Database:
```sql
-- Add to user_verse_progress
next_review_date date
review_interval integer -- days
ease_factor numeric
```

---

#### 6. Verse Collections/Decks
**Description**: Organize verses into custom collections

Examples:
- "Verses on Anxiety"
- "Memory Challenge - Summer 2024"
- "Favorite Psalms"
- "Verses to Share"

Features:
- Create/edit/delete collections
- Add verses to multiple collections
- Practice entire collection
- Share collections with friends (future)

Database:
```sql
verse_collections (
  id uuid PK,
  user_id uuid FK,
  name text,
  description text,
  created_at timestamp
)

collection_verses (
  collection_id uuid FK,
  verse_id uuid FK,
  order_index integer,
  UNIQUE(collection_id, verse_id)
)
```

---

#### 7. Achievements System
**Description**: Unlock badges and achievements for milestones

Examples:
- "First Verse" - Learn your first verse
- "Perfect Week" - 7 days in a row
- "Century" - Learn 100 verses
- "Scholar" - Reach level 10
- "Speed Reader" - Complete lesson in under 5 minutes
- "Perfectionist" - 10 perfect scores in a row

Display:
- Achievements page in profile
- Toast/modal when unlocked
- Progress bars for multi-stage achievements
- Rare/legendary achievements

Database:
```sql
achievements (
  id uuid PK,
  name text,
  description text,
  icon_name text,
  requirement_type text, -- 'count', 'streak', 'accuracy', etc.
  requirement_value integer
)

user_achievements (
  user_id uuid FK,
  achievement_id uuid FK,
  unlocked_at timestamp,
  UNIQUE(user_id, achievement_id)
)
```

---

#### 8. Social Features
**Description**: Connect with friends and encourage each other

Features:
- Add friends (by username/email)
- View friends' progress (opt-in)
- Friendly leaderboards (daily/weekly/all-time)
- Share verse cards (image export)
- Encourage/cheer reactions
- Group challenges

Privacy:
- All social features opt-in
- Granular privacy controls
- Block/mute options

Database:
```sql
friendships (
  user_id uuid FK,
  friend_id uuid FK,
  status text, -- 'pending', 'accepted', 'blocked'
  created_at timestamp,
  UNIQUE(user_id, friend_id)
)

leaderboard_entries (
  user_id uuid FK,
  period text, -- 'daily', 'weekly', 'all_time'
  rank integer,
  xp integer,
  updated_at timestamp
)
```

---

#### 9. Daily Verse & Devotional
**Description**: Curated daily verse with short devotional thought

Features:
- New verse every morning (personalized time)
- Short devotional (2-3 paragraphs)
- Push notification
- Add to learning queue option
- Share daily verse

Content Source:
- Pre-curated by admin
- Or AI-generated based on user's learning history
- Themed weeks (e.g., "Peace Week", "Faith Week")

---

#### 10. Offline Mode
**Description**: Full functionality without internet

Features:
- Download verses for offline use
- Queue actions for sync when online
- Cached AI context
- Local-first architecture

Technical:
- Use AsyncStorage for offline data
- Sync queue for pending actions
- Conflict resolution strategy

---

### 🚀 Lower Priority / Future

#### 11. Audio Verse Playback
- Listen to verse in multiple voices
- Background playback
- Speed control
- Repeat loop

#### 12. Verse Writing/Journaling
- Handwrite verses (Apple Pencil support)
- Journal reflections on verses
- Sketch/doodle notes

#### 13. Translation Comparison
- Side-by-side verse comparison (NIV, ESV, KJV, etc.)
- Interlinear view (English + Greek/Hebrew)
- Toggle between translations

#### 14. Progress Analytics
- Detailed stats dashboard
- Accuracy over time graphs
- Most practiced verses
- Learning streaks visualization
- Export data as CSV

#### 15. Premium Features
- Unlimited AI context generation
- Advanced practice modes
- Priority support
- Exclusive themes
- No rate limits

#### 16. Verse Memorization Challenges
- Weekly challenges (e.g., "Memorize Psalm 23")
- Community challenges with prizes
- Difficulty tiers (beginner, intermediate, advanced)

#### 17. Smart Reminders
- Personalized reminder times
- Context-aware notifications
- Streaks at risk alerts

#### 18. Import/Export
- Import verses from other apps
- Export progress as PDF
- Backup to cloud

#### 19. Accessibility Enhancements
- VoiceOver optimization
- Dynamic type support
- High contrast mode
- Dyslexia-friendly fonts

#### 20. Study Tools Integration
- Link to commentaries
- Cross-references
- Word studies
- Sermon references

---

## 🚦 PRODUCTION REQUIREMENTS

See `PRODUCTION_GUIDE.md` for detailed checklist. Summary:

### 🔴 Critical (Blockers)

- [ ] **Run `supabase/complete-setup.sql` in Supabase production**
- [ ] **Set up error tracking (Sentry)**
- [ ] **Environment variables validated for production**
- [ ] **End-to-end testing complete**
- [ ] **App icon and splash screen created**
- [ ] **Privacy policy hosted**
- [ ] **Terms of service hosted**

### 🟡 Important (Should Have)

- [ ] Analytics integration (Firebase/Mixpanel)
- [ ] Push notifications setup
- [ ] Performance optimization
- [ ] App Store metadata prepared
- [ ] Screenshots for store listings
- [ ] App Store Connect account ready
- [ ] Google Play Console account ready

### 🟢 Nice to Have

- [ ] Social sharing features
- [ ] Referral program
- [ ] Beta testing program (TestFlight/Play Console)
- [ ] Marketing website
- [ ] Support email system

---

## 🐛 KNOWN ISSUES

### Active Bugs

1. **Speech Recognition Errors**
   - Status: High frequency of errors
   - Impact: Users struggle with voice input
   - Solution: Investigate Expo Speech Recognition issues, consider Google Speech API
   - File: `src/screens/RecallScreen.tsx`

2. **Bible Verse Picker - Books Not Loading**
   - Status: Only Random Verse button shows, books don't appear
   - Impact: Can't browse books in picker
   - Solution: Investigate `loadBooks()` query and logging
   - File: `src/components/BibleVersePicker.tsx`

### Recently Fixed

- ✅ Context generation stopped after update (restored `verses.length` dependency)
- ✅ Practice showing 1/1 verse instead of 5 (removed `verseId` check)
- ✅ XP display showing incorrect values (fixed level calculation)
- ✅ Wrong answers not revealing verse (added reveal on incorrect)
- ✅ Context view stuck after Next button (reset `showContext` state)

---

## 📊 TECHNICAL DEBT

### Code Quality
- [ ] Add comprehensive unit tests (Jest)
- [ ] Add integration tests (Detox)
- [ ] Add E2E tests for critical flows
- [ ] Improve error handling consistency
- [ ] Add JSDoc comments to services
- [ ] Refactor large components (RecallScreen > 500 lines)

### Performance
- [ ] Optimize verse loading (pagination, virtual lists)
- [ ] Reduce bundle size (code splitting)
- [ ] Lazy load screens
- [ ] Optimize images (compress, WebP)
- [ ] Memoize expensive computations

### Architecture
- [ ] Migrate to Redux/Zustand for state (if app grows)
- [ ] Implement proper caching strategy
- [ ] Add request queuing for offline support
- [ ] Separate business logic from UI components
- [ ] Create consistent service layer pattern

### Security
- [ ] Rate limiting on AI API calls (prevent abuse)
- [ ] Input validation on all forms
- [ ] Sanitize user-generated content
- [ ] Implement API key rotation
- [ ] Add CORS configuration for web

---

## 📈 METRICS TO TRACK

### User Engagement
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)
- Retention (Day 1, 7, 30)
- Session length (avg)
- Verses practiced per session
- Feature usage (% users using each screen)

### Learning Effectiveness
- Verses memorized per user
- Average accuracy per verse
- Improvement rate over time
- Streak retention rate
- XP growth rate

### Technical Performance
- Crash-free sessions %
- App startup time
- Screen load times
- API response times
- Error rate by type
- AI generation success rate

### Business (Future)
- Free to premium conversion
- Premium subscriber count
- Churn rate
- Revenue per user

---

## 🎯 ROADMAP

### Phase 1: Beta Launch (Current)
- Fix critical bugs (speech recognition, verse picker)
- Complete production checklist
- Submit to App Store / Play Store
- Soft launch to small group (100-500 users)

### Phase 2: Public Launch (1-2 months)
- Implement verse bookmarking
- Add achievements system
- Improve spaced repetition
- Build social features (friends, leaderboards)
- Marketing push

### Phase 3: Growth (3-6 months)
- Bible Chat Buddy integration
- Verse collections/decks
- Daily devotionals
- Offline mode
- Translation comparison

### Phase 4: Monetization (6-12 months)
- Premium tier launch
- Advanced features
- Referral program
- Community challenges

---

## 🔑 KEY ARCHITECTURAL DECISIONS

### Why Supabase?
- PostgreSQL with strong SQL support
- Built-in auth and RLS
- Real-time subscriptions (future social features)
- Generous free tier
- Easy to self-host if needed

### Why Expo?
- Faster development (no native code initially)
- Cross-platform (iOS, Android, Web)
- OTA updates
- Large ecosystem
- Easy to eject if needed

### Why Perplexity AI?
- Cost-effective vs GPT-4
- Fast response times
- Good quality for context generation
- Reliable uptime

### Why No Redux/MobX?
- App state is relatively simple
- React Context sufficient for now
- Reduces bundle size
- Can add later if needed

---

## 🛠️ DEVELOPMENT WORKFLOW

### Git Branches
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `claude/*` - Claude Code working branches

### Commit Conventions
```
feat: Add verse bookmarking
fix: Resolve speech recognition errors
refactor: Extract AI service logic
docs: Update PROJECT_STATUS.md
chore: Upgrade dependencies
```

### Code Review Checklist
- [ ] TypeScript types correct
- [ ] Error handling present
- [ ] Loading states implemented
- [ ] Logging added for debugging
- [ ] Comments for complex logic
- [ ] No console.logs (use logger)
- [ ] Styled according to theme
- [ ] Tested on iOS and Android

---

## 📚 LEARNING RESOURCES

### For New Developers
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)

### For Designers
- [Current Theme System](src/theme.ts)
- [Design Philosophy](#design-philosophy)
- [Figma Community - Bible Apps](https://www.figma.com/community)

---

## 🎓 THEOLOGY & CONTENT NOTES

### Verse Selection Criteria
- Memorability (shorter, rhythmic verses preferred)
- Theological significance
- Practical application
- Diversity (OT/NT, different themes)

### AI Context Guidelines
- Historically accurate
- Theologically balanced (non-denominational)
- Accessible language (8th grade reading level)
- Practical application included
- Cite sources when possible

### Translation Priority
1. NIV (primary)
2. ESV (future)
3. NLT (future)
4. KJV (future)

---

## 📞 SUPPORT & CONTACT

**GitHub Issues**: [Create Issue](https://github.com/yourusername/memoryverse/issues)
**Email**: support@memoryverse.app (to be set up)
**Discord**: Community server (future)

---

## 📝 CHANGELOG

### Recent Updates (Last 7 Days)
- ✅ Fixed context generation issue
- ✅ Implemented 5-verse practice lessons
- ✅ Added lesson complete modal with animated XP bar
- ✅ Fixed XP display calculation
- ✅ Added Bible verse picker component
- ✅ Added answer reveal on wrong answers
- ✅ Added "Explain All Verses" button for chapters

### Upcoming (Next 7 Days)
- 🔧 Fix Bible picker books not loading
- 🔧 Implement chapter selection functionality
- 🔧 Fix speech recognition errors
- 📝 Complete production checklist

---

## 🎉 SUCCESS CRITERIA

The app is ready for production launch when:
- ✅ All critical bugs fixed
- ✅ Core learning flow works flawlessly
- ✅ AI context generation reliable
- ✅ XP/leveling system accurate
- ✅ Clean, polished UI
- ✅ Error tracking configured
- ✅ Privacy policy and ToS ready
- ✅ Tested on multiple devices
- ✅ App Store submissions complete

**Current Status**: ~85% ready 🚀

---

## 💡 INSPIRATION & VISION

**Mission**: Help people hide God's Word in their hearts through effective, joyful memorization.

**Vision**: Become the go-to Bible memory app that combines proven learning techniques with modern gamification and AI assistance.

**Values**:
- **Faith-centered**: Scripture is the focus, not the technology
- **User-friendly**: Anyone can start memorizing in 30 seconds
- **Encouraging**: Celebrate progress, don't shame mistakes
- **Community**: Learn together, encourage one another
- **Excellence**: Deliver a polished, delightful experience

---

**Last Updated**: 2025-11-05 by Claude Code
**Next Review**: After beta launch feedback
