# MemoryVerse Pre-Launch Complete Checklist

**Last Updated:** 2025-11-19

---

## CLEANUP & OPTIMIZATION (DO FIRST!)

### Database Cleanup

**Review and Remove Unused Tables:**
- [ ] **verse_collections** - Check if this feature is implemented
  - If NOT implemented: Drop table + related tables (verse_collection_items, verse_collection_shares)
  - If implemented: Keep and test thoroughly
- [ ] **prayer_conversations** - Check if enhanced prayer coaching is implemented
  - If NOT implemented: Drop table + prayer_messages + prayer_insights
  - If implemented: Keep and test
- [ ] **bible_translations** table - Review if using the new table or just 'translation' column
  - Currently using: `translation` column in verses table (KJV, WEB, BBE, etc.)
  - Consider: Drop `bible_translations` + `verses_translations` if not using
- [ ] **analytics_snapshots** - Check if advanced analytics screen exists
  - If NOT implemented: Drop table + learning_velocity
  - If implemented: Keep
- [ ] **export_logs** - Check if export feature is implemented
  - If NOT implemented: Drop table
  - If implemented: Keep

**Remove Unused Database Functions:**
- [ ] Review `get_user_collections_with_stats` - drop if collections not used
- [ ] Review `get_advanced_analytics_summary` - drop if advanced analytics not used
- [ ] Review `generate_daily_analytics_snapshot` - drop if not used

**Tables Currently USED (Keep These):**
- [x] profiles
- [x] verses
- [x] user_verse_progress
- [x] practice_sessions
- [x] achievements
- [x] daily_streaks
- [x] chapter_contexts
- [x] daily_verses
- [x] favorites
- [x] reading_progress
- [x] usage_limits (for subscription tier limits)

**Export Current Database Schema:**
- [ ] Run Supabase SQL query to export all table schemas
- [ ] Document all RPC functions actually being used
- [ ] Create clean migration file with ONLY used tables/functions
- [ ] Test migration on fresh database

---

### Code Cleanup

**Remove Unused Services:**
- [ ] Check if `advancedAnalyticsService.ts` is used - if not, delete
- [ ] Check if `verseCollectionsService.ts` is used - if not, delete
- [ ] Check if `exportService.ts` is used - if not, delete
- [ ] Check if `enhancedPrayerCoachingService.ts` is used - if not, delete
- [ ] Check if `studyNotesService.ts` is used - if not, delete
- [ ] Check if `translationService.ts` is used - if not, delete
- [ ] Check if `guestModeService.ts` is used (vs guestProgressService) - consolidate
- [ ] Check if `achievementService.ts` and `achievementsService.ts` are duplicates - remove one

**Remove Unused Screens:**
- [ ] Check if `NotesScreen.tsx` is implemented/used - if not, delete
- [ ] Check if `SearchScreen.tsx` is used (search is in BibleScreen) - if duplicate, delete
- [ ] Check if `DownloadsScreen.tsx` is implemented - if not, delete
- [ ] Check if `LeaderboardScreen.tsx` is being used - if not, delete
- [ ] Check if `StreakCalendarScreen.tsx` is accessible - if not, delete
- [ ] Check if `ComingSoonScreen.tsx` is still used - if not, delete

**Remove Unused Components:**
- [ ] Scan `/src/components` for unused exports
- [ ] Remove any HOCs or wrappers not being imported anywhere

**Remove Development/Test Files:**
- [ ] Delete `/supabase/test-data-simple.sql` (test data)
- [ ] Delete `CLEANUP_OLD_FILES.md` (if it exists)
- [ ] Delete `DOCUMENTATION.md` (if outdated)
- [ ] Review `/docs` folder - archive or delete outdated docs

**Code Quality:**
- [ ] Remove all `console.log` statements (keep only `logger.log`)
- [ ] Remove all TODO comments or convert to GitHub issues
- [ ] Remove unused imports across all files
- [ ] Remove commented-out code
- [ ] Run ESLint and fix all warnings
- [ ] Run TypeScript strict mode checks

---

## 1. APPLE APP STORE SETUP

### Apple Developer Account
- [ ] Enrolled in Apple Developer Program ($99/year)
- [ ] Team ID saved: _______________
- [ ] Apple ID login confirmed working

### App Store Connect
- [ ] App created in App Store Connect
- [ ] Bundle ID registered: com.memoryverse.app (or your chosen ID)
- [ ] App name reserved in App Store
- [ ] Primary language set
- [ ] Primary category: Education or Lifestyle
- [ ] Secondary category (optional): _______________

### App Information
- [ ] Privacy Policy URL added: _______________
- [ ] Support URL added: _______________
- [ ] Marketing URL (optional): _______________
- [ ] App subtitle written (max 30 chars)
- [ ] Promotional text written (optional)
- [ ] Description written (max 4000 chars)
- [ ] Keywords researched and added (max 100 chars)
- [ ] Age rating questionnaire completed
- [ ] Copyright info added

### App Screenshots
- [ ] iPhone 6.7" (1290 x 2796) - iPhone 14 Pro Max, 15 Pro Max (at least 3)
- [ ] iPhone 6.5" (1284 x 2778) - iPhone 12/13/14 Pro Max (at least 3)
- [ ] iPhone 5.5" (1242 x 2208) - iPhone 8 Plus (at least 3)
- [ ] iPad Pro 12.9" 3rd gen (2048 x 2732) - optional but recommended
- [ ] iPad Pro 12.9" 2nd gen (2048 x 2732) - optional
- [ ] App preview video prepared (optional, 15-30 seconds)

### App Privacy Details
- [ ] Data collection practices disclosed
- [ ] Data types collected listed:
  - [ ] Email address
  - [ ] Name
  - [ ] User progress data
  - [ ] Analytics data
- [ ] Data linked to user identity specified
- [ ] Data used to track you (if applicable)
- [ ] Third-party data sharing disclosed:
  - [ ] Firebase Analytics
  - [ ] Sentry error tracking
  - [ ] RevenueCat subscription management
  - [ ] AI providers (OpenAI, Anthropic, Perplexity)

### In-App Purchases
- [ ] Subscription groups created
- [ ] Subscription products created:
  - [ ] Basic tier: $___/month (Product ID: _______________)
  - [ ] Pro tier: $___/month (Product ID: _______________)
  - [ ] Ultimate tier: $___/month (Product ID: _______________)
- [ ] Localized descriptions added for each product
- [ ] Pricing set for all regions
- [ ] Free trial periods configured (if offering)

---

## 2. GOOGLE PLAY CONSOLE SETUP

### Google Play Account
- [ ] Google Play Developer Account created ($25 one-time)
- [ ] Payment profile completed
- [ ] Identity verification completed

### App Listing
- [ ] App created in Google Play Console
- [ ] Package name registered: com.memoryverse.app (must match iOS)
- [ ] App name set
- [ ] Short description (max 80 chars)
- [ ] Full description (max 4000 chars)
- [ ] App category: Education or Lifestyle
- [ ] Tags added (up to 5)
- [ ] Contact email set
- [ ] Privacy policy URL: _______________
- [ ] Website URL (optional): _______________

### Store Listing Graphics
- [ ] App icon (512 x 512 PNG)
- [ ] Feature graphic (1024 x 500 JPG/PNG) - REQUIRED
- [ ] Phone screenshots (at least 2):
  - [ ] Screenshot 1
  - [ ] Screenshot 2
  - [ ] Screenshot 3 (optional)
  - [ ] Screenshot 4 (optional)
- [ ] 7-inch tablet screenshots (optional but recommended)
- [ ] 10-inch tablet screenshots (optional)
- [ ] Promo video (YouTube link, optional)

### Content Rating
- [ ] Content rating questionnaire completed
- [ ] Rating certificate received

### Data Safety Section
- [ ] Data collection disclosed:
  - [ ] Personal info: Email, Name
  - [ ] App activity: User progress, Bible reading
  - [ ] App info and performance: Crash logs, diagnostics
- [ ] Data sharing with third parties listed
- [ ] Data security practices described
- [ ] Data deletion option available

### Pricing & Distribution
- [ ] Countries/regions selected for distribution
- [ ] Pricing set (Free with in-app purchases)
- [ ] Content guidelines accepted
- [ ] US export laws accepted

### In-App Products
- [ ] Subscription products created (must match iOS):
  - [ ] Basic tier: $___/month (Product ID: _______________)
  - [ ] Pro tier: $___/month (Product ID: _______________)
  - [ ] Ultimate tier: $___/month (Product ID: _______________)
- [ ] Prices localized for major markets
- [ ] Free trial configured (if offering)

---

## 3. REVENUECAT INTEGRATION

### RevenueCat Setup
- [x] RevenueCat project created
- [x] API keys configured in app code
- [ ] **CRITICAL: App Store Connect API Key uploaded**
  - [ ] Go to App Store Connect → Users and Access → Keys
  - [ ] Create new API key with "App Manager" role
  - [ ] Download .p8 file
  - [ ] Upload to RevenueCat → Project Settings → Apple App Store
  - [ ] Enter Issuer ID and Key ID
- [ ] **CRITICAL: Google Play Service Account linked**
  - [ ] Create service account in Google Cloud Console
  - [ ] Grant "Finance" permissions in Play Console
  - [ ] Download JSON key file
  - [ ] Upload to RevenueCat → Project Settings → Google Play Store

### Products Configuration
- [ ] Subscription products configured in RevenueCat:
  - [ ] Basic tier (maps to both iOS and Android product IDs)
  - [ ] Pro tier
  - [ ] Ultimate tier
- [ ] Entitlements created:
  - [ ] "pro" entitlement
  - [ ] Features mapped to entitlements
- [ ] Offerings created:
  - [ ] Default offering with all tiers
  - [ ] Promotional offerings (if any)
- [ ] Product IDs match exactly:
  - iOS product ID: _______________ = RevenueCat = Android product ID: _______________

### Testing
- [ ] iOS sandbox purchases working
- [ ] Android test purchases working
- [ ] Subscription status updates in app
- [ ] Restore purchases working
- [ ] Subscription upgrades working
- [ ] Subscription downgrades working
- [ ] Subscription cancellation working
- [ ] Free trial working (if applicable)
- [ ] Webhook configured for subscription events

---

## 4. FIREBASE SETUP

### Firebase Project
- [x] Firebase project created
- [x] iOS app registered in Firebase
- [x] Android app registered in Firebase
- [x] GoogleService-Info.plist added to iOS project
- [x] google-services.json added to Android project

### Firebase Configuration
- [ ] **APNs Authentication Key uploaded** (for iOS push notifications)
  - [ ] Create APNs key in Apple Developer → Keys
  - [ ] Download .p8 file
  - [ ] Upload to Firebase Console → Project Settings → Cloud Messaging → iOS app
  - [ ] Enter Key ID and Team ID
- [ ] FCM Server Key configured for Android (automatic)

### Firebase Services
- [x] Firebase Analytics enabled
- [ ] Test events logging correctly
- [ ] Analytics dashboard showing data
- [ ] Crashlytics enabled (optional, you have Sentry)
- [ ] Performance Monitoring (optional)
- [ ] Remote Config (optional, for feature flags)

---

## 5. SENTRY ERROR TRACKING

### Sentry Configuration
- [x] Sentry project created
- [x] DSN configured in app
- [ ] Production environment configured
- [ ] Source maps upload configured in `eas.json`
- [ ] Release tracking enabled
- [ ] Sentry CLI installed: `npm install -g @sentry/cli`

### Testing & Monitoring
- [ ] Test error sent and received in Sentry dashboard
- [ ] Error grouping working correctly
- [ ] Source maps working (errors show actual code, not minified)
- [ ] Alert rules configured:
  - [ ] Email alerts for critical errors
  - [ ] Slack integration (optional)
- [ ] Team members invited to Sentry project

---

## 6. SUPABASE BACKEND

### Database
- [x] Supabase project created
- [x] Database schema deployed
- [x] Row Level Security (RLS) policies active
- [ ] **Clean database schema exported**
- [ ] **Unused tables removed**
- [ ] All tables have proper indexes
- [ ] Query performance tested

### Production Readiness
- [ ] Supabase plan reviewed (Free tier has limits):
  - Free: 500MB database, 2GB bandwidth, 50K monthly active users
  - Pro ($25/mo): 8GB database, 250GB bandwidth, 100K MAU
  - **Decision:** Upgrade to Pro? [ ] Yes [ ] No
- [ ] Database backups enabled (Pro plan feature)
- [ ] Point-in-time recovery enabled (Pro plan)
- [ ] API rate limits understood
- [ ] Edge functions (if using) tested
- [ ] Storage buckets (if using) configured

### Security
- [ ] RLS policies tested for all tables
- [ ] API keys rotated (use production keys only)
- [ ] Database password is strong
- [ ] No sensitive data in logs
- [ ] Connection pooling configured (Supabase default)

---

## 7. AI API INTEGRATIONS

### OpenAI API
- [ ] **Production API key created**
- [ ] Billing account set up
- [ ] Payment method added
- [ ] **Usage limits configured** (recommended: $50-100/month initially)
- [ ] **Cost alerts enabled** (alert at 50%, 75%, 90% of budget)
- [ ] Rate limits understood:
  - Free tier: Very limited
  - Pay-as-you-go: Higher limits
  - **Current tier:** _______________
- [ ] Models being used documented:
  - GPT-4: Context generation (expensive)
  - GPT-3.5-turbo: Prayer generation (cheaper)

### Anthropic (Claude) API
- [ ] **Production API key created**
- [ ] Billing set up
- [ ] Payment method added
- [ ] **Usage tier** confirmed (Tier 1, 2, 3, or 4)
- [ ] Rate limits understood
- [ ] Cost per 1M tokens documented
- [ ] Models being used:
  - Claude 3 Sonnet: Balanced cost/quality
  - Claude 3 Haiku: Fast and cheap

### Perplexity API
- [ ] **Production API key created**
- [ ] Billing set up (if required)
- [ ] Rate limits understood
- [ ] Use case documented: _______________

### Safety & Fallbacks
- [x] Content filtering implemented and tested
- [x] Prompt injection protection working
- [ ] API timeout handling tested
- [ ] Fallback messages configured
- [ ] Cost monitoring dashboard set up
- [ ] Monthly budget planned: $_____ for AI APIs

---

## 8. LEGAL & COMPLIANCE

### Required Legal Documents
- [ ] **Privacy Policy created**
  - [ ] Hosted at public URL: _______________
  - [ ] Covers all data collection
  - [ ] Explains AI usage and data sent to AI providers
  - [ ] Lists third-party services (Firebase, Sentry, RevenueCat, etc.)
  - [ ] Explains how to delete account and data
  - [ ] GDPR-compliant (if targeting EU)
  - [ ] COPPA-compliant (if allowing under 13)
  - [ ] Accessible in app (link in Settings screen)
- [ ] **Terms of Service created**
  - [ ] Hosted at public URL: _______________
  - [ ] Subscription terms clearly explained
  - [ ] Refund policy stated
  - [ ] User responsibilities outlined
  - [ ] Accessible in app (link in Settings)
- [ ] **End User License Agreement (EULA)** (optional, Apple provides standard one)
  - [ ] Custom EULA needed? [ ] Yes [ ] No
  - [ ] If yes, URL: _______________

### Data Protection
- [ ] **GDPR Compliance** (if targeting EU)
  - [ ] User can export their data
  - [ ] User can delete their account
  - [ ] Cookie consent implemented (if web version)
  - [ ] Data retention policies documented
  - [ ] Data processing agreement with Supabase
- [ ] **COPPA Compliance** (if allowing users under 13)
  - [ ] Parental consent mechanism
  - [ ] Age gate on signup
  - [ ] Limited data collection for children
  - **Decision:** Allow under 13? [ ] Yes [ ] No (Recommended: No, easier compliance)

### Bible Content Licensing
- [ ] **Verify licensing for commercial use:**
  - [x] KJV: Public domain ✓
  - [x] WEB (World English Bible): Public domain ✓
  - [ ] BBE (Bible in Basic English): Verify license
  - [x] ASV (American Standard Version): Public domain ✓
  - [x] YLT (Young's Literal Translation): Public domain ✓
  - [ ] DBY (Darby Bible): Verify license
  - [x] WBT (Webster's Bible): Public domain ✓
- [ ] Attribution added where required
- [ ] Copyright notices in app footer/about section

---

## 9. APP CONFIGURATION

### app.json / app.config.js
- [ ] **Bundle identifier:** com.memoryverse.app (or your choice)
- [ ] **Package name:** com.memoryverse.app (must match iOS)
- [ ] **App name:** MemoryVerse (or your choice)
- [ ] **Version:** 1.0.0
- [ ] **Build number:** 1 (iOS), **Version code:** 1 (Android)
- [ ] **Description:** _______________
- [ ] **Privacy policy URL:** _______________
- [ ] **Orientation:** portrait (locked)
- [ ] **Splash screen:** Final version
- [ ] **App icon:** Final version (1024x1024)
- [ ] **Background color:** Set
- [ ] **Primary color:** Set
- [ ] **iOS-specific:**
  - [ ] Requires full screen: true
  - [ ] Supports tablet: true (if supporting iPad)
  - [ ] Bundle is tablet only: false
- [ ] **Android-specific:**
  - [ ] Adaptive icon configured
  - [ ] Permissions listed (minimal)
  - [ ] Package name matches iOS bundle ID

### Environment Variables
- [ ] **Production Supabase URL and keys**
- [ ] **Production Sentry DSN**
- [ ] **Production Firebase config**
- [ ] **Production AI API keys** (OpenAI, Anthropic, Perplexity)
- [ ] **RevenueCat public keys** (iOS and Android)
- [ ] **All test/development keys removed**
- [ ] Environment variables in `.env` file
- [ ] `.env` file in `.gitignore`
- [ ] EAS Secrets configured: `eas secret:create`

### Code Quality
- [ ] Remove all `console.log` (use `logger.log` only)
- [ ] Remove all TODO comments (or convert to issues)
- [ ] Remove all commented-out code
- [ ] Remove unused imports
- [ ] ESLint run with no errors
- [ ] TypeScript compilation with no errors
- [ ] Run `npm audit` and fix vulnerabilities

---

## 10. TESTING CHECKLIST

### Device Testing
- [ ] Test on physical iPhone (iOS 15+)
- [ ] Test on physical Android device (Android 10+)
- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone Pro Max (large screen)
- [ ] Test on Android small phone
- [ ] Test on Android large phone
- [ ] Test on iPad (if supporting)
- [ ] Test on Android tablet (if supporting)
- [ ] Test on iOS latest version
- [ ] Test on Android latest version
- [ ] Test on older iOS version (iOS 13)
- [ ] Test on older Android version (Android 10)

### Feature Testing
- [ ] **Account & Auth:**
  - [ ] Sign up with email
  - [ ] Sign in with email
  - [ ] Password reset
  - [ ] Logout
  - [ ] Profile editing
  - [ ] Avatar upload
  - [ ] Guest mode (if implemented)
- [ ] **Bible Reading:**
  - [ ] Browse books
  - [ ] Select chapter
  - [ ] Read verses
  - [ ] Search verses
  - [ ] Change translation
  - [ ] Continue reading bookmark
  - [ ] Navigate prev/next chapter
- [ ] **Learn Verses:**
  - [ ] Start learn session
  - [ ] View verse context
  - [ ] Complete 5-verse session
  - [ ] Progress shows correctly (1 of 5, 2 of 5, etc.)
  - [ ] Context pre-loads for verses 2-5
  - [ ] Session completion recorded
- [ ] **Practice:**
  - [ ] Practice learned verses
  - [ ] Recall mode works
  - [ ] Blanks mode works
  - [ ] Choice mode works
  - [ ] XP awarded correctly
  - [ ] Accuracy calculated
- [ ] **Review:**
  - [ ] Review learned verses
  - [ ] Spaced repetition works
  - [ ] Mastery level increases
- [ ] **Understand (AI Context):**
  - [ ] Request verse context
  - [ ] AI generates context
  - [ ] Context displayed correctly
  - [ ] Content filtering works
- [ ] **Pray (AI Prayer):**
  - [ ] Talk about day feature (premium)
  - [ ] AI generates prayer
  - [ ] Daily limit enforced
  - [ ] Content validation works
- [ ] **Favorites:**
  - [ ] Add verse to favorites
  - [ ] View favorites list
  - [ ] Remove from favorites
- [ ] **Share:**
  - [ ] Share today's verse
  - [ ] Share verse from Bible
  - [ ] Share dialog opens
- [ ] **Daily Verse:**
  - [ ] Today's verse loads
  - [ ] Synchronized for all users
- [ ] **Achievements:**
  - [ ] Achievements unlock
  - [ ] Notification shows
  - [ ] View achievements modal
  - [ ] Progress tracked correctly
- [ ] **Story Mode:**
  - [ ] Preview shows correctly
  - [ ] "Notify Me" button works
- [ ] **Settings:**
  - [ ] Change translation
  - [ ] Toggle notifications
  - [ ] View subscription
  - [ ] Manage account
- [ ] **Subscriptions (CRITICAL):**
  - [ ] View subscription tiers
  - [ ] Purchase Basic tier (sandbox)
  - [ ] Purchase Pro tier (sandbox)
  - [ ] Purchase Ultimate tier (sandbox)
  - [ ] Restore purchases
  - [ ] Subscription status updates immediately
  - [ ] Premium features unlock
  - [ ] Subscription limits enforced (1, 5, 10 AI prayers)
  - [ ] Upgrade tier
  - [ ] Downgrade tier
  - [ ] Cancel subscription

### Performance Testing
- [ ] App launches in under 3 seconds
- [ ] No memory leaks during 30-minute session
- [ ] Smooth scrolling in Bible chapters
- [ ] Images load efficiently
- [ ] No ANR (Android Not Responding) errors
- [ ] No crashes during normal use
- [ ] Battery usage acceptable
- [ ] Network requests don't block UI

### Offline Testing
- [ ] App works with no internet (cached content)
- [ ] Graceful error messages when offline
- [ ] Data syncs when back online

### Accessibility Testing
- [ ] VoiceOver works (iOS)
- [ ] TalkBack works (Android)
- [ ] Text scaling works (up to 200%)
- [ ] Color contrast meets WCAG standards
- [ ] Touch targets at least 44x44 points
- [ ] All images have alt text

---

## 11. BUILD & DEPLOYMENT

### EAS Build Setup
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in to Expo: `eas login`
- [ ] EAS configured: `eas build:configure`
- [ ] `eas.json` reviewed and correct
- [ ] Build profiles configured:
  - [ ] development
  - [ ] preview
  - [ ] production

### iOS Build
- [ ] Run: `eas build --platform ios --profile production`
- [ ] Build completes successfully
- [ ] Download .ipa file
- [ ] Submit to TestFlight: `eas submit --platform ios`
- [ ] Or upload via Xcode Organizer

### Android Build
- [ ] Run: `eas build --platform android --profile production`
- [ ] Build completes successfully
- [ ] Download .aab file (for Play Store) or .apk (for testing)
- [ ] Submit to Play Console: `eas submit --platform android`
- [ ] Or upload manually in Play Console

### TestFlight (iOS Beta)
- [ ] Build uploaded to App Store Connect
- [ ] TestFlight build processed (1-2 days for first build)
- [ ] Internal testers added
- [ ] Beta app information filled out
- [ ] Test notes provided
- [ ] Email invitations sent
- [ ] TestFlight app installed on tester devices
- [ ] Beta testers successfully install and test

### Google Play Internal Testing (Android Beta)
- [ ] Build uploaded to Play Console
- [ ] Internal testing track created
- [ ] Testers added to internal testing list
- [ ] Email invitations sent
- [ ] Testers successfully install and test

---

## 12. PRE-LAUNCH FINAL CHECKS

### App Store Submission (iOS)
- [ ] All builds tested on TestFlight
- [ ] Critical bugs fixed
- [ ] All screenshots uploaded
- [ ] All metadata complete
- [ ] App privacy details filled
- [ ] In-app purchases reviewed and approved
- [ ] Pricing finalized
- [ ] App submitted for review
- [ ] Review notes provided to Apple
- [ ] Export compliance answered (usually "No" for Bible app)

### Google Play Submission (Android)
- [ ] All builds tested in internal testing
- [ ] Critical bugs fixed
- [ ] All screenshots uploaded
- [ ] All metadata complete
- [ ] Data safety filled completely
- [ ] Content rating received
- [ ] Pricing finalized
- [ ] App submitted for review
- [ ] Release to production scheduled

### Marketing Preparation
- [ ] Landing page/website ready
- [ ] Social media accounts created
- [ ] Press kit prepared
- [ ] Launch announcement written
- [ ] Email list ready (if you have one)
- [ ] App Store Optimization (ASO) researched
- [ ] Keywords finalized

### Monitoring Setup
- [ ] Sentry alerts configured
- [ ] Firebase Analytics dashboard ready
- [ ] RevenueCat dashboard monitoring
- [ ] App Store Connect analytics enabled
- [ ] Google Play Console analytics enabled
- [ ] Customer support email ready: _______________
- [ ] FAQ document prepared

---

## 13. INSTALLATION ON YOUR IPHONES (BEFORE APP STORE)

### Option 1: TestFlight (Recommended)

**Why:** Official Apple method, up to 10,000 testers, automatic updates, 90 days per build

**Steps:**
1. [ ] Build for iOS: `eas build --platform ios --profile production`
2. [ ] Submit to TestFlight: `eas submit --platform ios`
3. [ ] In App Store Connect → TestFlight:
   - [ ] Wait for build to process (1-2 days for first build)
   - [ ] Add yourself as internal tester
   - [ ] Add your wife as internal tester
4. [ ] On both iPhones:
   - [ ] Install "TestFlight" app from App Store
   - [ ] Open email invitation
   - [ ] Tap "View in TestFlight"
   - [ ] Install MemoryVerse app

**Benefits:**
- ✅ Automatic updates when you release new builds
- ✅ Up to 10,000 testers (add friends, family, church)
- ✅ Crash reports included
- ✅ 90-day builds
- ✅ Official Apple method

### Option 2: Ad Hoc Distribution (More Complex)

**Why:** For very limited distribution (up to 100 devices), more manual

**Steps:**
1. [ ] Get iPhone UDIDs:
   - Connect iPhone to Mac
   - Open Finder → Click on iPhone
   - Click device info to reveal UDID
   - Copy UDID
2. [ ] Register devices in Apple Developer Portal
   - Go to Certificates, IDs & Profiles → Devices
   - Register both iPhones with UDIDs
3. [ ] Configure `eas.json` for Ad Hoc build
4. [ ] Build: `eas build --platform ios --profile adhoc`
5. [ ] Download .ipa from EAS dashboard
6. [ ] Install via Xcode → Devices and Simulators

**Drawbacks:**
- ❌ Manual installation process
- ❌ Limited to 100 devices per year
- ❌ Must register each device UDID

### Option 3: Development Build (Active Development)

**Why:** Fastest for rapid iteration during development

**Steps:**
1. [ ] Register device UDIDs (same as Ad Hoc)
2. [ ] Build: `eas build --platform ios --profile development`
3. [ ] Install via Xcode or Apple Configurator

**For Android (If Your Wife Uses Android):**

**Option A: Internal Testing (Like TestFlight)**
1. [ ] Build: `eas build --platform android --profile production`
2. [ ] Submit: `eas submit --platform android`
3. [ ] Add testers in Play Console → Internal Testing
4. [ ] Testers install via Play Store link

**Option B: Direct APK Install**
1. [ ] Build APK: `eas build --platform android --profile preview`
2. [ ] Download APK from EAS dashboard
3. [ ] Send to phone (email, Drive, etc.)
4. [ ] Enable "Install from Unknown Sources"
5. [ ] Install APK

**RECOMMENDED APPROACH:**
- ✅ Use **TestFlight for iOS** (you and your wife if both have iPhones)
- ✅ Use **Play Console Internal Testing** for Android
- Both methods support automatic updates and easy testing

---

## 14. POST-LAUNCH MONITORING (First 72 Hours)

### Day 1
- [ ] Monitor crash reports in Sentry
- [ ] Check Firebase Analytics for user activity
- [ ] Monitor RevenueCat for subscription events
- [ ] Check App Store Connect for reviews
- [ ] Check Google Play Console for reviews
- [ ] Monitor support email for issues
- [ ] Check AI API usage and costs

### Day 2-3
- [ ] Analyze user retention (Day 1 retention)
- [ ] Review most common user flows in Analytics
- [ ] Identify any critical bugs
- [ ] Prepare patch if needed
- [ ] Respond to user reviews
- [ ] Share launch announcement

### Week 1
- [ ] Review subscription conversion rate
- [ ] Analyze feature usage
- [ ] Identify drop-off points
- [ ] Plan first update based on feedback
- [ ] Monitor AI API costs vs. budget

---

## TIMELINE SUGGESTION

### Week 1: Cleanup & Critical Setup
- [ ] Database cleanup (remove unused tables)
- [ ] Code cleanup (remove unused files)
- [ ] Set up RevenueCat App Store Connect API
- [ ] Set up Google Play Service Account
- [ ] Create Privacy Policy and Terms
- [ ] Build first TestFlight version

### Week 2: Testing & Refinement
- [ ] TestFlight testing on your iPhones
- [ ] Fix critical bugs
- [ ] Complete all store listings
- [ ] Prepare screenshots
- [ ] Set up production AI API keys with billing
- [ ] Test in-app purchases in sandbox

### Week 3: Final Prep
- [ ] Upload APNs key to Firebase
- [ ] Final testing with beta users
- [ ] Prepare marketing materials
- [ ] Write app descriptions
- [ ] Set up monitoring and alerts

### Week 4: Launch!
- [ ] Submit to App Store review
- [ ] Submit to Google Play review
- [ ] Wait for approval (1-7 days)
- [ ] Launch! 🚀
- [ ] Monitor closely for first 72 hours

---

## CRITICAL PRIORITIES (DO THESE FIRST!)

1. **Database cleanup** - Remove unused tables/functions
2. **Code cleanup** - Remove unused services/screens
3. **TestFlight build** - Get app on your phones ASAP
4. **RevenueCat setup** - App Store Connect API + Google Play Service Account
5. **Privacy Policy** - Required for both stores
6. **Production AI keys** - Set up billing and limits

---

## NOTES SECTION

**Bundle ID Decision:** _______________
**App Name Final:** _______________
**Support Email:** _______________
**Target Launch Date:** _______________

**Subscription Pricing:**
- Basic: $___/month
- Pro: $___/month
- Ultimate: $___/month

**Initial Budget:**
- Apple Developer: $99/year
- Google Play: $25 one-time
- Supabase: $___ /month
- AI APIs: $___ /month budget
- Total monthly: $___ /month

---

**Last Updated:** 2025-11-19
**Status:** Pre-Launch Preparation
**Next Review Date:** _______________
