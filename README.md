# MemoryVerse

A Scripture memorization mobile app in the style of Duolingo, designed for Bible verses with a beautiful biblical theme.

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
5. **Celebratory Success**: Gold highlights, gentle confetti, olive checkmarks

## Features

### 1. Home Screen
- Today's Verse card with large serif text
- Four action buttons: Read, Understand, Recall, Recite
- Bible companion character (animated closed book)
- Streak counter with flame icon
- XP counter with star icon
- Daily progress tracking

### 2. Verse Card Screen
- Full-screen verse display with parchment background
- Context/explanation toggle
- Smooth page turn animations
- Progress dots indicator
- Decorative gold borders (illuminated manuscript style)

### 3. Recall/Recite Screen
- Blurred verse preview
- Text input for typing recall
- Microphone button for voice recital
- Animated audio waveform during recording
- Real-time feedback (olive checkmark or helpful suggestions)
- Hint system

### 4. Leaderboard Screen
- Weekly and All-Time tabs
- Top 10 users with ornate gold frames
- Illuminated manuscript theme with decorative borders
- User rank highlighting in burnished gold
- Streak and XP display for each user

### 5. Profile Screen
- User avatar and level badge
- XP progress bar with ornate markers
- Statistics grid (streak, verses learned, perfect recitals)
- Achievement badges with ornate gold designs
- Badges earn decorations based on streak milestones

### 6. Bible Companion Character
- Cute closed book with friendly face
- Sandy beige cover with gold details
- Breathing animation when idle
- Growing ornate decorations with streak progress
- Celebratory animation (grows, glows, sparkles)
- Tap to interact and open chat feature

## Project Structure

```
MemoryVerse/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BibleCompanion.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── VerseText.tsx
│   │   └── VerseReference.tsx
│   ├── screens/            # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── VerseCardScreen.tsx
│   │   ├── RecallScreen.tsx
│   │   ├── LeaderboardScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/         # Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── BottomTabNavigator.tsx
│   │   └── types.ts
│   └── theme/             # Design system
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       ├── shadows.ts
│       └── index.ts
├── App.tsx
├── package.json
└── README.md
```

## 📚 Documentation

- **[Getting Started Guide](GETTING_STARTED.md)** - Complete setup instructions
- **[Production Guide](PRODUCTION_GUIDE.md)** - Deployment and launch checklist
- **[Feature Backlog](BACKLOG.md)** - Wishlist of future features

## 🚀 Quick Start

### 1. Database Setup (Required First!)

Run `supabase/complete-setup.sql` in your Supabase SQL Editor. This sets up all tables, policies, and sample data.

**[See detailed instructions →](GETTING_STARTED.md#1-database-setup-5-minutes)**

### 2. Install & Run

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Run the app
npm run ios     # iOS
npm run android # Android
npm run web     # Web (limited features)
```

### 3. Test Account

Login with:
- Email: `pintayo.dev@gmail.com`
- Password: [Your password]

Or create a new account through signup.

**[Full getting started guide →](GETTING_STARTED.md)**

## Key Components

### BibleCompanion
The friendly book companion that grows more ornate as users build their streak. Features:
- Breathing animation
- Progressive ornamentation (3 levels)
- Celebration animations with gold glow
- Tap interaction

### VerseText & VerseReference
Specialized text components for displaying Scripture with proper biblical typography and styling.

### Card
Versatile card component with parchment/cream variants, elevation, and ornate borders for special occasions.

### Button
Themed buttons in multiple variants (clay, gold, olive) with proper spacing and shadows.

## Animations

All animations are smooth and gentle:
- **Duration**: 250-350ms for most transitions
- **Easing**: Gentle cubic-bezier curves
- **Celebrations**: 600ms with spring easing
- **Page turns**: Parchment ripple effect with 3D rotation
- **Breathing**: 2-second loop for companion character

## 🎯 Roadmap & Features

**Current Status**: MVP Complete - All core features working!

### ✅ Completed
- User authentication & profiles
- Verse learning with AI context generation
- Practice/Recall mode with voice input
- Prayer training
- Gamification (XP, levels, streaks, achievements)
- Leaderboard
- Profile editing with avatar selection

### 🔜 Coming Soon
- Push notifications for daily reminders
- Offline mode
- Verse collections
- Social features
- Premium features (AI prayer coaching, voice-guided prayer)

**[Full feature wishlist →](BACKLOG.md)**

## Design Credits

Inspired by:
- Duolingo's gamification and UX patterns
- Historical illuminated manuscripts
- Ancient parchment and textile aesthetics
- Biblical reverence and contemplation

## License

Copyright © 2024 MemoryVerse. All rights reserved.
