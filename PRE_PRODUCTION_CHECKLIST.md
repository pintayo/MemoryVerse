# 🚀 MemoryVerse - Pre-Production Checklist

**Goal**: Launch on iOS App Store & Google Play Store
**Timeline**: Complete ASAP for production build
**Current Status**: ~90% Ready

---

## ✅ COMPLETED ITEMS

### App Configuration
- [x] App icon configured (assets/icon.png - 1024x1024)
- [x] Splash screen configured (assets/splash.png)
- [x] app.json fully configured with metadata
- [x] Bundle identifiers set (com.pintayo.memoryverse)
- [x] Privacy policy URL added (https://pintayo.com/privacy.html)
- [x] Terms of service URL added (https://pintayo.com/terms.html)
- [x] Support email configured (support@pintayo.com)

### Core Features
- [x] Authentication system working
- [x] Bible content loaded (217,715 verses, 7 translations)
- [x] Verse learning flow complete
- [x] Practice mode with speech input
- [x] Prayer generation with AI
- [x] Gamification (XP, levels, streaks)
- [x] Leaderboard functional
- [x] Profile management
- [x] Content moderation (input + output validation)

### UX Improvements
- [x] Home screen engagement system (streak urgency, XP progress, daily goals)
- [x] Premium screen bullet points
- [x] Faith-centered messaging
- [x] Biblical motivation throughout

### Code Quality
- [x] Production logger implemented
- [x] Error handling in place
- [x] Database RLS policies configured
- [x] Input/output validation for AI features

---

## 🔴 CRITICAL - MUST DO BEFORE PRODUCTION

### 1. Create Android Adaptive Icon (15 minutes)
**Status**: ❌ Missing - BLOCKER for Android
**File**: `assets/adaptive-icon.png`
**Requirement**: 1024x1024 PNG with transparent background
**Action**:
```bash
# Option 1: Use same icon as main icon
cp assets/icon.png assets/adaptive-icon.png

# Option 2: Create separate adaptive icon with just the logo (no background)
# - Should be centered on transparent background
# - Safe zone: keep important elements in center 66% of canvas
```

### 2. Test Core App Flow (30 minutes)
**Status**: ❌ Not tested
**Critical Path to Test**:
```
1. Sign up new account
   ✓ Email validation works
   ✓ Profile created with default avatar
   ✓ Redirected to home screen

2. Home screen loads
   ✓ Today's verse displays
   ✓ Streak shows correctly (0 days for new user)
   ✓ XP shows 0
   ✓ Daily goal shows 0/5

3. Read a verse
   ✓ Verse card displays correctly
   ✓ Can flip card
   ✓ Text is readable

4. Practice a verse
   ✓ Fill-in-the-blank works
   ✓ Can type answer
   ✓ Correct/incorrect feedback shows
   ✓ XP increases after completion
   ✓ Level progress updates
   ✓ Daily goal increments

5. Try "Tell About Your Day" prayer (PREMIUM)
   ✓ Shows premium gate for free users
   ✓ For premium users:
     - Can type "I had a shit day" (should work)
     - AI generates appropriate biblical prayer
     - Usage counter decrements
     - Prayer displays correctly

6. Check streak next day
   ✓ Streak urgency banner shows (if not practiced)
   ✓ Banner disappears after practicing
   ✓ Streak increments correctly

7. Logout and login
   ✓ Session persists
   ✓ Data loads correctly
```

### 3. Verify Privacy Policy & Terms URLs (2 minutes)
**Status**: ❌ Not verified
**Action**:
```bash
# Test in browser:
1. Visit https://pintayo.com/privacy.html - should load
2. Visit https://pintayo.com/terms.html - should load
3. Both should be mobile-friendly
4. Both should mention:
   - MemoryVerse app
   - Data collection (email, practice data, AI usage)
   - RevenueCat for payments
   - User rights (GDPR compliance)
```

### 4. Configure EAS Project (10 minutes)
**Status**: ❌ Not configured
**Action**:
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo account
eas login

# 3. Configure project (creates eas.json)
eas build:configure

# 4. Update app.json with project ID
# After running build:configure, copy the project ID to app.json:
# "extra": { "eas": { "projectId": "abc-123-xyz" } }
```

---

## 🟡 HIGH PRIORITY - BEFORE APP STORE SUBMISSION

### 5. App Store Screenshots (1-2 hours)
**Status**: ❌ Not created
**Requirements**:
- **iOS**: 6.5" (iPhone 14 Pro Max) - Required
- **Android**: 1080x1920 or similar - Required
- **Quantity**: 4-8 screenshots showing key features

**What to Screenshot**:
1. **Home Screen** - Show streak, XP progress, daily goal, today's verse
2. **Practice Mode** - Fill-in-the-blank with correct answer
3. **Level Up Celebration** - Show level badge, XP earned
4. **Prayer Feature** - "Tell About Your Day" with generated prayer
5. **Verse Card** - Beautiful verse display with flip animation
6. **Profile Screen** - Achievements, stats, avatar selection
7. **Leaderboard** - Show rankings (optional)
8. **Premium Screen** - Show pricing and features (optional)

**Tools**:
```bash
# Option 1: Expo Go + Screenshot tool
# Run: expo start
# Open on physical device
# Take screenshots with device

# Option 2: iOS Simulator
# Run on simulator
# Cmd + S to take screenshots
# Screenshots saved to Desktop

# Option 3: Android Emulator
# Use built-in screenshot button
```

**Post-Processing**:
- Add device frames using [Shotsnapp](https://shotsnapp.com/) or [Previewed](https://previewed.app/)
- Add text overlay explaining each feature (optional but recommended)
- Use biblical/parchment aesthetic backgrounds

### 6. Write App Store Description (1 hour)
**Status**: ❌ Not written
**Components Needed**:

**App Title** (30 chars max):
```
MemoryVerse - Bible Memory
```

**Subtitle** (30 chars max):
```
Scripture Like Duolingo
```

**Promotional Text** (170 chars max - iOS only):
```
Hide God's Word in your heart! Daily Bible memorization with gamification, AI-powered prayers, and beautiful progress tracking. Start your spiritual journey today.
```

**Description** (4000 chars max):
```
MEMORIZE SCRIPTURE LIKE DUOLINGO

MemoryVerse makes Bible memorization addictive, beautiful, and spiritually enriching. Build daily habits, track your progress, and hide God's Word in your heart with modern gamification and faith-centered design.

🔥 DAILY STREAK SYSTEM
Build consistency with our streak tracker. Practice daily to maintain your fire! Get encouraging reminders with biblical motivation: "Train yourself to be godly" - 1 Timothy 4:7

⭐ XP & LEVELING
Earn XP for every verse practiced. Watch your level grow as you memorize more Scripture. See constant progress toward spiritual mastery!

🎯 DAILY SPIRITUAL GOALS
Set and achieve daily verse goals (default 5 verses/day). Track your progress with beautiful circular widgets and encouraging messages: "I have hidden your word in my heart" - Psalm 119:11

📖 7 BIBLE TRANSLATIONS
- King James Version (KJV)
- American Standard Version (ASV)
- World English Bible (WEB)
- Young's Literal Translation (YLT)
- And more!

🧠 EFFECTIVE LEARNING METHODS
- Swipeable flashcards with flip animations
- Fill-in-the-blank practice
- Speech recognition for recitation
- AI-generated context and explanations
- Spaced repetition for long-term retention

🙏 AI-POWERED PRAYER (PREMIUM)
Share about your day - good or bad - and receive personalized biblical prayers crafted with AI. Your authentic struggles transformed into encouraging, scripture-based prayers.

✨ PREMIUM FEATURES
- Unlimited AI daily prayers personalized for you
- Access to all Bible translations
- Unlimited streak freezes
- Advanced analytics
- Priority support
- And many more!

📊 BEAUTIFUL PROGRESS TRACKING
- Visual XP progress bars
- Level badges and achievements
- Streak calendar heatmap
- Verse mastery tracking
- Leaderboard rankings

🎨 REVERENT DESIGN
Warm parchment aesthetics inspired by ancient manuscripts. Every detail designed to create a peaceful, focused memorization experience.

WHY MEMORYVERSE?
"Thy word have I hid in mine heart, that I might not sin against thee." - Psalm 119:11

We believe Scripture memorization transforms lives. MemoryVerse makes it accessible, enjoyable, and sustainable through modern UX design and timeless biblical wisdom.

PERFECT FOR:
- Daily Bible study
- Scripture memorization challenges
- Building spiritual discipline
- Church small groups
- Youth ministry programs
- Personal spiritual growth
- Homeschool Bible education

START YOUR JOURNEY TODAY
Download MemoryVerse and begin hiding God's Word in your heart. Build a daily habit that strengthens your faith and transforms your life.

---

Privacy Policy: https://pintayo.com/privacy.html
Terms of Service: https://pintayo.com/terms.html
Support: support@pintayo.com
```

**Keywords** (100 chars max - separate with commas):
```
bible,scripture,memorization,memory,verses,christianity,faith,prayer,study,god,jesus,devotional
```

**Category**:
- **Primary**: Reference
- **Secondary**: Education

**Age Rating**: 4+

### 7. Create App Preview Video (Optional - 2 hours)
**Status**: ❌ Not created
**Requirement**: 15-30 seconds showing core app flow
**Tools**: Screen recording + editing (iMovie, CapCut, etc.)
**Content**: Home → Practice → Level Up → Prayer

---

## 🟢 IMPORTANT - SOON AFTER LAUNCH

### 8. Set Up Sentry Error Tracking (30 minutes)
**Status**: ❌ Not configured (will set up after EAS build)
**Action**:
```bash
# 1. Sign up at sentry.io
# 2. Create new project for React Native
# 3. Install Sentry SDK:
npm install @sentry/react-native

# 4. Initialize in App.tsx
# (Will do this step after EAS build works)
```

### 9. Complete Firebase Analytics (30 minutes)
**Status**: ⚠️ Partially done
**Action**:
- Verify all key events are tracked:
  - `signup_completed`
  - `verse_practiced`
  - `level_up`
  - `streak_milestone` (7, 30, 100 days)
  - `premium_screen_viewed`
  - `premium_plan_selected`
  - `prayer_generated`

### 10. Test Payment Flow in Sandbox (1 hour)
**Status**: ❌ RevenueCat disabled (will enable in EAS build)
**Action**:
- Configure RevenueCat products
- Test purchase flow in sandbox
- Test restore purchases
- Verify premium features unlock

### 11. Set Up App Store Connect / Google Play Console (1 hour)
**Status**: ❌ Not started
**iOS - App Store Connect**:
```
1. Create app listing
2. Fill in metadata (name, description, keywords)
3. Upload screenshots
4. Set pricing ($0 for base app)
5. Configure in-app purchases (link to RevenueCat)
6. Add privacy policy URL
7. Set age rating (4+)
8. Submit for review
```

**Android - Google Play Console**:
```
1. Create app listing
2. Fill in store listing (title, description, screenshots)
3. Set content rating
4. Add privacy policy URL
5. Configure in-app products
6. Upload APK/AAB
7. Submit for review
```

---

## 📝 NICE TO HAVE - POST-LAUNCH

### 12. Marketing Materials
- [ ] Create landing page (memoryverse.app or pintayo.com/memoryverse)
- [ ] Social media posts announcing launch
- [ ] Email to beta testers
- [ ] Product Hunt launch post
- [ ] Reddit post in r/Christianity, r/Bible
- [ ] Submit to Christian app directories

### 13. Support Infrastructure
- [ ] Set up support email (support@pintayo.com)
- [ ] Create FAQ document
- [ ] Prepare common troubleshooting responses
- [ ] Set up support ticket system (optional)

### 14. Analytics Dashboard
- [ ] Set up Firebase Analytics dashboard
- [ ] Create retention cohort reports
- [ ] Track key metrics (DAU, MAU, retention)
- [ ] Monitor conversion to premium

### 15. Beta Testing Program
- [ ] TestFlight for iOS (invite 10-20 testers)
- [ ] Google Play Beta for Android
- [ ] Collect feedback before public launch
- [ ] Fix critical bugs found in testing

---

## 🏗️ BUILD & DEPLOYMENT WORKFLOW

### Phase 1: EAS Build Setup (TODAY - 30 minutes)
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure
eas build:configure

# 4. Create adaptive icon (if missing)
cp assets/icon.png assets/adaptive-icon.png

# 5. First preview build (iOS)
eas build --platform ios --profile preview

# 6. First preview build (Android)
eas build --platform android --profile preview

# 7. Test builds on physical devices
# Download .ipa (iOS) or .apk (Android) from Expo dashboard
```

### Phase 2: Internal Testing (TOMORROW - 2 hours)
```bash
# 1. Install preview build on your device
# 2. Go through complete test checklist (see above)
# 3. Fix any critical bugs found
# 4. Rebuild if necessary

# Test specifically:
- Sign up flow
- Verse practice → XP gain
- Streak tracking
- Prayer generation (with "shit" in input - should work!)
- Premium features
- Payment flow (sandbox)
```

### Phase 3: Production Build (NEXT - 1 hour)
```bash
# 1. Ensure all tests pass
# 2. Update version in app.json to 1.0.0
# 3. Build for production

# iOS Production Build
eas build --platform ios --profile production

# Android Production Build
eas build --platform android --profile production

# 4. Submit builds to stores
eas submit --platform ios
eas submit --platform android
```

### Phase 4: App Store Review (3-7 days)
```
1. Apple reviews app (typically 1-3 days)
2. Google reviews app (typically 1-3 days)
3. Respond to any questions/rejections
4. Fix issues if needed
5. Resubmit if required
```

### Phase 5: Launch! 🎉
```
1. Apps approved and live!
2. Announce on social media
3. Email beta testers
4. Monitor analytics closely
5. Respond to user feedback
6. Fix any critical bugs immediately
```

---

## ⚡ TODAY'S ACTION ITEMS (Next 2-3 Hours)

**CRITICAL PATH TO PRODUCTION:**

1. ✅ **App.json configured** (DONE)

2. **Create Android adaptive icon** (5 min)
   ```bash
   cp assets/icon.png assets/adaptive-icon.png
   ```

3. **Test core app flow** (30 min)
   - Follow test checklist above
   - Document any bugs found

4. **Verify URLs work** (2 min)
   - Test privacy policy URL
   - Test terms URL

5. **Configure EAS** (15 min)
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

6. **Create first preview build** (20 min setup + 20 min build time)
   ```bash
   eas build --platform ios --profile preview
   ```

7. **Take screenshots while app runs** (30 min)
   - Open app
   - Screenshot each key screen
   - Save for App Store listing

8. **Write App Store description** (30 min)
   - Use template above
   - Customize as needed

**TOTAL TIME: ~2.5 hours to be production-ready!**

---

## 📊 SUCCESS METRICS

**Launch Goals (Week 1)**:
- 100+ downloads
- 4.5+ star rating
- 50+ daily active users
- 5% conversion to premium
- <5% crash rate

**Growth Goals (Month 1)**:
- 1,000+ downloads
- 500+ daily active users
- 10% premium conversion
- 4.8+ star rating
- Featured in "New Apps We Love" (App Store)

---

## 🎯 FINAL PRE-LAUNCH CHECKLIST

Before submitting to App Store:
- [ ] App icon looks great on home screen
- [ ] Splash screen loads smoothly
- [ ] No crashes in core flows
- [ ] XP and streak tracking works
- [ ] Prayer feature works (including "shit" test)
- [ ] Premium paywall shows correctly
- [ ] Privacy policy URL loads
- [ ] Terms URL loads
- [ ] All screenshots captured
- [ ] App Store description written
- [ ] Keywords optimized
- [ ] Version number is 1.0.0
- [ ] Build number is 1

---

## 📞 SUPPORT & RESOURCES

**Need Help?**
- EAS Build docs: https://docs.expo.dev/build/introduction/
- App Store Connect: https://appstoreconnect.apple.com/
- Google Play Console: https://play.google.com/console
- RevenueCat docs: https://docs.revenuecat.com/

**Common Issues**:
- Build fails: Check eas.json profile configuration
- Permissions denied: Update app.json infoPlist settings
- Screenshots wrong size: Use exact dimensions from store requirements

---

**Last Updated**: 2025-11-18
**Ready for Production**: After completing items 2-5 above (~1 hour of work)

🚀 You're so close! Let's ship this! 🚀
