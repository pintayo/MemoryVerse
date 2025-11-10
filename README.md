# MemoryVerse

A Scripture memorization mobile app in the style of Duolingo, designed for Bible verses with a beautiful biblical theme.

**Current Status:** MVP Complete (~85% production-ready) - All core features working!

## Tech Stack

- **Frontend:** React Native 0.81.5 + Expo SDK 54 + TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security)
- **AI:** Perplexity API (primary), OpenAI/Anthropic (fallbacks)
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **Styling:** Custom theme system with biblical parchment aesthetic

## Design Philosophy

MemoryVerse features a warm, reverent design inspired by historical fabrics and ancient manuscripts. The app combines minimalism with biblical aesthetics to create a focused, peaceful memorization experience.

## Biblical Design System

### Color Palette

**Primary Colors** - Sandy beige, parchment cream, oatmeal, muted stone
- Sandy Beige: `#D4C4A8`
- Parchment Cream: `#F5F0E8`
- Oatmeal: `#E8DCC4`
- Muted Stone: `#C9B99B`

**Secondary Colors** - Soft clay, warm terracotta, gentle browns, light gold
- Soft Clay: `#C9A88A`
- Warm Terracotta: `#D4987A`
- Gentle Brown: `#A68968`
- Light Gold: `#D4AF6A`

**Success Colors** - Muted olive green, sunlit saffron, gold
- Muted Olive: `#8B956D`
- Sunlit Saffron: `#E6C068`
- Celebratory Gold: `#D4AF37`

**Background Colors** - Off-white parchment and light cream
- Off-White Parchment: `#FAF8F3`
- Light Cream: `#F5F0E8`
- Warm Parchment: `#EDE8DC`

### Typography

- **Scripture Text**: Elegant serif fonts (Georgia, Cormorant Garamond)
- **UI Text**: Soft, smooth sans-serif (Inter, Roboto)
- Large verse text with generous line height and letter spacing
- Clear hierarchy between Scripture and UI elements

### Design Principles

1. **Minimalist & Reverent**: Ample breathing space, gentle contrast
2. **Organic & Warm**: Parchment backgrounds, earth tones, no harsh blues
3. **Soft Interactions**: Rounded corners, gentle shadows, smooth transitions
4. **Focus on Scripture**: Verses are always the primary focus
5. **Celebratory Success**: Gold highlights, gentle animations, olive checkmarks

## Features

### ✅ Implemented Features

#### Authentication & User Management
- Email/password authentication via Supabase
- User profiles with customizable emoji avatars
- Profile editing (bio, display name, avatar selection)
- Session management with auto token refresh
- Default avatar (😊) for new users

#### Bible Content
- **7 Public Domain Translations** (217,715 total verses)
  - KJV (King James Version) - 31,103 verses
  - ASV (American Standard Version) - 31,103 verses
  - BBE (Bible in Basic English) - 31,103 verses
  - DBY (Darby English Bible) - 31,099 verses
  - WBT (Webster's Bible) - 31,102 verses
  - WEB (World English Bible) - 31,102 verses
  - YLT (Young's Literal Translation) - 31,103 verses
- Bible Verse Picker (Book → Chapter → Verse + Random)
- 24 verse categories (Faith, Love, Salvation, Prayer, etc.)
- 5 difficulty levels (1-5)

#### Verse Learning System
- Swipeable flashcards with flip animation
- AI-generated context and explanations (auto-generated, cached in DB)
- Full-screen verse display with parchment background
- Context/explanation toggle on Understand screen
- Scrollable verse display (no text cutoff)
- Progress tracking per verse (familiarity levels)

#### Practice & Recall
- 5 verses per lesson with fill-in-the-blank exercises
- Speech input + text input fallback
- XP system (5-20 XP based on accuracy)
- Lesson complete modal with animated progress
- Answer reveal on wrong answers
- Hint system
- Practice history tracking

#### Prayer Training
- Dedicated prayer screen with verse prompts
- Voice recording with waveform animation
- Prayer practice interface

#### Gamification
- Leveling system: Level = sqrt(totalXP/100) + 1
- Streak tracking (consecutive days)
- Achievement badges (First Day, 10 Verses, etc.)
- Leaderboard with real user rankings
- XP progress bar with visual markers
- Daily streak counter

#### UI Components
- Bible Companion (animated book character with breathing animation)
- Themed buttons (clay, gold, olive variants)
- Card component with parchment/cream variants
- Custom verse text & reference displays
- Input fields with biblical styling
- Error boundary for crash handling
- Lesson complete modal

#### Navigation
- Bottom tab navigation (Home, Leaderboard, Profile)
- Stack navigation for screens
- Smooth transitions with custom header styling

### 🎯 Screens

1. **HomeScreen** - Today's verse, action buttons (Read, Understand, Recall, Pray), streak/XP display
2. **VerseCardScreen** - Swipeable flashcards with flip animation
3. **UnderstandScreen** - AI-generated verse context and explanations
4. **RecallScreen** - Practice mode with fill-in-the-blank and speech input
5. **PrayScreen** - Prayer training with voice recording
6. **LeaderboardScreen** - User rankings by XP, level, and streak
7. **ProfileScreen** - User stats, achievements, profile editing
8. **LoginScreen** - Email/password login
9. **SignupScreen** - New user registration

## Database Schema

### Tables
- **profiles** - User profiles with gamification (XP, level, streaks)
- **verses** - 217,715 Bible verses with AI-generated context
- **user_verse_progress** - Learning progress per verse
- **practice_sessions** - Practice history and analytics
- **achievements** - User achievement badges
- **daily_streaks** - Daily activity tracking

### Security
- Row Level Security (RLS) enabled on all tables
- User-scoped access policies
- Public read for verses table
- Secure authentication via Supabase Auth

### Functions & Triggers
- Auto-creates profile on user signup (with default 😊 avatar)
- Auto-updates timestamps
- Performance indexes on critical columns

## Project Structure

```
MemoryVerse/
├── src/
│   ├── components/          # 10 UI components
│   │   ├── BibleCompanion.tsx
│   │   ├── BibleVersePicker.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Input.tsx
│   │   ├── LessonCompleteModal.tsx
│   │   ├── VerseReference.tsx
│   │   └── VerseText.tsx
│   ├── screens/            # 10 screens
│   │   ├── HomeScreen.tsx
│   │   ├── LeaderboardScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── PrayScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── RecallScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── UnderstandScreen.tsx
│   │   └── VerseCardScreen.tsx
│   ├── services/           # Business logic
│   │   ├── achievementService.ts
│   │   ├── authService.ts
│   │   ├── contextGenerator.ts    # AI context generation
│   │   ├── profileService.ts
│   │   └── verseService.ts
│   ├── navigation/         # React Navigation setup
│   │   ├── BottomTabNavigator.tsx
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── theme/             # Design system
│   │   ├── colors.ts
│   │   ├── shadows.ts
│   │   ├── spacing.ts
│   │   └── typography.ts
│   ├── contexts/          # React Context
│   │   └── AuthContext.tsx
│   ├── config/            # Configuration
│   │   ├── env.ts
│   │   └── practiceConfig.ts
│   ├── lib/               # External libraries
│   │   └── supabase.ts
│   ├── types/             # TypeScript types
│   │   └── database.ts
│   └── utils/             # Utilities
│       └── logger.ts      # Production logger
├── supabase/              # Database setup
│   ├── complete-setup.sql
│   └── migrations/
├── scripts/               # Database & utility scripts
│   ├── import-to-supabase.js
│   ├── process-bible-dataset.js
│   ├── generate-contexts.ts
│   └── create-test-users.ts
├── assets/                # Bible translations
│   └── translations/      # 7 JSON Bible translations
├── docs/                  # Additional documentation
├── App.tsx                # Root app with ErrorBoundary
├── .env.example           # Environment template
├── package.json
└── tsconfig.json
```

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Complete setup instructions (2-minute quickstart)
- **[Project Status](PROJECT_STATUS.md)** - Current status, features, roadmap
- **[Production Guide](PRODUCTION_GUIDE.md)** - Deployment and launch checklist
- **[Feature Backlog](BACKLOG.md)** - Wishlist of future features
- **[Bible Translations](README_TRANSLATIONS.md)** - Translation details and statistics
- **[Import Guide](IMPORT_GUIDE.md)** - Database import instructions
- **[Context Generation](docs/CONTEXT_GENERATION.md)** - AI context generation guide

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Supabase account
- AI API key (Perplexity, OpenAI, or Anthropic)

### 2. Database Setup (Required First!)

Run `supabase/complete-setup.sql` in your Supabase SQL Editor. This sets up all tables, policies, and sample data.

**[See detailed instructions →](SETUP_GUIDE.md#database-setup)**

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials:
# - EXPO_PUBLIC_SUPABASE_URL
# - EXPO_PUBLIC_SUPABASE_ANON_KEY
# - EXPO_PUBLIC_PERPLEXITY_API_KEY (or OpenAI/Anthropic)
```

### 4. Install & Run

```bash
# Install dependencies
npm install

# Run the app
npm run ios     # iOS simulator
npm run android # Android emulator
npm run web     # Web (limited features)
```

### 5. Import Bible Translations (Optional)

The app includes 7 Bible translations. To import them:

```bash
# See IMPORT_GUIDE.md for detailed instructions
node scripts/import-to-supabase.js
```

**[Full setup guide →](SETUP_GUIDE.md)**

## Key Components

### BibleCompanion
The friendly book companion that appears on the home screen:
- Breathing animation when idle
- Celebration animations with gold glow
- Sandy beige cover with gold details

### BibleVersePicker
Full Bible verse picker interface:
- Browse by Book → Chapter → Verse
- Random verse selection
- Search functionality

### VerseText & VerseReference
Specialized text components for displaying Scripture with proper biblical typography and styling.

### Card
Versatile card component with parchment/cream variants, elevation, and gentle shadows.

### Button
Themed buttons in multiple variants (clay, gold, olive) with proper spacing and shadows.

### LessonCompleteModal
Practice completion modal with:
- Animated XP display
- Level progress bar
- Celebration animations

## Animations

All animations are smooth and gentle:
- **Duration**: 150-350ms for most transitions
- **Easing**: Gentle cubic-bezier curves
- **Celebrations**: 600ms with spring easing
- **Breathing**: 2-second loop for companion character
- **Page turns**: Flip animation with smooth transitions

## Scripts & Utilities

### Database Scripts
- `import-to-supabase.js` - Direct PostgreSQL import (bypasses API limits)
- `process-bible-dataset.js` - CSV → SQL with categories/difficulty
- `generate-contexts.ts` - Batch AI context generation
- `create-test-users.ts` - Creates test users for development

### Development Scripts
- `nuclear-reset.sh` - Clean rebuild (removes node_modules, cache)
- `setup-ios.sh` - iOS setup automation
- `start-ios-simple.sh` - iOS start script

## AI Context Generation

MemoryVerse uses AI to generate rich context and explanations for Bible verses:

- **Providers:** Perplexity (primary), OpenAI, Anthropic (fallbacks)
- **Features:** Auto-generation, caching in database, rate limiting
- **Batch Processing:** Generate contexts for multiple verses at once
- **Smart Caching:** Contexts stored in DB to avoid redundant API calls

**[See AI setup guide →](docs/CONTEXT_GENERATION.md)**

## 🎯 Roadmap

### ✅ Completed (MVP)
- ✅ User authentication & profiles
- ✅ 7 Bible translations (217,715 verses)
- ✅ AI-generated verse context
- ✅ Verse learning with flashcards
- ✅ Practice mode with speech input
- ✅ Prayer training
- ✅ Gamification (XP, levels, streaks, achievements)
- ✅ Leaderboard
- ✅ Profile editing with avatar selection
- ✅ Bible verse picker

### 🔜 Coming Soon (Phase 2)
- Push notifications for daily reminders
- Offline mode with local caching
- Verse collections and custom study plans
- Social features (friends, sharing)
- Enhanced speech recognition accuracy

### 🚀 Future Features (Phase 3+)
- Premium features (AI prayer coaching, voice-guided meditation)
- Community verse collections
- Advanced analytics dashboard
- Verse memorization games
- Apple Watch companion app

**[Full feature wishlist →](BACKLOG.md)**

## Known Issues

See [PROJECT_STATUS.md](PROJECT_STATUS.md#known-issues) for current known issues:
- Speech recognition error handling needs improvement
- Bible verse picker book loading (workaround: use Random)
- Prayer screen UX refinement needed

## Production Readiness

**~85% ready for App Store launch**

✅ **Complete:**
- All core features functional
- Database schema and RLS policies
- User authentication and profiles
- Gamification system
- AI context generation
- 7 Bible translations loaded

❌ **Before Launch:**
- App icon and splash screen (critical)
- Error tracking (Sentry)
- Analytics (Firebase/Mixpanel)
- Privacy policy and terms of service
- App Store metadata
- Testing suite

**[See production checklist →](PRODUCTION_GUIDE.md)**

## Contributing

This is a personal project. If you'd like to contribute, please reach out first.

## Design Credits

Inspired by:
- Duolingo's gamification and UX patterns
- Historical illuminated manuscripts
- Ancient parchment and textile aesthetics
- Biblical reverence and contemplation

## License

Copyright © 2024 MemoryVerse. All rights reserved.
