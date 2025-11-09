# 🚀 Production Deployment Guide

## Current Status: Beta Ready

**All Critical Features**: ✅ Complete
**All User-Reported Issues**: ✅ Fixed
**Production Readiness**: ~85%

---

## 📋 Pre-Launch Checklist

### 🔴 Critical (Must Complete Before Launch)

- [x] Core features implemented
- [x] All user-reported bugs fixed
- [x] Production logger implemented
- [x] Database schema finalized
- [x] **Run `supabase/complete-setup.sql` in Supabase**
- [ ] Set up error tracking (Sentry recommended)
- [x] Environment variables validated
- [ ] Test all features end-to-end
- [ ] App icon and splash screen added
- [ ] Privacy policy hosted
- [ ] Terms of service hosted

### 🟡 Important (Should Complete)

- [ ] Analytics integration (Firebase/Mixpanel)
- [ ] Push notifications setup
- [ ] Performance optimization
- [ ] App Store metadata prepared
- [ ] Screenshots for store listing (iOS + Android)
- [ ] App Store Connect account ready
- [ ] Google Play Console account ready

### 🟢 Optional (Nice to Have)

- [ ] Social sharing features
- [ ] Referral program
- [ ] Beta testing program (TestFlight/Play Console)
- [ ] Marketing website
- [ ] Support email/system
- [ ] Bible chat buddy integration (Example: Understanding screen you can talk to him about that verse)

---

## 🛠️ Setup Instructions

### 1. Error Tracking Setup (Sentry)

**Why**: Track crashes and errors in production

```bash
# Install Sentry
npm install --save @sentry/react-native

# Initialize
npx @sentry/wizard -i reactNative -p ios android
```

**Configure** (`app.json`):
```json
{
  "expo": {
    "plugins": [
      "@sentry/react-native/expo"
    ],
    "extra": {
      "sentryDSN": "your-sentry-dsn"
    }
  }
}
```

**Update `src/utils/logger.ts`**:
```typescript
import * as Sentry from '@sentry/react-native';

export const logger = {
  error: (...args: any[]) => {
    if (__DEV__) {
      console.error(...args);
    } else {
      console.error('[PRODUCTION ERROR]', ...args);
      Sentry.captureException(args[1] || args[0]);
    }
  },
  // ... rest of logger
};
```

---

### 2. Analytics Setup (Firebase)

**Why**: Track user behavior, feature usage, conversions

```bash
# Install Firebase
npm install @react-native-firebase/app @react-native-firebase/analytics

# For Expo
npx expo install expo-firebase-analytics
```

**Track Key Events**:
```typescript
import analytics from '@react-native-firebase/analytics';

// User registration
analytics().logEvent('user_registered', { method: 'email' });

// Verse learned
analytics().logEvent('verse_learned', {
  book: verse.book,
  difficulty: verse.difficulty
});

// Premium viewed (for conversion tracking)
analytics().logEvent('premium_viewed', { source: 'pray_screen' });

// Profile updated
analytics().logEvent('profile_updated', { field: 'avatar' });
```

---

### 3. App Icon & Splash Screen

**Create Assets**:
- **Icon**: 1024x1024px PNG (no transparency)
- **Splash**: 2048x2048px PNG with safe area

```bash
# Install asset generator
npm install -g @expo/icon-splash

# Generate assets
npx expo-icon-splash-screen generate
```

**Update `app.json`**:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#F5F3F0"
    }
  }
}
```

---

### 4. Environment Variables (Production)

**Create `.env.production`**:
```env
# Production Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

# Production AI Keys
EXPO_PUBLIC_PERPLEXITY_API_KEY=your_production_key
EXPO_PUBLIC_PERPLEXITY_MODEL=sonar

# Analytics
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_key
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

**Load in app**:
```typescript
// src/config/env.ts
const ENV = __DEV__ ? 'development' : 'production';
import(`../.env.${ENV}`);
```

---

### 5. Build Configuration

**Update `app.json` for production**:
```json
{
  "expo": {
    "name": "MemoryVerse",
    "slug": "memoryverse",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#F5F3F0"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.memoryverse.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F5F3F0"
      },
      "package": "com.memoryverse.app",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

---

## 📦 Building for Production

### iOS (App Store)

**1. EAS Build Setup**:
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure
```

**2. Create Production Build**:
```bash
# Build for App Store
eas build --platform ios --profile production

# Or local build
npx expo run:ios --configuration Release
```

**3. Submit to App Store**:
```bash
eas submit --platform ios
```

### Android (Play Store)

**1. Generate Keystore**:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore memoryverse.keystore -alias memoryverse -keyalg RSA -keysize 2048 -validity 10000
```

**2. Build APK/AAB**:
```bash
# Build for Play Store
eas build --platform android --profile production

# Or local build
cd android && ./gradlew assembleRelease
```

**3. Submit to Play Store**:
```bash
eas submit --platform android
```

---

## 🧪 Testing Before Launch

### Functional Testing Checklist

- [ ] User registration flow
- [ ] Login/logout flow
- [ ] Password reset flow
- [ ] Verse learning (all features)
- [ ] AI context generation
- [ ] Practice/recall mode
- [ ] Prayer training
- [ ] Profile editing
- [ ] Leaderboard display
- [ ] Achievement unlocking
- [ ] Streak tracking
- [ ] XP system
- [ ] Navigation (all screens)

### Device Testing

- [ ] iPhone (latest iOS)
- [ ] iPhone (iOS - 1 version)
- [ ] Android (latest)
- [ ] Android (version - 1)
- [ ] Tablet (iOS)
- [ ] Tablet (Android)

### Network Testing

- [ ] Good connection
- [ ] Poor connection
- [ ] Offline mode
- [ ] Connection loss during action
- [ ] API rate limiting

### Edge Cases

- [ ] Very long user names
- [ ] Special characters in input
- [ ] Empty states (no verses, no progress)
- [ ] Maximum values (level 999, etc.)
- [ ] Rapid button clicks
- [ ] App backgrounding/foregrounding

---

## 📊 Monitoring Setup

### 1. Set Up Alerts

**Sentry** (Errors):
- Critical errors → Slack/Email immediately
- Warning errors → Daily digest

**Firebase** (Performance):
- App crash rate > 1%
- Screen load time > 3 seconds
- API response time > 2 seconds

### 2. Key Metrics to Track

**Engagement**:
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Session length
- Verses practiced per session
- Streak retention (day 1, 7, 30)

**Technical**:
- Crash-free sessions %
- App startup time
- Screen load times
- API response times
- Error rate

**Business** (for future premium):
- Free to premium conversion
- Premium subscriber count
- Churn rate
- Feature usage

---

## 🔒 Security Checklist

- [x] RLS policies enabled on all tables
- [x] API keys not exposed in client code
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Supabase handles)
- [ ] XSS prevention (React handles)
- [ ] HTTPS only (Supabase handles)
- [ ] Authentication timeout configured
- [ ] Password requirements enforced

---

## 📱 App Store Submission

### App Store (iOS)

**Required Materials**:
- App icon (1024x1024px)
- Screenshots (various device sizes)
- Privacy policy URL
- Support URL
- App description (max 4000 chars)
- Keywords (max 100 chars)
- Category selection
- Age rating

**Review Time**: 1-3 days typically

**Tips**:
- Have clear app description
- Show all features in screenshots
- Provide test account if needed
- Respond quickly to reviewer questions

### Play Store (Android)

**Required Materials**:
- App icon (512x512px)
- Feature graphic (1024x500px)
- Screenshots (phone + tablet)
- Privacy policy URL
- App description (max 4000 chars)
- Category selection
- Content rating questionnaire

**Review Time**: 1-3 days typically

---

## 🚨 Launch Day Checklist

**T-7 Days**:
- [ ] Submit to App Store
- [ ] Submit to Play Store
- [ ] Test production builds
- [ ] Set up monitoring dashboards
- [ ] Prepare launch announcement
- [ ] Brief support team

**T-1 Day**:
- [ ] Verify app approved in stores
- [ ] Double-check all monitoring
- [ ] Prepare for support requests
- [ ] Have rollback plan ready
- [ ] Check server capacity

**Launch Day**:
- [ ] Announce on social media
- [ ] Monitor error rates closely
- [ ] Watch user feedback
- [ ] Be ready for hotfixes
- [ ] Celebrate! 🎉

**T+1 Day**:
- [ ] Review analytics
- [ ] Address any critical bugs
- [ ] Respond to user reviews
- [ ] Plan first update

---

## 🔄 Post-Launch Maintenance

### Week 1
- Monitor error rates daily
- Respond to all user reviews
- Fix critical bugs immediately
- Collect user feedback

### Week 2-4
- Analyze usage patterns
- Plan feature improvements
- Optimize performance bottlenecks
- Plan premium features

### Month 2+
- Regular updates (every 2-4 weeks)
- Feature development from BACKLOG.md
- A/B test new features
- Build community

---

## 📞 Support Resources

**Technical Issues**:
- Sentry error dashboard
- Firebase performance monitoring
- Supabase logs

**User Support**:
- In-app feedback form
- Support email
- App Store/Play Store reviews
- Social media

**Team Communication**:
- Slack/Discord for team
- GitHub issues for bugs
- Project management tool (Trello/Notion)

---

## 🎯 Success Metrics (First 90 Days)

**User Acquisition**:
- Goal: 1,000 downloads
- Stretch: 5,000 downloads

**Engagement**:
- Goal: 40% Day-1 retention
- Goal: 20% Day-7 retention
- Goal: 10% Day-30 retention

**Technical**:
- Goal: >99% crash-free sessions
- Goal: <3s average load time
- Goal: 4+ star rating

**Revenue** (if premium launched):
- Goal: 2% free-to-premium conversion
- Goal: 50 premium subscribers

---

## 🛠️ Troubleshooting

### Build Issues
```bash
# Clear all caches
npm run clean
rm -rf node_modules
npm install

# iOS
cd ios && pod install && cd ..
rm -rf ios/build

# Android
cd android && ./gradlew clean && cd ..
```

### Deployment Issues
```bash
# EAS Build logs
eas build:list
eas build:view [build-id]

# Check credentials
eas credentials
```

### Runtime Issues
- Check Sentry for error reports
- Check Firebase for crashes
- Check Supabase logs for database issues
- Check API rate limits

---

**Production Deployment**: Ready when checklist complete! 🚀
**Support**: Create GitHub issue for technical problems
**Feedback**: Contact via app or email
