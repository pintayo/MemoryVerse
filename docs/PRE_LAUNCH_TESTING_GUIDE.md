# MemoryVerse - Pre-Launch Testing Guide

## 🎯 Purpose
This guide provides a systematic approach to testing all features before submitting to App Store and Google Play.

---

## ✅ COMPLETED & WORKING FEATURES

### Dashboard / Home Screen
- [x] Daily verse (timezone-aware, changes at local midnight)
- [x] Streak display (updates after practice)
- [x] XP tracking
- [x] Bible Companion character
- [x] Quick action buttons (Read, Understand, Review, Practice, Pray)

### Practice System
- [x] Recall mode (type the verse)
- [x] Fill-in-the-blanks mode
- [x] Accuracy scoring with fuzzy matching
- [x] XP rewards (Perfect: 50, Good: 30, Okay: 20, Poor: 10)
- [x] Progress tracking per verse

### Review System
- [x] Spaced repetition (SM-2 algorithm)
- [x] Review urgency indicators (Overdue, Due Today, Due Soon)
- [x] Tutorial card explaining how it works
- [x] Stats display (Due Today, Reviewing, Mastered counts)

### Understand Feature
- [x] Bible book/chapter/verse picker
- [x] AI-generated context for verses
- [x] Spiritual insights and historical background
- [x] Memory tips

### Pray Feature
- [x] 8 prayer categories (Morning, Evening, Mealtime, Bedtime, Gratitude, Comfort, Guidance, Forgiveness)
- [x] "Talk About Your Day" with AI prayer generation (Premium)
- [x] Usage limits (1/day for Basic tier)
- [x] Text input for day's reflections

### Bible Reader
- [x] Browse all books, chapters, verses
- [x] KJV translation loaded
- [x] Verse favoriting (star button)

### Streak System
- [x] Daily streak tracking
- [x] 90-day calendar heatmap
- [x] Milestone badges (7, 30, 100, 365 days)
- [x] Streak freeze (Premium, once per week)

### Profile & Account
- [x] User stats display (Streak, XP, Verses Learned, Level)
- [x] Profile editing (name)
- [x] Sign out functionality
- [x] Premium status display

### Premium Features
- [x] Premium upgrade screen with pricing
- [x] Feature gating (AI Prayer Coaching, Streak Freeze)
- [x] Usage tracking and limits
- [x] "Coming Soon" badges for future features

---

## 🧪 CRITICAL TESTING CHECKLIST

### Phase 1: Core User Flow (Must Pass)

#### New User Onboarding
- [ ] **Sign up flow works** (email + password)
- [ ] **Welcome screens display** correctly
- [ ] **First verse appears** on home screen
- [ ] **Can complete first practice** session without errors
- [ ] **XP and streak update** after first practice

#### Daily Practice Loop
- [ ] **Select a verse** from Bible or Practice
- [ ] **Complete Recall** mode successfully
- [ ] **See XP reward** animation
- [ ] **Streak increments** by 1 (if first practice today)
- [ ] **Profile stats update** (total XP, verses memorized)

### Phase 2: Feature Testing

#### Dashboard
- [ ] **Daily verse changes** at midnight (test by changing phone time)
- [ ] **Streak count matches** actual consecutive days practiced
- [ ] **Your Progress bar** shows correct verses memorized count
- [ ] **All 5 action buttons** navigate correctly

#### Practice
- [ ] **Random verse selection** works
- [ ] **Recall mode**: Typing verse shows real-time feedback
- [ ] **Fill-in-blanks**: Blanks appear correctly, answers validate
- [ ] **Hints system**: Using hints reduces XP earned
- [ ] **Completion screen**: Shows XP, accuracy, summary

#### Review (Spaced Repetition)
**Setup:** Complete 3-5 practice sessions with good accuracy

- [ ] **Tutorial card appears** on first visit
- [ ] **Tutorial can be dismissed** and stays dismissed
- [ ] **Stats show correct counts** (Due Today, Reviewing, Mastered)
- [ ] **Verses appear in correct urgency sections**
- [ ] **Tapping verse navigates** to practice
- [ ] **After practicing, next review date** updates correctly

**How to Test Spaced Repetition:**
1. Day 1: Practice 5 verses, get 90%+ accuracy
2. Day 2: Check Review screen - should show some verses "Due Today"
3. Day 3: Practice due verses again
4. Day 5: Check Review screen - verses practiced on Day 3 should be due again

#### Understand
- [ ] **Bible picker opens** and shows all 66 books
- [ ] **Selecting a book** shows all chapters
- [ ] **Selecting a chapter** shows all verses
- [ ] **Random verse button** works at each level
- [ ] **Context loads** for selected verse (may take 3-10 seconds)
- [ ] **AI-generated context** displays correctly
- [ ] **Star button** favorites the verse

#### Pray
- [ ] **All 8 prayer categories** open correctly
- [ ] **Each category shows** appropriate prayer text
- [ ] **"Talk About Your Day"** prompts for premium (if free user)
- [ ] **Premium users see** usage limit counter (X of Y prayers remaining)
- [ ] **Text input accepts** 1000 characters max
- [ ] **Generated prayer** appears after tapping "Generate Prayer"
- [ ] **Usage limit decrements** after each prayer generation
- [ ] **Limit reached message** appears after daily limit hit

#### Bible Reader
- [ ] **All books load** in picker
- [ ] **All chapters load** for selected book
- [ ] **All verses display** for selected chapter
- [ ] **Star button favorites** verses
- [ ] **Favorite verses persist** after app restart

#### Streak Calendar
- [ ] **Calendar displays** last 90 days
- [ ] **Practice days** show darker colors
- [ ] **Today** is highlighted with indicator
- [ ] **Tapping a day** shows practice count
- [ ] **Milestones section** shows correct badges
- [ ] **Reached milestones** show checkmarks
- [ ] **Next milestone** shows "X more days" counter
- [ ] **Streak freeze button** (Premium only) appears/works

#### Profile
- [ ] **Stats display correctly** (Streak, XP, Level, Verses Memorized)
- [ ] **Edit mode** allows changing name
- [ ] **Save profile** updates name successfully
- [ ] **Premium badge** shows if user is premium
- [ ] **All navigation buttons work** (Manage Premium, Study Notes, etc.)
- [ ] **Sign out** returns to login screen

#### Settings
- [ ] **All sections render** (Account, Notifications, Preferences, Data, About)
- [ ] **Toggle switches work** (save state)
- [ ] **Premium features** show lock icon (if free user)
- [ ] **Sign out** works from settings too
- [ ] **App version** displays correctly at bottom

### Phase 3: Edge Cases & Error Handling

#### Network Errors
- [ ] **No internet on launch**: Shows friendly error message
- [ ] **Internet lost during AI generation**: Fallback message appears
- [ ] **Slow network**: Loading indicators show, timeout after 30 seconds

#### Data Edge Cases
- [ ] **Empty states work**: No practices yet, no favorites, no achievements
- [ ] **First-time user**: Everything works without existing data
- [ ] **Large numbers**: 1000+ XP, 365+ day streak display correctly

#### Premium Feature Gating
- [ ] **Free user taps premium feature**: Upgrade modal appears
- [ ] **Premium user**: All premium features accessible
- [ ] **Usage limits**: Accurately track and display remaining uses
- [ ] **Midnight reset**: Usage limits reset at midnight local time

#### Input Validation
- [ ] **Long verse text** (200+ words) displays without truncation
- [ ] **Special characters** in prayers/notes don't break app
- [ ] **Empty inputs** show validation errors
- [ ] **Extremely long names** (100+ chars) are truncated gracefully

### Phase 4: Platform-Specific Testing

#### iOS Specific
- [ ] **Safe area** respected on all screen sizes (notch devices)
- [ ] **Keyboard avoidance** works in all text inputs
- [ ] **Status bar** color/style correct on all screens
- [ ] **Navigation gestures** work (swipe back)
- [ ] **Dark mode** toggle doesn't break UI (if implemented)

#### Android Specific
- [ ] **Back button** navigation works correctly
- [ ] **Hardware back button** doesn't break state
- [ ] **Different screen sizes** (small, medium, large) all render well
- [ ] **Android 12+ splash screen** displays correctly
- [ ] **Permissions** (notifications) request properly

---

## 🐛 KNOWN ISSUES TO VERIFY/FIX

### High Priority
1. **Profile Page**
   - Settings duplication: Both ProfileScreen and SettingsScreen have edit profile, sign out
   - **Fix:** Remove duplicate options from ProfileScreen, keep only in Settings
   - Streak calendar styling may need polish (verify icons display correctly)

2. **Achievements**
   - Verify achievements are actually awarded when milestones reached
   - Test: Get 50 XP → should unlock "First Steps" achievement
   - Test: 7-day streak → should unlock "Week Warrior" achievement

3. **Settings Functionality**
   - Test every toggle switch actually saves preference
   - Test notification settings connect to actual notification system
   - Verify daily reminder time picker works

### Medium Priority
4. **Leaderboard**
   - Decide if keeping for MVP (recommendation: remove, add in v1.1)
   - If keeping, verify it works and shows real data

5. **Favorite Verses**
   - Add quick access from Dashboard (currently only in Bible)
   - Create "Favorites" widget showing 3-5 most recent favorites

6. **Chapter Context Preloading**
   - Bible feature currently loads one verse at a time
   - Enhancement: Preload all verse contexts for a chapter when viewing

### Low Priority (Post-Launch)
7. **Speech-to-Text**: Marked as "Coming Soon" ✓
8. **Offline Downloads**: Marked as "Coming Soon" ✓
9. **Custom Themes**: Marked as "Coming Soon" ✓

---

## 📊 PERFORMANCE BENCHMARKS

### Loading Times (Target)
- App launch: < 2 seconds
- Daily verse load: < 1 second
- Practice session start: < 1 second
- AI context generation: 3-10 seconds (acceptable)
- Bible book list: < 0.5 seconds

### Memory Usage
- Baseline: < 100MB
- With 100 cached verses: < 150MB
- After 1 hour use: < 200MB

### Network Usage
- Daily verse: ~2KB
- Verse with context: ~5-10KB
- AI prayer generation: ~5-15KB
- Total for 30-minute session: < 500KB

---

## 🚀 PRE-SUBMISSION CHECKLIST

### Code Quality
- [ ] **No console.logs** in production code (use logger)
- [ ] **No TODO comments** in critical paths
- [ ] **All TypeScript errors resolved**
- [ ] **No linter warnings** (run `npm run lint`)
- [ ] **Build succeeds** for both iOS and Android

### Database
- [ ] **Migration 006 applied** to production Supabase
- [ ] **All tables created** (daily_verses, usage_limits)
- [ ] **All functions work** (get_bible_books, get_bible_chapters, etc.)
- [ ] **RLS policies enabled** and tested
- [ ] **Test data cleaned up** from development

### Content
- [ ] **All placeholder text replaced** with real content
- [ ] **Bible verses loaded** (all 31,102 verses)
- [ ] **Premium features** clearly marked
- [ ] **"Coming Soon" badges** on unimplemented features

### Legal & Compliance
- [ ] **Privacy Policy** written and linked
- [ ] **Terms of Service** written and linked
- [ ] **Data collection disclosed** (analytics, error tracking)
- [ ] **Age rating set** (4+ recommended)
- [ ] **COPPA compliance** verified (no data from under-13 without parental consent)

### App Store Assets
- [ ] **App icon** created (1024x1024, no transparency, no rounded corners for iOS)
- [ ] **Screenshots** prepared (6.7", 5.5" for iOS; multiple densities for Android)
- [ ] **App description** written (compelling, SEO-optimized)
- [ ] **Keywords** chosen (5-7 keywords for search)
- [ ] **Support URL** set up (email or website)
- [ ] **Marketing URL** set up (landing page)

---

## 📱 DEVICE TESTING MATRIX

### Minimum Test Devices
- **iOS**: iPhone SE (small screen), iPhone 14 (notch), iPad (tablet)
- **Android**: Samsung Galaxy (popular), Google Pixel (stock Android), cheap device (performance)

### OS Versions
- **iOS**: 14.0+ (minimum supported)
- **Android**: 10.0+ (API 29+, minimum supported)

---

## 🎨 VISUAL POLISH CHECKLIST

### Typography
- [ ] **Consistent font sizes** across all screens
- [ ] **Line heights** comfortable to read (1.4-1.6x font size)
- [ ] **Text truncation** handled gracefully (ellipsis on long text)

### Colors
- [ ] **Sufficient contrast** (4.5:1 for body text, 3:1 for large text)
- [ ] **Accessible** for colorblind users (don't rely only on color)
- [ ] **Brand consistency** (colors match across all screens)

### Spacing
- [ ] **Consistent padding** (use theme.spacing values)
- [ ] **Visual breathing room** (not cramped or too sparse)
- [ ] **Aligned elements** (buttons, cards, text blocks)

### Interactions
- [ ] **Loading states** for all async operations
- [ ] **Empty states** for lists with no data
- [ ] **Error states** for failures (with retry buttons)
- [ ] **Success states** for completed actions

---

## 🐞 BUG REPORTING TEMPLATE

When you find a bug during testing, document it using this format:

```
**Bug:** [Short description]
**Severity:** Critical | High | Medium | Low
**Steps to Reproduce:**
1. Open app
2. Navigate to [screen]
3. Tap [button]
4. Observe [issue]

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Device:** iPhone 14, iOS 16.5
**Screenshot:** [Attach if visual issue]
```

---

## ✅ TESTING SIGN-OFF

Before submitting to app stores, get sign-off from:

- [ ] **Developer** (you): All features work as designed
- [ ] **Product Owner** (you): Meets business requirements
- [ ] **Beta Testers** (5-10 friends/family): No major issues found
- [ ] **Designer** (if applicable): UI/UX approved

**Testing Completed By:** _______________
**Date:** _______________
**Ready for Submission:** YES / NO

---

## 📞 SUPPORT PLAN

Before launch, set up:
1. **Support email**: support@memoryverse.app (or similar)
2. **FAQ page**: Common questions answered
3. **Bug report form**: Easy way for users to report issues
4. **Response time goal**: 24-48 hours for critical issues

---

## 🎯 SUCCESS METRICS (Post-Launch)

Track these to measure success:

### Week 1
- Downloads: Target 50-100
- Daily Active Users (DAU): Target 30%+ of downloads
- Retention (Day 1): Target 40%+
- Crashes: Target < 1%

### Month 1
- Monthly Active Users (MAU): Target 50+ active users
- Retention (Day 7): Target 20%+
- Premium conversions: Target 5-10%
- Average session length: Target 10+ minutes

### Performance
- Crash rate: < 1%
- API error rate: < 5%
- Average load time: < 3 seconds
- User rating: Target 4.5+ stars

---

**Last Updated:** November 16, 2024
**Version:** 1.0 Pre-Launch
