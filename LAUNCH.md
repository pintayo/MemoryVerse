# 🚀 MemoryVerse Launch Guide

**Last Updated**: November 2025

This guide consolidates all launch preparation, checklists, and marketing strategies for MemoryVerse.

---

## 📋 Table of Contents

1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [Production Setup](#production-setup)
3. [Soft Launch Strategy](#soft-launch-strategy)
4. [Marketing & Growth](#marketing--growth)

---

## Pre-Launch Checklist

### ✅ Technical Requirements

**App Functionality**
- [ ] All core features working (memorization, practice, review, reading)
- [ ] Guest mode fully functional
- [ ] Premium features behind paywall
- [ ] Achievements unlocking correctly
- [ ] Streak tracking accurate
- [ ] Bible translations working
- [ ] Daily verse rotating properly

**Testing**
- [ ] iOS testing completed (TestFlight)
- [ ] Android testing completed (Internal testing)
- [ ] Guest mode thoroughly tested
- [ ] Premium upgrade flow tested
- [ ] In-app purchases tested (sandbox)
- [ ] Notifications working
- [ ] Offline mode functional

**Performance**
- [ ] App loads in < 3 seconds
- [ ] No memory leaks
- [ ] Smooth animations (60fps)
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Bundle size reasonable

### ✅ Store Presence

**App Store (iOS)**
- [ ] App submitted for review
- [ ] Screenshots uploaded (all sizes)
- [ ] App preview video uploaded
- [ ] Description optimized for ASO
- [ ] Keywords researched and added
- [ ] App icon finalized
- [ ] Privacy policy linked
- [ ] Terms of service linked
- [ ] Support URL added

**Google Play (Android)**
- [ ] App submitted for review
- [ ] Screenshots uploaded (all sizes)
- [ ] Feature graphic created
- [ ] Promo video uploaded
- [ ] Description optimized for ASO
- [ ] Keywords researched and added
- [ ] App icon finalized
- [ ] Privacy policy linked
- [ ] Terms of service linked
- [ ] Support email added

### ✅ Backend & Infrastructure

**Database**
- [ ] Supabase production project created
- [ ] All migrations applied
- [ ] Row Level Security (RLS) enabled
- [ ] Database backups configured
- [ ] Environment variables set

**Analytics & Monitoring**
- [ ] Sentry error tracking configured
- [ ] Analytics events implemented
- [ ] Conversion tracking setup
- [ ] User journey tracking

**Subscriptions**
- [ ] RevenueCat configured
- [ ] iOS products created
- [ ] Android products created
- [ ] Webhook configured
- [ ] Entitlements setup

### ✅ Legal & Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] COPPA compliance (if targeting children)
- [ ] GDPR compliance (if serving EU)
- [ ] App Store guidelines reviewed
- [ ] Google Play policies reviewed

### ✅ Support & Documentation

- [ ] Support email setup
- [ ] FAQ page created
- [ ] Help documentation
- [ ] Social media accounts created
- [ ] Community guidelines (if applicable)

---

## Production Setup

### 1. Environment Configuration

**Supabase Production**
```bash
# Create production project
1. Go to supabase.com
2. Create new project
3. Copy project URL and anon key
4. Update .env.production
```

**Environment Variables**
```bash
# .env.production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
REVENUECAT_API_KEY_IOS=your-ios-key
REVENUECAT_API_KEY_ANDROID=your-android-key
SENTRY_DSN=your-sentry-dsn
```

### 2. Build for Production

**iOS (App Store)**
```bash
# Update app version
# In app.json, increment version

# Build with EAS
eas build --platform ios --profile production

# Or build locally
cd ios && pod install && cd ..
npx react-native run-ios --configuration Release
```

**Android (Google Play)**
```bash
# Update app version
# In app.json, increment version

# Build with EAS
eas build --platform android --profile production

# Generate signed APK/AAB
cd android && ./gradlew bundleRelease
```

### 3. Database Migrations

```sql
-- Run all migrations in order
-- Go to Supabase SQL Editor
-- Execute each migration file:
001_initial_schema.sql
002_add_context_columns.sql
003_add_verses_update_policy.sql
004_add_chapter_contexts.sql
005_fix_chapter_contexts_schema.sql
006_add_daily_verses.sql
007_add_subscription_tier.sql
008_add_premium_features.sql
009_fix_bible_picker_functions.sql
010_add_story_mode_notifications.sql
011_add_daily_activities.sql
012_fix_daily_verse_timezone.sql
```

### 4. App Store Submission

**iOS App Store Connect**
1. Create new app in App Store Connect
2. Upload build from EAS or Xcode
3. Fill out app information
4. Upload screenshots & videos
5. Set pricing (Free with IAP)
6. Submit for review

**Google Play Console**
1. Create new app in Play Console
2. Upload AAB file
3. Fill out store listing
4. Upload screenshots & videos
5. Set pricing (Free with IAP)
6. Submit for review

---

## Soft Launch Strategy

### Phase 1: Private Beta (Week 1-2)

**Goal**: Test with close network, identify critical bugs

**Target**: 20-50 users
- Friends & family
- Church members
- Beta testing community

**Focus**:
- Stability testing
- Critical bug fixes
- User feedback collection
- Onboarding improvements

**Metrics to Track**:
- Crash rate (target: < 1%)
- Retention Day 1 (target: > 40%)
- Time to first verse learned
- Feature usage rates

### Phase 2: Closed Beta (Week 3-4)

**Goal**: Expand testing, optimize conversion

**Target**: 100-500 users
- TestFlight (iOS)
- Internal testing (Android)
- Christian app communities
- ProductHunt beta list

**Focus**:
- Conversion optimization
- Paywall testing
- Onboarding A/B tests
- Premium feature validation

**Metrics to Track**:
- Free → Premium conversion (target: > 2%)
- Average session length (target: > 5 min)
- Retention Day 7 (target: > 20%)
- Viral coefficient (target: > 0.1)

### Phase 3: Public Launch (Week 5-6)

**Goal**: Scale to thousands of users

**Channels**:
1. App Store Featured (submit for consideration)
2. Christian social media
3. Church partnerships
4. Content creators
5. Christian podcasts
6. Reddit communities (r/Christianity, r/Bible)
7. ProductHunt launch
8. Instagram Reels
9. TikTok videos
10. YouTube tutorials

**Launch Day Plan**:
- Post on all social channels
- Email beta users
- Submit to Christian app directories
- Post on Reddit (provide value, not spam)
- Reach out to Christian influencers
- Create launch video

---

## Marketing & Growth

### Content Strategy

**Instagram Reels (Primary Channel)**
- Memory technique tips
- Verse of the day with design
- Progress transformation stories
- Feature highlights
- Testimonials

**TikTok**
- Quick memory tips (< 30 sec)
- App walkthrough
- Verse challenges
- Streak celebrations
- Behind the scenes

**YouTube**
- Full app tutorial
- Memory techniques deep dive
- User testimonials
- Feature updates
- Bible study tips

### Organic Growth Tactics

**In-App Virality**
1. Share verse button → Instagram Stories
2. Achievement sharing
3. Streak milestones
4. Referral program (Future)
5. Church groups feature (Future)

**Community Building**
1. Facebook group for users
2. Discord server
3. Weekly verse challenges
4. User spotlight features
5. Bible study groups

**SEO & ASO**
1. App Store Optimization
   - Keywords: Bible memory, Scripture, memorize verses
   - Screenshots with value props
   - Video showing app in action

2. Blog content (Future)
   - "How to memorize Bible verses"
   - "Best memory techniques"
   - "Scripture memory for beginners"

### Paid Acquisition (Optional)

**When to Consider**:
- LTV > CAC by 3x
- Proven product-market fit
- Conversion rate optimized
- Churn under control

**Channels to Test**:
1. Facebook/Instagram Ads
   - Target: Christians, Bible study, memorization
   - Creative: User testimonials

2. Google Ads
   - Keywords: "Bible app", "memorize scripture"
   - Target: High intent searches

3. TikTok Ads
   - Target: Christians 18-35
   - Creative: Native content style

### Partnership Strategy

**Churches**
- Bulk subscriptions for members
- Custom church groups
- Pastor endorsements
- Sermon series tie-ins

**Christian Influencers**
- Affiliate program
- Free premium access
- Co-created content
- Testimonials

**Bible Study Groups**
- Group features
- Shared verse collections
- Progress tracking
- Discussion forums

---

## Success Metrics

### North Star Metric
**Verses Memorized** - The core value we deliver

### Key Metrics to Track

**Acquisition**
- App Store installs/day
- Google Play installs/day
- Organic vs. paid ratio
- Top traffic sources

**Activation**
- Sign-up rate
- First verse learned
- Time to activation
- Onboarding completion

**Retention**
- Day 1, 7, 30 retention
- Monthly active users (MAU)
- Daily active users (DAU)
- DAU/MAU ratio (target: > 20%)

**Revenue**
- Free → Premium conversion
- Monthly recurring revenue (MRR)
- Average revenue per user (ARPU)
- Customer lifetime value (LTV)

**Engagement**
- Verses learned/user
- Practice sessions/week
- Streak duration
- Time in app/session

**Referral**
- Viral coefficient
- Share rate
- Referral conversion
- K-factor (target: > 1.0)

---

## Launch Checklist Summary

**Week Before Launch**
- [ ] All features tested and working
- [ ] Store listings optimized
- [ ] Support infrastructure ready
- [ ] Analytics tracking verified
- [ ] Content calendar prepared
- [ ] Launch announcement drafted

**Launch Day**
- [ ] Monitor app stability
- [ ] Respond to user feedback quickly
- [ ] Post on all channels
- [ ] Email beta users
- [ ] Watch analytics dashboards
- [ ] Fix critical bugs ASAP

**Week After Launch**
- [ ] Gather user feedback
- [ ] Analyze metrics
- [ ] Prioritize improvements
- [ ] Plan next features
- [ ] Thank early users
- [ ] Iterate on marketing

---

## Resources

**Documentation**
- See `docs/APP_STORE_PREPARATION.md` for detailed store setup
- See `docs/GROWTH_STRATEGY.md` for marketing deep dive
- See `docs/REVENUECAT_SETUP.md` for subscription setup
- See `SETUP.md` for technical setup guide

**Tools**
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Supabase Dashboard](https://app.supabase.com)
- [RevenueCat Dashboard](https://app.revenuecat.com)
- [Sentry Dashboard](https://sentry.io)

**Support**
- Email: support@memoryverse.app
- Website: https://memoryverse.app
- Discord: [Link when created]
