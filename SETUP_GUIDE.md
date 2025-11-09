# 🚀 MemoryVerse Setup Guide

Complete setup instructions to get MemoryVerse running on your machine.

---

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **iOS Simulator** (Xcode on Mac) or **Android Emulator** (Android Studio)
- **Supabase account** ([Sign up](https://supabase.com))
- **Perplexity API key** ([Get key](https://www.perplexity.ai/))

---

## ⚡ Quick Start (2 Minutes)

### 1. Run Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your MemoryVerse project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire content of `supabase/complete-setup.sql`
6. Paste it into the SQL editor
7. Click **RUN** (or press Cmd+Enter / Ctrl+Enter)

✅ **Expected Output:**
```
Setup complete!
verse_count: 50 (test verses)
user_count: 1 (your profile)
```

### 2. Install Dependencies

```bash
cd MemoryVerse
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env`:
```bash
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux
```

Edit `.env` with your credentials (see [Environment Setup](#environment-setup) below).

### 4. Run the App

```bash
# iOS (Recommended for Development)
npm run ios

# Android
npm run android

# Web (Limited Functionality)
npm run web
```

✅ **You're done!** The app should launch and you can log in.

---

## 🔑 Environment Setup

### Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Get **Direct Connection** string → `DATABASE_URL` (for import scripts)
   - Go to **Project Settings** → **Database** → **Connection String**
   - Select **Direct connection**
   - Copy the full connection string

### Get Perplexity API Key

1. Go to [Perplexity AI](https://www.perplexity.ai/)
2. Sign up / Log in
3. Navigate to API settings
4. Generate an API key
5. Copy to `EXPO_PUBLIC_PERPLEXITY_API_KEY`

### Your `.env` File

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Direct Database Connection (for import scripts)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# AI Context Generation (Required)
EXPO_PUBLIC_AI_PROVIDER=perplexity
EXPO_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key_here
EXPO_PUBLIC_PERPLEXITY_MODEL=sonar

# Optional: OpenAI (fallback)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
EXPO_PUBLIC_OPENAI_MODEL=gpt-4o-mini

# Optional: Anthropic (fallback)
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key_here
EXPO_PUBLIC_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Rate Limiting Configuration
EXPO_PUBLIC_AI_RATE_LIMIT_RPM=50
EXPO_PUBLIC_AI_BATCH_SIZE=10
EXPO_PUBLIC_AI_RETRY_ATTEMPTS=3
EXPO_PUBLIC_AI_RETRY_DELAY_MS=1000
```

---

## 📖 Import Bible Translations (Optional)

The `complete-setup.sql` includes 50 test verses. To load all 7 Bible translations (217,715 verses):

### Option 1: Automatic Import (Recommended)

```bash
# Make sure DATABASE_URL is set in .env
node scripts/import-to-supabase.js
```

This will:
- Connect directly to your Supabase database
- Import all 7 translations (ASV, BBE, DBY, KJV, WBT, WEB, YLT)
- Take about 1 minute (~8-10 seconds per translation)
- Verify import was successful

See [IMPORT_GUIDE.md](IMPORT_GUIDE.md) for detailed instructions.

### Option 2: Manual SQL Import

If you prefer, you can manually copy/paste each SQL file from `supabase/` directory. However, the automatic script is much faster.

---

## 🧪 Test Your Setup

### 1. Create Test Account

When you first run the app:
1. Click "Sign Up"
2. Create account with your email
3. You'll automatically get a 😊 avatar

Or use existing test account (if you set it up):
- Email: `pintayo@memoryverse.app`
- Password: `Tijdelijk123`

### 2. Test Features

**✅ Feature Checklist:**

#### Verse Learning
- Navigate to "Learn Verse"
- Long verses should scroll smoothly (no text cutoff)
- Click "Show Context" → AI generates context in 2-5 seconds
- Context saves to database (instant reload next time)

#### Practice Mode
- Navigate to "Practice Verse"
- Should show 5 verses per lesson
- Fill-in-the-blank practice works
- "Give Answer" and "Check Answer" buttons visible
- XP awarded based on accuracy
- Lesson complete modal shows score & XP

#### Profile
- Go to Profile tab
- Shows real user data (XP, level, streak)
- Click "Edit Profile" → Change avatar & name
- Achievements display correctly

#### Prayer Mode
- Navigate to "Pray"
- Tap mic button
- Waveform animation appears
- No console errors

#### Leaderboard
- View leaderboard rankings
- Your profile is highlighted
- Shows real user data

---

## 🛠️ Development Tips

### View Logs

```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

### Clear Cache (if issues)

```bash
npm start -- --reset-cache
```

### Rebuild

```bash
# iOS
cd ios && pod install && cd ..
npm run ios

# Android
cd android && ./gradlew clean && cd ..
npm run android
```

### Reset Database

To start fresh:
1. Go to Supabase SQL Editor
2. Run `supabase/complete-setup.sql` again
3. It's idempotent (safe to run multiple times)

---

## 🔧 Common Issues

### "Cannot connect to Metro"
```bash
npm start -- --reset-cache
```

### "No bundle URL present"
```bash
rm -rf ios/build
npm run ios
```

### "Supabase auth error"
- Check `.env` file exists and has correct credentials
- Verify RLS policies in Supabase Dashboard
- Make sure you ran `complete-setup.sql`

### "AI context not generating"
- Verify Perplexity API key is valid and in `.env`
- Check console for API errors
- Ensure model name is correct: `sonar`
- Try fallback: set `EXPO_PUBLIC_AI_PROVIDER=openai` or `anthropic`

### "Database connection failed" (import script)
- Check DATABASE_URL is correct in `.env`
- Verify your database password is correct
- If on IPv4-only network, change port from `5432` to `6543` (Session Pooler)
- Check firewall allows PostgreSQL connections

---

## 📚 Project Structure

```
MemoryVerse/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/           # App screens (Home, Practice, Profile, etc.)
│   ├── contexts/          # React Context (Auth, etc.)
│   ├── services/          # Business logic & API calls
│   │   └── ai/            # AI context generation
│   ├── utils/             # Utilities (logger, helpers)
│   └── theme.ts           # Theme configuration
├── assets/
│   └── translations/      # Bible JSON files
├── scripts/               # Utility scripts
│   ├── convert-csv-to-json.js
│   ├── process-bible-dataset.js
│   └── import-to-supabase.js
├── supabase/
│   ├── complete-setup.sql # Main database setup
│   └── test-data-simple.sql
├── .env                   # Your environment variables (gitignored)
├── .env.example           # Environment template
└── package.json
```

---

## 📱 Running on Physical Devices

### iOS (iPhone/iPad)

1. Open `ios/MemoryVerse.xcworkspace` in Xcode
2. Select your device from the dropdown
3. Click Run (▶️)
4. Trust the developer certificate on your device

Or via Expo:
```bash
npm start
# Scan QR code with Camera app on iPhone
```

### Android

1. Enable Developer Mode on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Run: `npm run android`

Or via Expo:
```bash
npm start
# Scan QR code with Expo Go app on Android
```

---

## 🚀 Next Steps

### After Setup

1. **Read Documentation**
   - [PROJECT_STATUS.md](PROJECT_STATUS.md) - Project overview & roadmap
   - [BACKLOG.md](BACKLOG.md) - Feature wishlist
   - [PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md) - Deployment guide

2. **Explore Code**
   - Start with `App.tsx`
   - Check `src/screens/` for main screens
   - Review `src/services/` for business logic

3. **Contribute**
   - Pick a feature from BACKLOG.md
   - Fix a bug from PROJECT_STATUS.md
   - Improve documentation

### Before Production

See [PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md) for complete production checklist including:
- App icon & splash screen
- Privacy policy & terms of service
- Error tracking (Sentry)
- App Store submission
- And more...

---

## 🆘 Need Help?

- **Documentation**: Check other `.md` files in the project
- **Issues**: Review PROJECT_STATUS.md → Known Issues
- **Questions**: Create an issue on GitHub (if set up)
- **Support**: support@memoryverse.app (to be set up)

---

## 🎉 You're Ready!

Once setup is complete:
- ✅ Database configured with test data
- ✅ All 7 Bible translations loaded (if you ran import script)
- ✅ App running on iOS/Android
- ✅ AI context generation working
- ✅ Ready to develop or test!

**Happy developing!** 📖✨
