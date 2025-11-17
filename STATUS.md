# MemoryVerse - Current Status & TODO

**Last Updated:** November 17, 2025

---

## 🚨 **HIGH PRIORITY - Must Do Before Testing**

### 1. **Prayer Input Safety & Abuse Prevention** 🔴 CRITICAL
**Status:** NOT IMPLEMENTED
**Priority:** #1 - MUST DO FIRST

**Problem:** The "Tell about your day" feature sends user input directly to AI for prayer generation without validation. This is vulnerable to:
- Inappropriate/offensive content
- Non-prayer related requests
- Prompt injection attacks
- Resource abuse

**Solution Needed:**
- Input validation and content filtering
- Rate limiting per user
- Maximum character limits
- Inappropriate content detection
- Logging for abuse monitoring

**Implementation Required:**
- Create `src/services/prayerInputValidator.ts`
- Add content moderation before AI call
- Add rate limiting checks
- Update PrayScreen to use validator

---

## 📱 **React Native Features Requiring Development Build**

**Current Limitation:** App runs in Expo Go, which doesn't support custom native modules.

### Features NOT Working in Expo Go:
1. **RevenueCat (In-App Purchases)**
   - Status: Temporarily disabled
   - Files: `src/services/purchaseService.ts`, `src/contexts/AuthContext.tsx`
   - Premium screen shows fallback pricing only

2. **Firebase Analytics**
   - Status: Used but may not work fully in Expo Go
   - Files: `src/services/analyticsService.ts`
   - Tracks user events and screen views

3. **Voice Recognition** (@react-native-voice/voice)
   - Status: Unknown if working in Expo Go
   - Files: `src/services/speechRecognitionService.ts`
   - Used for voice input in practice mode

**To Enable All Features:**
```bash
# Generate native code
npx expo prebuild

# Run on device/simulator
npx expo run:ios
# or
npx expo run:android

# Re-enable RevenueCat in AuthContext.tsx (uncomment lines 5, 47-52)
```

---

## ✅ **Completed Features**

### Core Functionality
- ✅ Bible verse memorization system
- ✅ Spaced repetition algorithm (SM-2)
- ✅ Practice modes (typing, multiple choice, fill-in-blank)
- ✅ Review system with overdue tracking
- ✅ Daily verse feature
- ✅ User authentication (Supabase)
- ✅ User profiles and progress tracking
- ✅ Gamification (XP, levels, streaks)

### Premium Features (Code Complete)
- ✅ 3-tier subscription system (Basic €4.99, Standard €9.99, Premium €14.99)
- ✅ AI-powered prayer generation
- ✅ Usage limits per tier (1/5/10 prayers per day)
- ✅ Premium upgrade screen with fallback pricing
- ✅ RevenueCat integration (needs dev build to test)

### Infrastructure
- ✅ Supabase database with RLS policies
- ✅ Error tracking (Sentry)
- ✅ Analytics (Firebase)
- ✅ Feature flags system
- ✅ Environment-based configuration

### Bug Fixes (Recent)
- ✅ Fixed PrayScreen crash (missing useEffect import)
- ✅ Fixed daily verse RLS policy violation
- ✅ Fixed overdue reviews calculation
- ✅ Fixed BibleVersePicker empty state
- ✅ Fixed review flow to load specific verses
- ✅ Fixed ErrorBoundary for production-safe messages

---

## 🔧 **Setup Still Required**

### Database
- ✅ Migration 007 (subscription_tier column) - YOU RAN THIS
- ⏸️ Webhook deployment - waiting for RevenueCat setup completion

### RevenueCat
- ✅ Account created
- ✅ Products imported from App Store Connect
- ✅ Entitlement "MemoryVerse" created
- ✅ Offering "default" created
- ✅ API key obtained
- ⏸️ Webhook deployment (do after dev build testing)

### Remaining Setup
- [ ] Run `npx expo prebuild` to generate native folders
- [ ] Test RevenueCat purchases in dev build
- [ ] Deploy Supabase webhook function
- [ ] Configure webhook URL in RevenueCat dashboard
- [ ] Test sandbox purchases with Apple test accounts
- [ ] Set up Google Play Console (when ready for Android)

---

## 🐛 **Known Issues**

1. **Expo Go Limitations**
   - RevenueCat disabled (requires dev build)
   - Firebase Analytics may not work fully
   - Voice recognition untested

2. **Testing Needed**
   - Review system end-to-end (click overdue → practice → verify update)
   - Database functions (`get_or_create_daily_verse`)
   - User verse progress entries (need seed data)
   - All recent bug fixes

3. **Missing Assets**
   - `./assets/splash.png` - not found error in logs

---

## 📊 **Database Migrations**

All migrations consolidated in `supabase/complete-setup.sql`:
- ✅ Migration 002: Context columns for verses
- ✅ Migration 003: Verses update policy
- ✅ Migration 004: Chapter contexts table
- ✅ Migration 005: Chapter contexts schema fix
- ✅ Migration 006: Daily verses table and function
- ✅ Migration 007: Subscription tier column

**To Apply All:**
```sql
-- Run supabase/complete-setup.sql in Supabase SQL Editor
-- OR
supabase db push
```

---

## 🔄 **Next Immediate Steps**

### This Week:
1. ⚠️ **CRITICAL:** Implement prayer input safety/validation
2. 🧪 Test all bug fixes systematically
3. 🔨 Fix splash.png asset error
4. 📱 Create development build: `npx expo prebuild`
5. 💳 Test RevenueCat purchases in dev build

### Soon:
1. Deploy webhook to Supabase
2. Configure webhook in RevenueCat
3. Test complete purchase → database sync flow
4. Add test data for user_verse_progress
5. Pre-launch testing checklist

---

## 💡 **Feature Requests & Ideas**

See `FEATURES.md` for detailed feature wishlist and roadmap.

---

## 📖 **Documentation**

See `DOCUMENTATION.md` for:
- App architecture overview
- Technology stack
- Database schema
- API documentation
- Deployment guides
