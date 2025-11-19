# ⚙️ MemoryVerse Setup Guide

**Complete setup guide for local development and production deployment**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Third-Party Services](#third-party-services)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

**Node.js & Package Manager**
```bash
# Install Node.js 18+ (LTS recommended)
node --version  # Should be 18.x or higher
npm --version   # or yarn/pnpm
```

**React Native Environment**
```bash
# Install React Native CLI
npm install -g react-native-cli

# iOS (macOS only)
brew install cocoapods
xcode-select --install

# Android
# Install Android Studio
# Set up Android SDK
# Add to ~/.zshrc or ~/.bashrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**EAS CLI (for builds)**
```bash
npm install -g eas-cli
eas login
```

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/memoryverse.git
cd memoryverse
```

### 2. Install Dependencies

```bash
# Install Node modules
npm install

# Install iOS pods (macOS only)
cd ios && pod install && cd ..
```

### 3. Environment Configuration

Create `.env` file:
```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

Required environment variables:
```bash
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# RevenueCat (required for premium features)
REVENUECAT_API_KEY_IOS=your-ios-key
REVENUECAT_API_KEY_ANDROID=your-android-key

# Sentry (optional - error tracking)
SENTRY_DSN=your-sentry-dsn

# OpenAI (optional - for verse context generation)
OPENAI_API_KEY=your-openai-key
```

### 4. Run Development Server

**iOS**
```bash
# Start Metro bundler
npm start

# In another terminal, run iOS
npm run ios
# or
npx react-native run-ios
```

**Android**
```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android
# or
npx react-native run-android
```

---

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Set project name: `memoryverse-dev`
5. Generate secure database password
6. Choose region closest to you
7. Click "Create new project"

### 2. Get API Keys

```bash
# Navigate to Project Settings > API
# Copy these values:
# - Project URL (SUPABASE_URL)
# - anon/public key (SUPABASE_ANON_KEY)
```

### 3. Run Migrations

Navigate to SQL Editor in Supabase Dashboard and run each migration file in order:

```sql
-- Run these in Supabase SQL Editor (in order):
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_context_columns.sql
supabase/migrations/003_add_verses_update_policy.sql
supabase/migrations/004_add_chapter_contexts.sql
supabase/migrations/005_fix_chapter_contexts_schema.sql
supabase/migrations/006_add_daily_verses.sql
supabase/migrations/007_add_subscription_tier.sql
supabase/migrations/008_add_premium_features.sql
supabase/migrations/009_fix_bible_picker_functions.sql
supabase/migrations/010_add_story_mode_notifications.sql
supabase/migrations/011_add_daily_activities.sql
supabase/migrations/012_fix_daily_verse_timezone.sql
```

### 4. Seed Database (Optional)

If you have seed data:
```bash
# Import Bible verses
psql "your-supabase-connection-string" < supabase/seed-bible-verses.sql

# Or use Supabase SQL Editor
# Copy and paste seed file contents
```

### 5. Setup Storage Buckets

If you're using image storage:
```bash
# In Supabase Dashboard > Storage
# Create buckets:
1. "verse-images" (public)
2. "user-avatars" (public)
3. "achievements" (public)
```

---

## Third-Party Services

### RevenueCat (Subscriptions)

**1. Create Account**
- Go to [revenuecat.com](https://www.revenuecat.com)
- Sign up for free account
- Create new project

**2. Setup iOS Products**
```bash
# In App Store Connect:
1. Create in-app purchases
2. Note product IDs (e.g., "memoryverse_premium_monthly")

# In RevenueCat:
1. Add iOS app
2. Configure products
3. Copy API keys
```

**3. Setup Android Products**
```bash
# In Google Play Console:
1. Create in-app products
2. Note product IDs

# In RevenueCat:
1. Add Android app
2. Configure products
3. Copy API keys
```

**4. Configure Entitlements**
```bash
# In RevenueCat Dashboard:
1. Go to "Entitlements"
2. Create "Premium" entitlement
3. Attach products to entitlement
```

See `docs/REVENUECAT_SETUP.md` for detailed instructions.

### Sentry (Error Tracking)

**1. Create Account**
- Go to [sentry.io](https://sentry.io)
- Sign up for free account
- Create new project (React Native)

**2. Get DSN**
```bash
# Copy DSN from project settings
# Add to .env file
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**3. Test Integration**
```javascript
// Test error tracking
import * as Sentry from '@sentry/react-native';

Sentry.captureMessage('Test from MemoryVerse');
```

See `docs/SENTRY_TRACKING.md` for detailed instructions.

### Firebase (Optional - Analytics)

**1. Create Project**
- Go to [console.firebase.google.com](https://console.firebase.google.com)
- Create new project
- Add iOS and Android apps

**2. Download Config Files**
```bash
# iOS: Download GoogleService-Info.plist
# Place in: ios/MemoryVerse/GoogleService-Info.plist

# Android: Download google-services.json
# Place in: android/app/google-services.json
```

**3. Install Dependencies**
```bash
npm install @react-native-firebase/app
npm install @react-native-firebase/analytics

# iOS
cd ios && pod install && cd ..
```

See `docs/FIREBASE_SETUP.md` for detailed instructions.

---

## Production Deployment

### 1. Update Version Numbers

```json
// app.json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    },
    "android": {
      "versionCode": 1
    }
  }
}
```

### 2. Production Environment

Create `.env.production`:
```bash
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
REVENUECAT_API_KEY_IOS=your-prod-ios-key
REVENUECAT_API_KEY_ANDROID=your-prod-android-key
SENTRY_DSN=your-prod-sentry-dsn
```

### 3. Build for iOS

**Using EAS Build (Recommended)**
```bash
# Configure EAS
eas build:configure

# Build for iOS App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**Local Build (Alternative)**
```bash
# Open Xcode
open ios/MemoryVerse.xcworkspace

# In Xcode:
1. Select "Generic iOS Device"
2. Product > Archive
3. Distribute App > App Store Connect
4. Follow prompts
```

### 4. Build for Android

**Using EAS Build (Recommended)**
```bash
# Build for Google Play
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

**Local Build (Alternative)**
```bash
# Generate signed AAB
cd android
./gradlew bundleRelease

# AAB file location:
# android/app/build/outputs/bundle/release/app-release.aab

# Upload to Google Play Console manually
```

### 5. Post-Deployment

**Verify**
- [ ] App loads correctly
- [ ] Database connections work
- [ ] Subscriptions process
- [ ] Analytics tracking
- [ ] Error tracking

**Monitor**
- [ ] Sentry for crashes
- [ ] Analytics for usage
- [ ] RevenueCat for revenue
- [ ] App Store reviews

---

## Troubleshooting

### Common Issues

**Metro Bundler Issues**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear all caches
watchman watch-del-all
rm -rf node_modules
npm install
cd ios && pod install && cd ..
```

**iOS Build Errors**
```bash
# Clean build folder
cd ios && xcodebuild clean && cd ..

# Reinstall pods
cd ios && rm -rf Pods && pod install && cd ..

# Reset derived data
rm -rf ~/Library/Developer/Xcode/DerivedData
```

**Android Build Errors**
```bash
# Clean Gradle
cd android && ./gradlew clean && cd ..

# Clear Gradle cache
rm -rf ~/.gradle/caches
```

**Database Connection Issues**
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Test connection
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key"
```

**Subscription Issues**
```bash
# Verify RevenueCat setup
1. Check API keys in .env
2. Verify products in RevenueCat dashboard
3. Test in sandbox mode (iOS) or test account (Android)
```

### Getting Help

**Documentation**
- See `DOCUMENTATION.md` for code documentation
- See `docs/` folder for specific guides
- See `README.md` for project overview

**Support**
- GitHub Issues: [Report a bug](https://github.com/yourusername/memoryverse/issues)
- Email: dev@memoryverse.app
- Discord: [Join our community]

**Useful Commands**
```bash
# Check React Native setup
npx react-native doctor

# Check EAS setup
eas doctor

# View logs
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

---

## Quick Reference

**Start Development**
```bash
npm start                    # Start Metro bundler
npm run ios                  # Run on iOS simulator
npm run android              # Run on Android emulator
npm test                     # Run tests
npm run lint                 # Lint code
```

**Build Commands**
```bash
eas build --platform ios     # Build iOS
eas build --platform android # Build Android
eas submit                   # Submit to stores
```

**Database Commands**
```bash
# Run migrations in Supabase SQL Editor
# See supabase/migrations/ folder
```

**Useful Links**
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [RevenueCat Docs](https://docs.revenuecat.com)
- [Sentry Docs](https://docs.sentry.io)

---

**Last Updated**: November 2025
