# Integration Verification Checklist

This document provides a comprehensive checklist to verify all integrations are properly configured for MemoryVerse soft launch.

Last updated: 2025-11-18

---

## 🔐 1. Supabase (Database & Auth) - ✅ CRITICAL

**Status**: 🟢 Configured (verify environment variables)

### Requirements
- [ ] **Supabase project created**
- [ ] **Environment variables set**:
  ```bash
  EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- [ ] **All migrations run** (001-009)
- [ ] **RLS policies enabled** on all tables
- [ ] **Test**: Can sign up, log in, and fetch verses

### Verification Steps
```bash
# Check environment variables
grep SUPABASE .env

# Test in app
# 1. Open app → Sign up with test account
# 2. Verify daily verse loads
# 3. Check Profile screen loads
```

---

## 🔥 2. Firebase Analytics - ⚠️ OPTIONAL for Soft Launch

**Status**: 🟡 Optional (can launch without this)

### Requirements
- [ ] **Firebase project created**
- [ ] **iOS app registered** (`com.memoryverse.app`)
- [ ] **Android app registered** (`com.memoryverse.app`)
- [ ] **Config files in project root**:
  - `GoogleService-Info.plist` (iOS)
  - `google-services.json` (Android)
- [ ] **Environment variable**:
  ```bash
  EXPO_PUBLIC_FIREBASE_ENABLED=true
  ```
- [ ] **Built with EAS** (Firebase requires native builds)

### Verification Steps
```bash
# Check config files exist
ls -la GoogleService-Info.plist google-services.json

# Test tracking
# 1. Build with EAS
# 2. Navigate through app screens
# 3. Check Firebase Console → Analytics → DebugView (24-48 hour delay for dashboard)
```

**⏭️ Can skip for soft launch** - Add later for analytics

---

## 🚨 3. Sentry Error Tracking - ✅ CRITICAL

**Status**: 🟢 Fully integrated (verify DSN)

### Requirements
- [ ] **Sentry project created**
- [ ] **Environment variables set**:
  ```bash
  EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
  EXPO_PUBLIC_SENTRY_ENABLED=true
  ```
- [ ] **Initialization in** `App.tsx` (✅ Already done)
- [ ] **Error handlers in** `src/utils/sentryHelper.ts` (✅ Already done)
- [ ] **Test**: Trigger test error in production build

### Verification Steps
```bash
# Check DSN is set
grep SENTRY_DSN .env

# Test in production build
# 1. eas build --platform ios --profile preview
# 2. Add test error: throw new Error('Sentry test');
# 3. Check Sentry dashboard for error
# 4. Remove test error
```

---

## 💰 4. RevenueCat (In-App Purchases) - ⚠️ REQUIRED for Premium

**Status**: 🟡 Code ready, needs configuration

### Requirements

#### A. RevenueCat Account
- [ ] **Account created** at https://www.revenuecat.com/
- [ ] **Project created**: "MemoryVerse"
- [ ] **iOS app added** (Bundle ID: `com.memoryverse.app`)
- [ ] **Android app added** (Package: `com.memoryverse.app`)

#### B. API Keys
- [ ] **Apple key** obtained (`appl_xxx`)
- [ ] **Google key** obtained (`goog_xxx`)
- [ ] **Added to .env**:
  ```bash
  REVENUECAT_APPLE_API_KEY=appl_xxx
  REVENUECAT_GOOGLE_API_KEY=goog_xxx
  ```

#### C. Products in App Store Connect (iOS)
- [ ] **Basic Monthly**: `com.pintayo.memoryverse.pro.basic.monthly` - €4.99
- [ ] **Standard Monthly**: `com.pintayo.memoryverse.pro.standard.monthly` - €9.99
- [ ] **Premium Monthly**: `com.pintayo.memoryverse.pro.premium.monthly` - €14.99

#### D. Products in Google Play Console (Android)
- [ ] **Basic Monthly**: `com.pintayo.memoryverse.pro.basic.monthly` - €4.99
- [ ] **Standard Monthly**: `com.pintayo.memoryverse.pro.standard.monthly` - €9.99
- [ ] **Premium Monthly**: `com.pintayo.memoryverse.pro.premium.monthly` - €14.99

#### E. RevenueCat Products
- [ ] **Products linked** in RevenueCat dashboard
- [ ] **Offering created**: "default"
- [ ] **Standard marked as recommended**
- [ ] **Offering set as current**

#### F. Entitlements
- [ ] **Entitlement created**: `premium`
- [ ] **All products attached** to `premium` entitlement

#### G. Webhook Setup
- [ ] **Supabase Edge Function deployed**:
  ```bash
  supabase functions deploy revenuecat-webhook
  ```
- [ ] **Webhook configured** in RevenueCat:
  - URL: `https://[PROJECT-ID].supabase.co/functions/v1/revenuecat-webhook`
  - Events: All selected

### Verification Steps
```bash
# 1. Check API keys
grep REVENUECAT .env

# 2. Test purchases (iOS sandbox)
# - Create sandbox tester in App Store Connect
# - Sign out of App Store on device
# - Try to purchase in app
# - Sign in with sandbox account

# 3. Test webhook
# - Make test purchase
# - Check Supabase logs for webhook call
# - Verify is_premium updated in profiles table
```

**⏭️ For soft launch**: Can launch with RevenueCat disabled and enable later

---

## 🤖 5. AI Providers - ✅ CRITICAL (Choose One)

**Status**: 🟡 Choose one provider and configure

### Option A: Anthropic Claude (Recommended)
- [ ] **Account created** at https://console.anthropic.com/
- [ ] **API key generated**
- [ ] **Environment variables**:
  ```bash
  EXPO_PUBLIC_AI_PROVIDER=anthropic
  EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxx
  EXPO_PUBLIC_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
  ```
- [ ] **Billing configured** (Required - no free tier)
- [ ] **Monthly budget set**

**Cost**: ~$0.015 per verse context (1,000 verses = $15)

### Option B: OpenAI
- [ ] **Account created** at https://platform.openai.com/
- [ ] **API key generated**
- [ ] **Environment variables**:
  ```bash
  EXPO_PUBLIC_AI_PROVIDER=openai
  EXPO_PUBLIC_OPENAI_API_KEY=sk-xxx
  EXPO_PUBLIC_OPENAI_MODEL=gpt-4o-mini
  ```
- [ ] **Billing configured**
- [ ] **Monthly budget set**

**Cost**: ~$0.008 per verse context (1,000 verses = $8)

### Option C: Perplexity
- [ ] **Account created** at https://www.perplexity.ai/
- [ ] **API key generated**
- [ ] **Environment variables**:
  ```bash
  EXPO_PUBLIC_AI_PROVIDER=perplexity
  EXPO_PUBLIC_PERPLEXITY_API_KEY=pplx-xxx
  EXPO_PUBLIC_PERPLEXITY_MODEL=sonar
  ```
- [ ] **Billing configured**

**Cost**: ~$0.01 per verse context (1,000 verses = $10)

### Verification Steps
```bash
# Check configuration
grep AI_PROVIDER .env
grep ANTHROPIC_API_KEY .env  # or OPENAI/PERPLEXITY

# Test in app
# 1. Open Understand screen with a verse that has no context
# 2. Click "Show Context"
# 3. Verify context generates successfully
# 4. Check database that context was saved
```

---

## 🍎 6. Apple App Store - ✅ REQUIRED for iOS Launch

**Status**: 🟡 Set up when ready to launch

### Requirements
- [ ] **Apple Developer account** ($99/year)
- [ ] **App ID registered**: `com.memoryverse.app`
- [ ] **App created** in App Store Connect
- [ ] **App icon prepared** (1024x1024px)
- [ ] **Screenshots prepared** (all required sizes)
- [ ] **Privacy Policy URL** set
- [ ] **Terms of Service URL** set
- [ ] **App description written**
- [ ] **Keywords chosen**
- [ ] **Age rating set**
- [ ] **Beta testing** via TestFlight

### Verification Steps
```bash
# Build for iOS
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios

# Test on TestFlight
# - Install via TestFlight
# - Verify all features work
# - Test purchase flow with sandbox
```

**⏭️ For soft launch in Philippines/Singapore**: Required

---

## 🤖 7. Google Play Store - ⚠️ OPTIONAL for Soft Launch

**Status**: 🟡 Set up when ready for Android

### Requirements
- [ ] **Google Play Console account** ($25 one-time)
- [ ] **App created** in Play Console
- [ ] **Package name**: `com.memoryverse.app`
- [ ] **App icon prepared**
- [ ] **Screenshots prepared**
- [ ] **Privacy Policy URL** set
- [ ] **Store listing complete**
- [ ] **Content rating completed**
- [ ] **Closed testing track** created

### Verification Steps
```bash
# Build for Android
eas build --platform android --profile preview

# Submit to closed testing
eas submit --platform android

# Test via internal testing
```

**⏭️ Can skip for soft launch** - Launch iOS first

---

## 📊 Summary & Recommendations

### For Soft Launch (Philippines/Singapore)

#### 🟢 Must Have (Cannot launch without)
1. ✅ **Supabase** - Database and authentication
2. ✅ **Sentry** - Error tracking
3. ✅ **AI Provider** (Anthropic recommended) - Verse contexts
4. ✅ **Apple Developer Account** - iOS distribution

#### 🟡 Should Have (Recommended but optional)
1. ⚠️ **RevenueCat** - Only if selling premium subscriptions at launch
2. ⚠️ **Firebase Analytics** - Can add later for growth metrics

#### ⚪ Can Skip (Add later)
1. ⏭️ **Google Play** - Android can come later
2. ⏭️ **Advanced analytics** - Focus on core features first

### Estimated Setup Time
- **Core integrations** (Supabase, Sentry, AI): 2-3 hours
- **RevenueCat** (if including premium): 3-4 hours
- **Apple App Store submission**: 4-6 hours
- **Total**: 9-13 hours

### Estimated Monthly Costs (1,000 users, 5% premium)
- **Supabase**: Free tier sufficient
- **Sentry**: Free tier sufficient
- **AI (Anthropic)**: ~$45/month (pregenerate 3,000 contexts)
- **Firebase**: Free tier sufficient
- **RevenueCat**: Free up to $10k MRR
- **Apple Developer**: $99/year ($8.25/month)
- **Total**: ~$53/month

**Revenue** (50 premium × €9.99): ~€500/month (~$545)
**Net profit**: ~$492/month 🎉

---

## Next Steps

1. **Verify core integrations** (Supabase, Sentry, AI)
2. **Set up .env file** with all required keys
3. **Test locally** with all integrations
4. **Build preview** with EAS
5. **Submit to TestFlight** for beta testing
6. **Gather feedback** from Philippines/Singapore testers
7. **Polish** based on feedback
8. **Submit** to App Store review
9. **Soft launch** 🚀

---

## Support

If any integration fails:
1. Check `.env` file for missing keys
2. Verify API keys are valid (not expired/revoked)
3. Check integration documentation in `docs/`
4. Test with minimal reproduction case
5. Check service status pages:
   - Supabase: https://status.supabase.com/
   - Sentry: https://status.sentry.io/
   - RevenueCat: https://status.revenuecat.com/
