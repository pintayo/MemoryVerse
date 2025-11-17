# MemoryVerse - Technical Documentation

**Last Updated:** November 17, 2025

---

## 📱 **App Overview**

**MemoryVerse** is a React Native mobile application for memorizing Bible verses using proven spaced repetition techniques. The app combines gamification, AI-powered features, and social elements to make Scripture memorization engaging and effective.

---

## 🏗️ **Architecture**

### Technology Stack

#### Frontend
- **Framework:** React Native (Expo SDK 52)
- **Language:** TypeScript
- **Navigation:** React Navigation 7
- **State Management:** React Context API
- **UI Components:** Custom components with react-native-svg
- **Styling:** StyleSheet API with theme system

#### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime subscriptions
- **Edge Functions:** Deno (for webhooks)

#### Third-Party Services
- **AI:** Anthropic Claude API (prayer generation, context)
- **Payments:** RevenueCat (in-app purchases)
- **Analytics:** Firebase Analytics
- **Error Tracking:** Sentry
- **Push Notifications:** Expo Notifications

---

## 📊 **Database Schema**

### Core Tables

#### `profiles`
User profile information and gamification stats.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Gamification
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,

  -- Preferences
  preferred_translation TEXT DEFAULT 'ESV',
  daily_goal INTEGER DEFAULT 3,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_time TIME,

  -- Premium
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP,
  subscription_tier TEXT, -- 'basic', 'standard', 'premium'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `verses`
Bible verses from all 66 books.

```sql
CREATE TABLE verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'ESV',

  -- AI-generated context
  context TEXT,
  context_generated_by_ai BOOLEAN DEFAULT false,
  context_generated_at TIMESTAMP,

  category TEXT, -- 'faith', 'love', 'comfort', etc.
  difficulty INTEGER DEFAULT 5, -- 1-10 scale

  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_verse_progress`
Tracks individual verse memorization progress.

```sql
CREATE TABLE user_verse_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  verse_id UUID REFERENCES verses(id) ON DELETE CASCADE,

  -- Spaced Repetition (SM-2 Algorithm)
  easiness_factor DECIMAL DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_at TIMESTAMP DEFAULT NOW(),

  -- Performance Tracking
  times_reviewed INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  accuracy_rate DECIMAL DEFAULT 0.0,
  last_reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, verse_id)
);
```

#### `practice_sessions`
Records of each practice session.

```sql
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session Details
  mode TEXT NOT NULL, -- 'typing', 'multiple_choice', 'fill_blank'
  verses_practiced INTEGER NOT NULL,
  accuracy_rate DECIMAL,
  xp_earned INTEGER DEFAULT 0,
  duration_seconds INTEGER,

  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

#### `daily_verses`
Daily verse feature - one per day per translation.

```sql
CREATE TABLE daily_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_id UUID REFERENCES verses(id),
  translation TEXT NOT NULL DEFAULT 'ESV',
  date DATE NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(date, translation)
);
```

#### `chapter_contexts`
AI-generated context for entire chapters.

```sql
CREATE TABLE chapter_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  translation TEXT NOT NULL DEFAULT 'ESV',

  context TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(book, chapter, translation)
);
```

#### `usage_tracking`
Tracks premium feature usage for rate limiting.

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL, -- 'talk_about_day', etc.
  usage_count INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, feature_name, date)
);
```

---

## 🔐 **Row Level Security (RLS)**

All tables have RLS enabled. Key policies:

### Profiles
- Users can read their own profile
- Users can update their own profile
- Admins can read all profiles

### Verses
- Everyone can read verses
- Only admins can insert/update/delete verses

### User Verse Progress
- Users can CRUD their own progress records
- No one can see other users' progress

### Practice Sessions
- Users can create and read their own sessions
- No one can see other users' sessions

---

## 🎮 **Gamification System**

### XP & Levels
- Practice verse: 10 XP
- Perfect accuracy: +5 bonus XP
- Daily goal met: +50 XP
- Streak milestone: +100 XP

**Level Formula:** `Level = floor(sqrt(total_xp / 100))`

### Streaks
- Increment: Practice at least once per day
- Break: Miss a full day
- Freeze: Premium users can freeze streak (prevents breaking)

---

## 🧠 **Spaced Repetition Algorithm**

Uses SM-2 (SuperMemo 2) algorithm:

```typescript
// Calculate next review interval
function calculateNextReview(
  quality: number, // 0-5 (user performance)
  repetitions: number,
  easinessFactor: number,
  previousInterval: number
): { nextInterval: number; newEasinessFactor: number } {
  let newEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  if (quality < 3) {
    // Failed - reset
    newInterval = 1;
    repetitions = 0;
  } else {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(previousInterval * newEF);
    }
  }

  return { nextInterval: newInterval, newEasinessFactor: newEF };
}
```

---

## 💳 **Subscription Tiers**

### Free
- All core memorization features
- Basic analytics
- Ads (optional future feature)

### Basic - €4.99/month
- 1 AI prayer per day
- Daily spiritual encouragement
- 1 streak freeze per month
- Basic verse analytics
- Email support

### Standard - €9.99/month (Recommended)
- 5 AI prayers per day
- Daily spiritual encouragement
- Deeper scripture insights
- 3 streak freezes per month
- Advanced verse analytics
- All Bible translations
- Email support

### Premium - €14.99/month
- 10 AI prayers per day
- Daily spiritual encouragement
- Deeper scripture insights
- Unlimited streak freezes
- Advanced verse analytics
- All Bible translations
- Priority support
- Early access to new features

---

## 🔄 **Purchase Flow**

1. User clicks "Upgrade to Premium"
2. App loads offerings from RevenueCat
3. User selects tier and confirms
4. RevenueCat processes payment through App Store/Play Store
5. RevenueCat sends webhook to Supabase Edge Function
6. Webhook updates `profiles` table: `is_premium`, `subscription_tier`, `premium_expires_at`
7. App refreshes user profile
8. Premium features unlock

---

## 🎨 **Theme System**

Centralized theme in `src/theme.ts`:

```typescript
export const theme = {
  colors: {
    primary: {
      darkCharcoal: '#2D3142',
      mutedStone: '#4F5D75',
      oatmeal: '#BFC0C0',
    },
    secondary: {
      warmTerracotta: '#EF8354',
      lightGold: '#F4A261',
    },
    accent: {
      burnishedGold: '#C07F00',
    },
    background: {
      lightCream: '#FAF9F6',
      warmParchment: '#F5EFE7',
    },
    success: {
      green: '#2D6A4F',
      celebratoryGold: '#FFD700',
    },
    text: {
      primary: '#2D3142',
      secondary: '#4F5D75',
      tertiary: '#8B95A5',
      inverse: '#FFFFFF',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    fonts: {
      verse: {
        default: 'Crimson Text',
        bold: 'Crimson Text Bold',
      },
      ui: {
        default: 'SF Pro Text',
        medium: 'SF Pro Text Medium',
        bold: 'SF Pro Text Bold',
      },
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
  },
};
```

---

## 📂 **Project Structure**

```
src/
├── components/        # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── ErrorBoundary.tsx
│   └── ...
├── config/            # Configuration files
│   └── featureFlags.ts
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── hooks/             # Custom hooks
│   └── useFeatureFlag.ts
├── navigation/        # Navigation setup
│   ├── AppNavigator.tsx
│   └── types.ts
├── screens/           # Screen components
│   ├── HomeScreen.tsx
│   ├── PracticeScreen.tsx
│   ├── ReviewScreen.tsx
│   └── ...
├── services/          # Business logic & API calls
│   ├── authService.ts
│   ├── spacedRepetitionService.ts
│   ├── purchaseService.ts
│   ├── analyticsService.ts
│   └── ...
├── types/             # TypeScript types
│   └── database.ts
├── utils/             # Utility functions
│   ├── logger.ts
│   └── sentryHelper.ts
└── theme.ts           # Theme configuration
```

---

## 🔧 **Development Setup**

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account
- RevenueCat account (for purchases)

### Environment Variables

Create `.env` file:
```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI Provider
EXPO_PUBLIC_AI_PROVIDER=anthropic
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
EXPO_PUBLIC_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# RevenueCat
REVENUECAT_APPLE_API_KEY=appl_xxxxx
REVENUECAT_GOOGLE_API_KEY=goog_xxxxx

# Firebase
EXPO_PUBLIC_FIREBASE_ENABLED=true

# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# For development build (with RevenueCat)
npx expo prebuild
npx expo run:ios
```

---

## 🚀 **Deployment**

### iOS (App Store)
1. Run `npx expo prebuild`
2. Open `ios/MemoryVerse.xcworkspace` in Xcode
3. Configure signing & capabilities
4. Archive & upload to App Store Connect
5. Submit for review

### Android (Google Play)
1. Run `npx expo prebuild`
2. Generate signed APK/AAB
3. Upload to Google Play Console
4. Submit for review

### OTA Updates (Expo)
```bash
# Create production build
eas build --platform all

# Publish update (no app store review needed)
eas update --branch production --message "Bug fixes"
```

---

## 📖 **API Documentation**

### Key Services

#### Authentication
```typescript
// Login
await authService.signIn(email, password);

// Sign up
await authService.signUp(email, password, fullName);

// Sign out
await authService.signOut();
```

#### Verse Practice
```typescript
// Get review verses
const verses = await spacedRepetitionService.getReviewVerses(userId);

// Record practice result
await spacedRepetitionService.recordReview(progressId, accuracy, duration);
```

#### Premium Features
```typescript
// Check usage
const { canUse, remaining } = await canUseTalkAboutDay(userId, isPremium, tier);

// Use feature
const { success, remaining } = await useTalkAboutDay(userId, isPremium, tier);
```

---

## 🔍 **Testing**

### Manual Testing Checklist
See `STATUS.md` for current testing priorities.

### Automated Testing (TODO)
- Unit tests with Jest
- Integration tests
- E2E tests with Detox

---

## 📝 **Additional Resources**

- **RevenueCat Setup:** `docs/REVENUECAT_SETUP.md`
- **Firebase Setup:** `docs/FIREBASE_SETUP.md`
- **Sentry Setup:** `docs/SENTRY_TRACKING.md`
- **Feature Flags:** `FEATURE_FLAGS_GUIDE.md`

---

## 🤝 **Contributing**

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Wait for review

---

## 📄 **License**

Copyright © 2025 MemoryVerse. All rights reserved.
