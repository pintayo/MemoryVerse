# MemoryVerse Codebase Exploration Summary

## Executive Overview

MemoryVerse is a **React Native/Expo Bible verse memorization app** inspired by Duolingo. It uses gamification (XP, levels, streaks), AI-powered explanations, spaced repetition, and prayer training to help users memorize Scripture effectively.

**Current Status**: Beta (Pre-Production) - ~85% ready for App Store launch

---

## 1. APP STRUCTURE & ENTRY POINTS

### Main Entry Point: `App.tsx`
- **Framework**: React Native with Expo SDK 54
- **Error Handling**: Global error boundaries + Sentry integration (production builds)
- **State Management**: Wraps app in:
  - ErrorBoundary
  - GestureHandlerRootView
  - SafeAreaProvider
  - AuthProvider (authentication context)
  - NavigationContainer (react-navigation)

### Key Features:
- Conditional Sentry loading (disabled in Expo Go, enabled in standalone builds)
- Onboarding check (all users - guest and authenticated)
- Session tracking for app review prompts

---

## 2. NAVIGATION STRUCTURE

### Navigation Hierarchy
```
App.tsx (Main Entry)
├── AppNavigator (Stack Navigator)
│   ├── Main (BottomTabNavigator)
│   │   ├── Home Screen (Home tab)
│   │   ├── Bible Screen (Bible tab)
│   │   ├── Leaderboard Screen (Leaderboard tab)
│   │   └── Profile Screen (Profile tab)
│   ├── VerseCard (Learn screen)
│   ├── Recall (Practice screen)
│   ├── Practice (Multi-verse practice)
│   ├── Pray (Prayer training)
│   ├── Understand (Verse context/explanation)
│   ├── Review (Spaced repetition review)
│   ├── FillInBlanks (Practice mode)
│   ├── MultipleChoice (Practice mode)
│   ├── Downloads (Offline downloads)
│   ├── StreakCalendar (Visual streak tracking)
│   ├── Favorites (Favorite verses)
│   ├── ChapterContext (Chapter-level explanations)
│   ├── PremiumUpgrade (Subscription screen)
│   ├── Settings (App settings)
│   ├── NotificationSettings (Reminder settings)
│   └── Login/Signup (Auth screens)
└── OnboardingScreen (First-time users)
```

### Navigation Files
- **`RootNavigator.tsx`**: Stack navigator with all modal/detail screens
- **`BottomTabNavigator.tsx`**: Main tab navigation (4 tabs)
  - Uses custom SVG icons
  - Theme-aware colors (active: lightGold, inactive: tertiary)
  - 60px height with 8px padding

---

## 3. SCREEN ORGANIZATION

### Current Screens (27 total)
**Learning & Practice:**
- `HomeScreen.tsx` - Hub with daily verse, stats, quick actions
- `VerseCardScreen.tsx` - Verse learning/flashcard mode
- `RecallScreen.tsx` - Practice recall with voice input
- `PracticeScreen.tsx` - Multi-verse practice session
- `ReviewScreen.tsx` - Spaced repetition review
- `UnderstandScreen.tsx` - AI-powered verse context
- `BibleScreen.tsx` - Bible browsing/search
- `SearchScreen.tsx` - Advanced verse search

**Spiritual & Prayer:**
- `PrayScreen.tsx` - Prayer training (8 prayer categories)
- `ChapterContextScreen.tsx` - Chapter-level explanations

**Gamification & Social:**
- `ProfileScreen.tsx` - User profile, stats, settings
- `LeaderboardScreen.tsx` - Global leaderboard
- `StreakCalendarScreen.tsx` - Visual streak calendar
- `FavoritesScreen.tsx` - Saved/favorite verses

**Content & Utility:**
- `DownloadsScreen.tsx` - Offline verse downloads
- `NotesScreen.tsx` - Study notes (coming soon)
- `NotificationSettingsScreen.tsx` - Daily reminders

**Monetization & Auth:**
- `PremiumUpgradeScreen.tsx` - Subscription pricing
- `LoginScreen.tsx` - Email/password login
- `SignupScreen.tsx` - User registration
- `SettingsScreen.tsx` - App settings

**Utility:**
- `ComingSoonScreen.tsx` - Placeholder for future features
- `OnboardingScreen.tsx` - First-time user tutorial

### Disabled Screens
- `FillInBlanksMode.tsx.disabled`
- `MultipleChoiceScreen.tsx.disabled`
- `practiceService.ts.disabled`

---

## 4. EXISTING COMPANION FEATURE

### BibleCompanion Component (`src/components/BibleCompanion.tsx`)

**What it is**: A decorative/interactive companion element (animated Bible book) on the HomeScreen

**Current Features:**
- Visual design: Ornate Bible book with face (eyes, smile, blush)
- **Animations:**
  - Breathing animation (idle state, 2-second cycle)
  - Celebration animation (300ms bounce + sparkles)
  - Glow effect for 7+ day streaks
  - Sparkle effects during celebration
- **Interactivity:**
  - Tap to celebrate and show motivational messages
  - Ornamental details increase with streak (3 levels at 7, 14, 21+ days)
  - Flame badge shows current streak
- **Messages**: 5 randomized encouragement/tips (streak, scripture, XP, prayer, sharing)

**Limitations:**
- **NOT a chatbot or assistant** - just a tap-to-celebrate mascot
- No real conversation capability
- No memory between sessions
- No AI integration

---

## 5. PREMIUM/SUBSCRIPTION IMPLEMENTATION

### Current Setup

#### Architecture
- **Service**: `purchaseService.ts` (RevenueCat wrapper)
  - Status: **DISABLED in Expo Go** (requires native modules)
  - Will be enabled in EAS production builds
  - API Keys: Environment variables for iOS & Android

#### Subscription Tiers (`usageLimitsService.ts`)
```
FREE:      0 daily prayers
BASIC:     1 daily prayer (€4.99/mo)
STANDARD:  5 daily prayers (€9.99/mo)
PREMIUM:   10 daily prayers (€14.99/mo)
```

#### Premium Features (Feature Flags)
Currently Planned:
- `advancedAnalyticsDashboard`
- `customVerseCollections`
- `exportProgressReports`
- `enhancedPrayerCoaching` ← Prayer coaching (AI)
- `multipleTranslations`
- `verseComparisonTool`
- `learningPathRecommendations`
- `offlineDownloads`
- `customThemes`
- `prioritySupport`

#### Usage Tracking
- RPC functions: `get_remaining_usage()`, `check_and_increment_usage()`
- Daily limit resets at midnight
- Supabase-backed (not client-side)
- Per-user, per-feature tracking

#### UI
- `PremiumUpgradeScreen.tsx` - Pricing page with feature list
- Gracefully handles purchases disabled in Expo Go
- Uses `analyticsService` to track:
  - Screen views
  - Plan selections
  - Successful purchases

---

## 6. USER SELECTIONS & MODES

### State Management Pattern
**Technology**: React Context + useState (local component state)

#### Authentication Context (`AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null;              // Supabase auth user
  profile: Profile | null;        // User profile from DB
  session: Session | null;        // Auth session
  isLoading: boolean;             // Initial load state
  isAuthenticated: boolean;       // true if user?.id exists
  isGuest: boolean;               // true if no authenticated user
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

#### Guest Mode
- Users can browse/practice without authentication
- Profile-dependent features show sign-up prompts
- Storage: AsyncStorage (client-side only)
- Service: `guestModeService.ts` with:
  - Smart prompting (allow 1st practice, then prompt)
  - Dismissible prompts
  - Trigger-based prompts (practice, prayer, favorites, etc.)

#### User Selections Tracking
**Practice Mode Choices:**
- 5 verses per lesson (from `practiceConfig.ts`)
- Mode selection: read → recall → recite (different screens)
- Form of input: voice, text, multiple-choice, fill-in-blanks

**Prayer Mode:**
- 8 categories: morning, evening, mealtime, bedtime, gratitude, comfort, guidance, forgiveness
- "Talk About Your Day" premium feature
- Input: Voice or text

**Settings:**
- Preferred translation (KJV, NIV, etc.)
- Daily goal
- Reminder time
- Reminder enabled

### Feature Flags (`config/featureFlags.ts`)
- 100+ features defined with enabled/premium status
- Environment-aware (dev, staging, production)
- Used via `useFeatureFlag()` hook
- Enables A/B testing and rollout control

---

## 7. DATA STORAGE APPROACH

### Backend: Supabase (PostgreSQL + Auth)

#### Database Schema
**Core Tables:**
1. **profiles** - User data
   - Basic: id, email, full_name, avatar_url
   - Gamification: total_xp, level, current_streak, longest_streak
   - Preferences: preferred_translation, daily_goal, reminder_enabled
   - Premium: is_premium, premium_expires_at, subscription_tier

2. **verses** - Scripture content
   - id, book, chapter, verse_number, text, translation
   - category (24 types, e.g., narrative, wisdom, prophecy)
   - difficulty (1-5 scale)
   - context (AI-generated background)

3. **user_verse_progress** - Learning progress tracking
   - verse_id, user_id, status (learning/reviewing/mastered)
   - accuracy_score, attempts, last_practiced_at, mastered_at

4. **practice_sessions** - Activity log
   - user_id, verse_id, session_type (read/recall/recite/write/etc.)
   - user_answer, is_correct, accuracy_percentage, xp_earned, time_spent_seconds

5. **achievements** - Badge tracking
   - user_id, badge_type, badge_name, earned_at

6. **daily_streaks** - Streak snapshots
   - user_id, date, verses_practiced, xp_earned

7. **verse_notes** - User annotations
   - user_id, verse_id, note_text

**Premium Tables:**
8. **verse_collections** - Custom verse sets
9. **verse_collection_shares** - Sharing functionality
10. **prayer_conversations** - Prayer history
11. **prayer_messages** - Message threads
12. **prayer_insights** - AI analysis of prayers
13. **bible_translations** - Translation metadata
14. **analytics_snapshots** - Daily stats
15. **learning_velocity** - Weekly progress tracking
16. **export_logs** - Data export history

#### Row-Level Security (RLS)
- All tables have RLS enabled
- Users can only see their own data
- Public verses accessible to all
- Premium features gated by profile flags

### Local Storage: AsyncStorage
- Onboarding completion status
- Search history
- Offline downloads metadata
- Temporary UI state
- Guest mode dismissals

---

## 8. ANIMATIONS & IMAGE HANDLING

### Animation Library
**Framework**: React Native `Animated` API (built-in, no external deps)

### Current Animation Examples

#### BibleCompanion Animations
```typescript
// Breathing (2-second cycle)
Animated.loop(
  Animated.sequence([
    Animated.timing(breathAnim, { toValue: 1, duration: 2000 }),
    Animated.timing(breathAnim, { toValue: 0, duration: 2000 })
  ])
)

// Celebration (300ms bounce + sparkles)
Animated.parallel([
  Animated.sequence([
    Animated.timing(celebrateAnim, { toValue: 1, duration: 300 }),
    Animated.timing(celebrateAnim, { toValue: 0, duration: 300 })
  ]),
  Animated.loop(Animated.timing(sparkleAnim, { toValue: 1, duration: 600 }))
])

// Glow (1.5-second pulse for high streaks)
Animated.loop(
  Animated.sequence([
    Animated.timing(glowAnim, { toValue: 1, duration: 1500 }),
    Animated.timing(glowAnim, { toValue: 0, duration: 1500 })
  ])
)
```

#### RecallScreen Animations
- **Microphone pulse**: 1-second scale loop (1.0 → 1.2 → 1.0)
- **Waveform animation**: 200ms height oscillation
- **Feedback animation**: Score reveal with timing sequence

#### Other Animations
- **Scale transitions** on card interactions
- **Opacity fades** for modals
- **Translate animations** for slide-ins
- **Interpolated values** for smooth color/opacity transitions

### Image Handling

**SVG Graphics** (Preferred)
- React-native-svg library used throughout
- Custom SVG components for:
  - Bible Companion mascot
  - Navigation icons (home, book, leaderboard, profile)
  - Flame streaks
  - Star ratings
  - Microphone icons
  - Prayer category icons
- Benefits: Scalable, lightweight, theme-aware colors

**PNG Assets**
- `/assets/icon.png` - App icon
- `/assets/adaptive-icon.png` - Android adaptive icon
- `/assets/splash.png` - Splash screen

**No Image Display** in verses
- Bible content is text-only
- No verse illustrations currently

### Theme/Color Integration
- All animations use `theme.colors` for consistency
- Warm parchment palette (golds, beiges, terracottas)
- Colors dynamically applied to SVGs

---

## 9. KEY SERVICES & UTILITIES

### Core Services (32 total)

**Authentication & User:**
- `authService.ts` - Supabase auth wrapper
- `profileService.ts` - User profile CRUD
- `guestModeService.ts` - Guest mode logic

**Learning & Practice:**
- `verseService.ts` - Verse CRUD and search
- `practiceService.ts` - Practice session logic
- `spacedRepetitionService.ts` - SR algorithm (review scheduling)
- `streakService.ts` - Streak tracking and protection
- `dailyVerseService.ts` - Daily verse rotation

**AI & Content:**
- `contextGenerator.ts` - AI context generation (Perplexity/OpenAI)
- `chapterContextService.ts` - Chapter-level explanations
- `translationService.ts` - Multi-translation support
- `verseSearchService.ts` - Full-text search + history

**Prayer/Spiritual:**
- `prayerCoachingService.ts` - Prayer guidance
- `enhancedPrayerCoachingService.ts` - Advanced coaching
- `dailyPrayerService.ts` - Daily prayer generation
- `prayerInputValidator.ts` - Input moderation
- `prayerOutputValidator.ts` - Output moderation

**Gamification:**
- `achievementService.ts` - Badge/achievement tracking
- `analyticsService.ts` - Event tracking
- `advancedAnalyticsService.ts` - Detailed analytics

**Premium/Monetization:**
- `purchaseService.ts` - RevenueCat integration
- `usageLimitsService.ts` - Daily feature limits

**Storage & Sync:**
- `offlineService.ts` - Offline downloads
- `exportService.ts` - Data export (PDF/CSV)

**Utilities:**
- `notificationService.ts` - Push notifications
- `appReviewService.ts` - App review prompt logic
- `speechRecognitionService.ts` - Voice input via Expo Voice
- `verseCollectionsService.ts` - Custom verse sets
- `studyNotesService.ts` - Note-taking

**Helpers:**
- `logger.ts` - Production-safe logging
- `sentryHelper.ts` - Sentry integration
- `errorHandler.ts` - Error standardization

### Hooks (3 custom hooks)
- `useFeatureFlag()` - Check if feature enabled
- `useGuestProtection()` - Guard feature access
- `useSignUpPrompt()` - Show auth prompts

---

## 10. TECH STACK SUMMARY

### Frontend
- **React Native** 0.81.5
- **Expo** SDK 54
- **TypeScript** 5.3.3
- **Navigation**: React Navigation 6.x (Stack + Bottom Tabs)
- **Animations**: React Native Animated API (built-in)
- **SVG**: react-native-svg 15.12.1
- **Styling**: Custom theme system (no external CSS frameworks)
- **Icons**: Expo Vector Icons (@expo/vector-icons)

### Backend
- **Supabase** (PostgreSQL + Auth + RLS)
- **Rev

enueCat** (In-app purchases, disabled in Expo Go)

### AI & APIs
- **Perplexity API** (primary for context generation)
- **OpenAI** (fallback)
- **Anthropic** (fallback)

### Services
- **Firebase Analytics** (event tracking)
- **Sentry** (error tracking, production only)
- **Expo Notifications** (push notifications)
- **Expo Voice** (speech recognition)

### Storage
- **AsyncStorage** (local, development data)
- **Supabase** (persistent, production data)
- **SecureStore** (sensitive auth tokens)

### Testing & Quality
- **Jest** (test framework)
- **ESLint** (code linting)
- **TypeScript** (type safety)

---

## 11. DESIGN SYSTEM

### Color Palette (Biblical/Warm Tones)
```
Primary:
  - Sandy Beige: #D4C4A8
  - Parchment Cream: #F5F0E8
  - Oatmeal: #E8DCC4
  - Muted Stone: #C9B99B

Secondary:
  - Soft Clay: #C9A88A
  - Warm Terracotta: #D4987A
  - Light Gold: #D4AF6A

Accents:
  - Celebratory Gold: #D4AF37
  - Deep Olive: #7A8461
  - Rosy Blush: #E8CDB8
```

### Typography
- **Scripture Font**: Georgia (serif)
- **UI Font**: Custom system font
- **Heading Scale**: xs to xl
- **Custom icon sizes**: 16px to 48px

### Spacing & Sizing
- Border radius: 8px, 12px, 16px, 24px (sm → xl)
- Animations: 150ms (fast) → 350ms (slow)
- Shadows: sm, md, lg

---

## 12. KEY FINDINGS FOR STORY MODE & COMPANION

### What Exists
1. ✅ **BibleCompanion** - Mascot/celebration element (NOT an AI assistant)
2. ✅ **Prayer system** - "Talk About Your Day" premium feature
3. ✅ **AI integration** - Context generation via Perplexity
4. ✅ **Spaced repetition** - Review scheduling algorithm
5. ✅ **Gamification** - XP, levels, streaks, achievements
6. ✅ **Premium gating** - Feature flags + usage limits
7. ✅ **Guest mode** - Works without auth
8. ✅ **Animations** - Smooth transitions throughout

### What's Missing (For Story Mode)
1. ❌ **Named story sequences** - Stories are just verse collections currently
2. ❌ **Narrative structure** - No quest/chapter progression
3. ❌ **Story selection UI** - No dedicated story browsing
4. ❌ **Narrative context** - Verses not linked to stories/books
5. ❌ **Achievement variations** - No story-specific badges
6. ❌ **Progress visualization** - No story completion indicators

### What's Missing (For AI Companion)
1. ❌ **Conversation history** - No chat storage
2. ❌ **Real-time AI chat** - Only static context generation
3. ❌ **Adaptive responses** - No learning from user history
4. ❌ **Personality system** - BibleCompanion is static
5. ❌ **Prayer coaching** - Exists but basic
6. ❌ **Scheduling** - No companion "check-ins"

### Building Blocks Ready
- ✅ Supabase schema (extensible)
- ✅ Premium feature framework
- ✅ Usage limits system
- ✅ Authentication & guest mode
- ✅ Animation system
- ✅ Navigation structure
- ✅ AI integration (context generation)
- ✅ Prayer/conversation schema (prayer_conversations, prayer_messages)

---

## 13. PROJECT ROADMAP (From Docs)

### Phase 1: App Store Launch (Current - 2 weeks)
- App icon & splash screen
- Store listings & metadata
- Error tracking setup
- Submit to stores

### Phase 2: Public Growth (1-2 months)
- Verse bookmarking
- Push notifications
- Prayer improvements
- Social sharing

### Phase 3: Premium Features (3-6 months)
- **AI Prayer Coaching** 💎 ← Related to AI Companion
- Voice-guided prayer
- Prayer history
- Unlimited collections

### Phase 4: Community (6-12 months)
- Friends system
- Community challenges
- Church group plans

### Phase 5: Multi-Platform (12+ months)
- Web version (PWA)
- Desktop app
- Apple Watch
- Widgets

---

## SUMMARY FOR FEATURE DEVELOPMENT

### Files to Reference When Building Story Mode
1. `verseCollectionsService.ts` - Collection management
2. `spacedRepetitionService.ts` - Learning algorithms
3. `achievementService.ts` - Badge system
4. `practiceService.ts` - Practice modes
5. `featureFlags.ts` - Feature gating

### Files to Reference When Building AI Companion
1. `contextGenerator.ts` - AI integration pattern
2. `prayerCoachingService.ts` - Conversation framework
3. `usageLimitsService.ts` - Usage tracking
4. `dailyPrayerService.ts` - AI prompt patterns
5. `enhancedPrayerCoachingService.ts` - Advanced AI
6. `BibleCompanion.tsx` - UI component patterns

### Database Tables Ready for Extension
- `verse_collections` ← For stories
- `prayer_conversations` ← For companion chats
- `prayer_messages` ← For message history
- `prayer_insights` ← For AI analysis
- `achievements` ← For story badges

---

**Exploration Complete** ✅
**Total Codebase Size**: 92 TypeScript/TSX files
**Architecture**: Well-structured, modular, production-ready
**Extensibility**: High (feature flags, service layer, clean separation)

