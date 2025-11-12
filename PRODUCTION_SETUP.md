# MemoryVerse - Production Setup Guide

**Last Updated:** 2025-11-10
**Estimated Time:** 45-60 minutes
**Status:** All features complete, needs database + configuration

---

## 📋 Quick Checklist

- [ ] **Step 1:** Database Setup (5 min)
- [ ] **Step 2:** Sentry Setup (10 min)
- [ ] **Step 3:** Firebase Analytics (5 min)
- [ ] **Step 4:** Test App (15 min)
- [ ] **Step 5:** App Store Preparation (30+ min)

---

## STEP 1: Database Setup (Supabase)

### 1.1 Create verse_notes Table

Go to Supabase SQL Editor and run this:

```sql
-- Create verse_notes table
CREATE TABLE IF NOT EXISTS verse_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_verse_notes_user_id ON verse_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_verse_notes_verse_id ON verse_notes(verse_id);
CREATE INDEX IF NOT EXISTS idx_verse_notes_updated_at ON verse_notes(updated_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verse_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_verse_notes_updated_at ON verse_notes;
CREATE TRIGGER trigger_update_verse_notes_updated_at
  BEFORE UPDATE ON verse_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_verse_notes_updated_at();
```

### 1.2 Create user_favorites Table

Go to Supabase SQL Editor and run this:

```sql
-- Create user_favorites table for starred/favorited verses
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_verse_id ON user_favorites(verse_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);
```

### 1.3 Fix Missing Columns in profiles Table

The profiles table is missing some columns that are required by the app:

```sql
-- Add missing level column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Add missing verses_memorized column (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verses_memorized INTEGER DEFAULT 0;

-- Update level based on XP (optional - calculates level from existing XP)
UPDATE profiles SET level = FLOOR(total_xp / 100) + 1 WHERE level IS NULL OR level = 0;
```

### 1.4 Fix Missing Columns in practice_sessions Table

The practice_sessions table needs a completed_at column:

```sql
-- Add completed_at column to practice_sessions
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing rows to have completed_at same as created_at if null
UPDATE practice_sessions SET completed_at = created_at WHERE completed_at IS NULL;
```

### 1.5 Create downloaded_books Table

For offline functionality, create the downloaded_books table:

```sql
-- Create downloaded_books table for offline verse storage
CREATE TABLE IF NOT EXISTS downloaded_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_name TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'KJV',
  download_date TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  verse_count INTEGER NOT NULL,
  UNIQUE(user_id, book_name, translation)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_downloaded_books_user_id ON downloaded_books(user_id);
CREATE INDEX IF NOT EXISTS idx_downloaded_books_book_name ON downloaded_books(book_name);
CREATE INDEX IF NOT EXISTS idx_downloaded_books_translation ON downloaded_books(translation);
```

### 1.6 Enable Row Level Security (RLS)

```sql
-- Enable RLS on verse_notes
ALTER TABLE verse_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notes" ON verse_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON verse_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON verse_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON verse_notes;

-- Policy: Users can only see their own notes
CREATE POLICY "Users can view own notes"
  ON verse_notes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert own notes"
  ON verse_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
  ON verse_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON verse_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on user_favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can update own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;

-- Policy: Users can only see their own favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on downloaded_books
ALTER TABLE downloaded_books ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own downloads" ON downloaded_books;
DROP POLICY IF EXISTS "Users can insert own downloads" ON downloaded_books;
DROP POLICY IF EXISTS "Users can update own downloads" ON downloaded_books;
DROP POLICY IF EXISTS "Users can delete own downloads" ON downloaded_books;

-- Policy: Users can only see their own downloads
CREATE POLICY "Users can view own downloads"
  ON downloaded_books FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own downloads
CREATE POLICY "Users can insert own downloads"
  ON downloaded_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own downloads
CREATE POLICY "Users can update own downloads"
  ON downloaded_books FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own downloads
CREATE POLICY "Users can delete own downloads"
  ON downloaded_books FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Users can update their own favorites
CREATE POLICY "Users can update own favorites"
  ON user_favorites FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);
```

### 1.4 Verify Existing Tables

Check that these tables exist and have correct structure:

```sql
-- Verify user_verse_progress exists (for spaced repetition)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_verse_progress';

-- Expected columns:
-- id, user_id, verse_id, status, accuracy_score, attempts,
-- last_practiced_at, next_review_at, mastered_at, created_at, updated_at
```

**If user_verse_progress doesn't exist, create it:**

```sql
CREATE TABLE IF NOT EXISTS user_verse_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verse_id UUID NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'reviewing', 'mastered')),
  accuracy_score DECIMAL(3,2) DEFAULT 0.0,
  attempts INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMPTZ DEFAULT NOW(),
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  mastered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verse_id)
);

CREATE INDEX IF NOT EXISTS idx_user_verse_progress_user_id ON user_verse_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verse_progress_next_review ON user_verse_progress(next_review_at);
CREATE INDEX IF NOT EXISTS idx_user_verse_progress_status ON user_verse_progress(status);

-- RLS Policies for user_verse_progress
ALTER TABLE user_verse_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own progress" ON user_verse_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_verse_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_verse_progress;

CREATE POLICY "Users can view own progress"
  ON user_verse_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_verse_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_verse_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

### 1.4 Test Database Connection

In your Supabase dashboard:
1. Go to **Table Editor**
2. Verify you see `verse_notes` table
3. Try manually inserting a test row (then delete it)

✅ **Database setup complete!**

---

## STEP 2: Sentry Setup (Error Monitoring)

### 2.1 Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up with GitHub or email
3. Choose **React Native** as platform

### 2.2 Create New Project

1. Click **Create Project**
2. Select **React Native**
3. Name it: `memoryverse`
4. Click **Create Project**

### 2.3 Get Your DSN

You'll see a screen with setup instructions. Copy the DSN (looks like):
```
https://xxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxxxx
```

### 2.4 Add DSN to Environment

Edit `/home/user/MemoryVerse/.env`:

```env
# ... existing vars ...

# Sentry Error Tracking
SENTRY_DSN=https://xxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxxxx
SENTRY_ENABLED=true
```

### 2.5 Update Config File

Open `src/config/env.ts` and verify it reads SENTRY_DSN:

```typescript
sentry: {
  dsn: process.env.SENTRY_DSN || '',
  enabled: process.env.SENTRY_ENABLED === 'true',
}
```

### 2.6 Test Sentry

Restart your app and trigger a test error:
1. In Sentry dashboard, go to **Issues**
2. In your app, cause an intentional error
3. Verify error appears in Sentry within 1 minute

✅ **Sentry setup complete!**

---

## STEP 3: Firebase Analytics (Already Configured)

Your app already has Firebase Analytics configured! Just verify:

### 3.1 Check Firebase Console

1. Go to https://console.firebase.google.com/
2. Select your **MemoryVerse** project
3. Go to **Analytics** → **Events**
4. You should see events like:
   - `verse_practiced`
   - `achievement_unlocked`
   - `streak_milestone`

### 3.2 Enable Debug Mode (Optional)

To see real-time analytics during testing:

**iOS:**
```bash
xcrun simctl spawn booted log config --mode "level:debug" --subsystem com.google.firebase.analytics
```

**Android:**
```bash
adb shell setprop debug.firebase.analytics.app com.memoryverse
```

✅ **Firebase Analytics verified!**

---

## STEP 4: Test All New Features

### 4.1 Test Onboarding
1. Delete app from device/simulator
2. Reinstall and sign up as new user
3. Should see 3-screen onboarding tutorial
4. Test "Skip" button
5. Test swiping between screens
6. Tap "Get Started" on final screen

### 4.2 Test Search
1. Go to **Search** tab
2. Search for "love" - should show results
3. Search by reference "John 3:16" - should show exact verse
4. Open **Filters** modal
5. Test filtering by Category, Difficulty, Translation
6. Verify search history shows recent searches

### 4.3 Test Streak Calendar
1. Go to **Profile** tab
2. Tap "🔥 View Streak Calendar"
3. Should see 90-day calendar heatmap
4. Verify milestones show (7, 30, 100, 365 days)
5. Check streak count matches profile

### 4.4 Test Review System
1. Go to **Review** tab
2. Should see verses due for review (if any)
3. Practice a verse from RecallScreen
4. Return to Review tab - should update

### 4.5 Test Study Notes
1. Go to **Profile** → "📝 Study Notes"
2. Should show notes list (empty if none yet)
3. To add a note: Go to a verse, add note in VerseCardScreen
4. Verify note appears in Notes screen
5. Test editing a note
6. Test deleting a note
7. Test searching notes

✅ **All features tested!**

---

## STEP 5: App Store Preparation

### 5.1 Generate App Icons

**Use this tool:** https://www.appicon.co/

Upload a 1024x1024 image and download all sizes.

**Required Sizes:**
- iOS: 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024
- Android: 48x48, 72x72, 96x96, 144x144, 192x192, 512x512

### 5.2 Create Splash Screen

Use Figma or Photoshop to create:
- 2048x2048 splash screen with MemoryVerse branding
- Warm parchment background (#FAF8F3)
- Simple logo/text in center

### 5.3 Take Screenshots

**iOS (6.5" and 5.5" displays):**
1. Home screen showing today's verse
2. Verse practice screen (RecallScreen)
3. Streak calendar with milestones
4. Review screen with verses
5. Study notes screen

**Android (Phone and Tablet):**
Same 5 screenshots as above

**Pro tip:** Use https://screenshots.pro/ to add device frames

### 5.4 Write App Store Description

**Title:** MemoryVerse - Bible Memory Made Easy

**Subtitle:** Learn Scripture through spaced repetition

**Description:**
```
Master Bible verses naturally with MemoryVerse - the scripture memory app inspired by the best language learning apps.

🎯 SMART LEARNING SYSTEM
• Spaced repetition algorithm ensures verses stick
• Review verses at the perfect time for retention
• AI-powered prayer coaching guides your practice
• Track accuracy and see your progress grow

🔥 BUILD LASTING HABITS
• Daily streak tracking with visual calendar
• Milestone achievements (7, 30, 100+ days)
• Personalized notifications keep you on track
• Streak freeze for premium members

📖 POWERFUL STUDY TOOLS
• Search 1000+ verses by keyword or reference
• Add personal study notes to any verse
• Multiple translations (KJV, NIV, ESV, NASB)
• Filter by category, difficulty, or Bible book

🎮 ENGAGING & FUN
• Interactive practice modes
• Voice recording and playback
• XP and leveling system
• Global leaderboard

📱 BEAUTIFUL DESIGN
• Warm, parchment-inspired interface
• Smooth animations and haptic feedback
• Dark mode support
• Offline practice available

Whether you're starting your scripture memory journey or building on years of practice, MemoryVerse makes it easy, effective, and enjoyable.

PREMIUM FEATURES
• Unlimited streak freezes
• Advanced analytics
• Priority support
• Ad-free experience

Download now and start building your Bible memory today!
```

### 5.5 Keywords (iOS)

```
bible,scripture,memory,verses,learn,study,christian,faith,religion,devotional
```

### 5.6 Category

- **Primary:** Education
- **Secondary:** Reference

### 5.7 Age Rating

- 4+ (No objectionable content)

### 5.8 Privacy Policy & Terms

**You need to create and host these.**

**Quick option:** Use https://www.freeprivacypolicy.com/

Required sections:
- What data you collect (email, practice history, notes)
- How you use it (improve app, sync across devices)
- Third parties (Firebase Analytics, Sentry)
- User rights (delete account, export data)

Host on:
- Your website (best)
- GitHub Pages (free option)
- Notion (quick option)

**Add links to your .env:**
```env
PRIVACY_POLICY_URL=https://yoursite.com/privacy
TERMS_OF_SERVICE_URL=https://yoursite.com/terms
```

✅ **App Store prep complete!**

---

## STEP 6: Create App Store Connect Listing

### 6.1 iOS App Store

1. Go to https://appstoreconnect.apple.com/
2. Click **My Apps** → **+ (New App)**
3. Fill in:
   - **Platform:** iOS
   - **Name:** MemoryVerse
   - **Primary Language:** English
   - **Bundle ID:** com.yourcompany.memoryverse
   - **SKU:** memoryverse-001

4. Upload screenshots, description, keywords
5. Set pricing (Free or Paid)
6. Add in-app purchases (if premium)

### 6.2 Google Play Console

1. Go to https://play.google.com/console/
2. Click **Create app**
3. Fill in app details
4. Upload screenshots, description
5. Set pricing and distribution

✅ **Store listings created!**

---

## STEP 7: Final Testing Checklist

### Critical Tests

- [ ] Sign up new account
- [ ] Complete onboarding
- [ ] Practice a verse (RecallScreen)
- [ ] Check Review tab shows verses
- [ ] Add a study note
- [ ] View note in Notes screen
- [ ] Search for a verse
- [ ] View streak calendar
- [ ] Test offline mode
- [ ] Test push notifications
- [ ] Test audio recording
- [ ] Sign out and sign back in

### Device Testing

- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (notch)
- [ ] iPad (tablet layout)
- [ ] Android phone
- [ ] Android tablet

### Edge Cases

- [ ] No internet connection
- [ ] Very long verse text
- [ ] Special characters in notes
- [ ] Empty states (no notes, no reviews)

✅ **All tests passing!**

---

## STEP 8: Submit to App Store

### 8.1 Build for Production

**iOS:**
```bash
cd ios
pod install
cd ..
npx react-native run-ios --configuration Release
```

**Android:**
```bash
cd android
./gradlew bundleRelease
```

### 8.2 Upload Build

**iOS (via Xcode):**
1. Open `ios/MemoryVerse.xcworkspace` in Xcode
2. Select **Any iOS Device** as target
3. Product → Archive
4. Distribute App → App Store Connect
5. Upload

**Android (via Console):**
1. Go to Play Console
2. Release → Production
3. Upload `app-release.aab` from `android/app/build/outputs/bundle/release/`

### 8.3 Submit for Review

- **iOS:** Usually 1-3 days
- **Android:** Usually 1-7 days

✅ **App submitted!**

---

## TROUBLESHOOTING

### "verse_notes table doesn't exist"
→ Run Step 1.1 SQL again in Supabase

### "Review tab is empty"
→ Practice some verses first (RecallScreen saves review data now)

### "Sentry not tracking errors"
→ Check SENTRY_DSN is correct in .env, restart app

### "Build fails on iOS"
→ Run `cd ios && pod install && cd ..`

### "Build fails on Android"
→ Run `cd android && ./gradlew clean && cd ..`

---

## WHAT'S NEXT?

After launch:
1. Monitor Sentry for crashes
2. Check Firebase Analytics for user behavior
3. Gather user feedback
4. Plan v1.1 features (Analytics Dashboard, Collections)

---

## SUPPORT

If you get stuck:
1. Check Supabase logs (Database → Logs)
2. Check Sentry issues
3. Review React Native error messages
4. Check network requests in browser DevTools

---

**You're ready to launch! 🚀**

All technical work is complete. Just follow these steps tonight and you'll be production-ready!
