# 📋 MemoryVerse Feature Backlog

**Purpose**: Wishlist of features for future development
**Priority System**: 🔴 High | 🟡 Medium | 🟢 Low | 💎 Premium Features

---

## 🚀 Core Features (MVP Complete)

✅ User authentication (sign up, login, logout)
✅ Profile management with avatar and name editing
✅ Verse learning with scrollable text
✅ AI-powered context generation (Perplexity integration)
✅ Practice/recall mode with voice input
✅ Prayer training mode
✅ Gamification (XP, levels, streaks)
✅ Achievements and badges
✅ Leaderboard
✅ Default avatar for new users

---

## 💎 Premium Features (Monetization)

### Prayer Screen Enhancements 🟡
**Status**: Planned
**User Request**: "I want that you can listen back to your prayer and that ai can help you get better at praying"

**Features**:
- **Voice-Guided Prayer** 💎
  - AI listens to user speak
  - Provides real-time prayer suggestions
  - Writes out what user can say next based on context

- **AI Prayer Coaching** 💎
  - Record and save prayers
  - Playback previous prayers
  - AI analyzes prayer patterns and provides feedback
  - "Getting better at praying" metrics

- **Personalized Prayer Generation** 💎
  - User shares their struggles/concerns
  - AI generates personalized prayer template
  - Guided prayer sessions based on needs

- **Prayer History** 💎
  - Library of recorded prayers
  - Searchable by date, topic, or verse
  - Progress tracking over time

**Implementation Notes**:
- Requires audio recording/playback functionality
- Need speech-to-text integration
- AI coaching needs prompt engineering
- Storage for audio files (Supabase Storage)
- Premium subscription gate

---

## 🔴 High Priority (Next Sprint)

### 1. Prayer Screen Redesign 🔴
**Status**: Design needed
**User Request**: "I think I see a verse to the prayer training screen but it needs to be about praying right not a verse reciting?"

**Issues**:
- Current pray screen shows verse (recitation focus)
- Should focus on actual prayer practice
- Confusing user experience

**Proposed Solution**:
- Remove verse display from main screen
- Add prayer prompts/themes instead
- Guide user through prayer structure:
  1. Praise/Worship
  2. Confession
  3. Thanksgiving
  4. Supplication (requests)
- Optional: Link prayers to verses for context

---

### 2. Early Bird Achievement Tracking 🔴
**Status**: TODO in code
**Location**: `src/screens/ProfileScreen.tsx:192`

**Features**:
- Track practice sessions before 7 AM
- Award "Early Bird" badge after 5 morning sessions
- Store practice time in `practice_sessions` table
- Add filter for morning sessions in achievement service

**Database Changes**:
```sql
-- Already tracked in practice_sessions.created_at
-- Just need logic to count sessions before 7 AM
```

---

### 3. Offline Mode 🔴
**Why**: Users should be able to practice verses without internet

**Features**:
- Cache learned verses locally
- Sync when internet returns
- Offline indicator in UI
- Download verses for offline use

**Implementation**:
- AsyncStorage for local caching
- Sync queue for offline actions
- NetInfo API for connection detection

---

### 4. Push Notifications 🔴
**Why**: Increase engagement and streak maintenance

**Features**:
- Daily reminder for practice
- Streak risk notifications ("Don't break your 7-day streak!")
- Achievement unlocked notifications
- Customizable notification times

**Implementation**:
- Expo Notifications
- Supabase scheduled functions
- User preferences in profile table

---

## 🟡 Medium Priority (Future Sprints)

### 5. Verse Collections 🟡
**Why**: Users want to organize verses by themes

**Features**:
- Create custom collections ("Comfort", "Strength", "Hope")
- Add verses to multiple collections
- Share collections with others
- Premium: Unlimited collections (free: 3 collections)

---

### 6. Social Features 🟡

**Friend System**:
- Add friends by username/email
- See friends on leaderboard
- Private leaderboards with friends only

**Sharing**:
- Share achievements to social media
- Share favorite verses with custom images
- Invite friends (referral system)

**Community Challenges**:
- Weekly group challenges
- Church/group competitions
- Shared progress tracking

---

### 7. Advanced Statistics 🟡

**Detailed Analytics**:
- Practice time per day/week/month
- Most practiced verses
- Success rate trends
- Streak history graph
- Best practice time of day

**Insights**:
- "You practice best in the evening"
- "Your accuracy improves after 3+ days"
- Personalized tips based on data

---

### 8. Verse Discovery 🟡

**Smart Recommendations**:
- Based on difficulty level
- Based on categories user prefers
- Based on spiritual journey stage
- AI-powered verse suggestions

**Browse & Search**:
- Filter by book, category, difficulty
- Search by keyword or theme
- Trending verses in community
- Seasonal verse recommendations

---

### 9. Multiple Bible Translations 🟡
**Current**: NIV only
**Future**: KJV, ESV, NKJV, NASB, etc.

**Features**:
- Choose preferred translation in settings
- Compare translations side-by-side
- Switch translations per verse
- Premium: Access to all translations

---

### 10. Memorization Tools 🟡

**Visual Aids**:
- Verse cards with beautiful typography
- Memory palace technique support
- Visual associations for verses

**Practice Modes**:
- Fill-in-the-blank mode
- First letter hints mode
- Scrambled word challenges
- Progressive difficulty

**Spaced Repetition**:
- SRS algorithm for optimal review timing
- Automatic scheduling of review sessions
- Difficulty adjustment based on performance

---

## 🟢 Low Priority (Nice to Have)

### 11. Accessibility Enhancements 🟢
- Screen reader optimization
- Voice-only navigation mode
- High contrast themes
- Font size customization
- Dyslexia-friendly font option
- Reduced motion support

---

### 12. Localization (i18n) 🟢
- Multiple language support
- Bible translations in other languages
- Locale-specific formatting
- Right-to-left language support

---

### 13. Desktop/Web Version 🟢
- Progressive Web App (PWA)
- Desktop Electron app
- Sync across devices
- Web-only features (keyboard shortcuts)

---

### 14. Apple Watch / Wearables 🟢
- Quick verse review on watch
- Practice reminders
- Streak notifications
- Mini-games for memorization

---

### 15. Widgets 🟢
- Home screen verse widget
- Today's progress widget
- Streak counter widget
- Verse of the day widget

---

## 🎨 UI/UX Improvements

### 16. Themes 🟢
- Dark mode improvements
- Custom color schemes
- Seasonal themes (Christmas, Easter)
- User-created themes (Premium)

---

### 17. Animations 🟢
- Celebration animations for achievements
- Smooth page transitions
- Loading states with animations
- Micro-interactions for engagement

---

### 18. Onboarding 🟡
- Interactive tutorial
- Video walkthrough
- Sample verse to practice
- Personalization questions (interests, goals)

---

## 🔧 Technical Improvements

### 19. Performance Optimization 🟡
- Image optimization
- Code splitting
- Lazy loading
- Cache optimization
- Database query optimization

---

### 20. Testing 🟡
- Unit tests (Jest)
- Integration tests
- E2E tests (Detox/Maestro)
- Performance testing
- Load testing

---

### 21. Error Tracking & Analytics 🔴
**Status**: High priority, needs implementation

- **Error Tracking**: Sentry or Bugsnag
- **Analytics**: Firebase Analytics or Mixpanel
- **Performance Monitoring**: Firebase Performance
- **User Behavior**: Hotjar or FullStory (web)

---

### 22. CI/CD Pipeline 🟡
- Automated testing on PR
- Automated builds
- Automated deployments
- Version management
- Release notes generation

---

### 23. Documentation 🟡
- API documentation
- Component library docs
- Contribution guidelines
- Architecture decision records (ADRs)

---

## 💰 Monetization Strategy

### Free Tier
- 50 verses limit
- Basic achievements
- 3 custom collections
- Ad-supported (or donation-based)

### Premium Tier ($4.99/month or $39.99/year)
- **Unlimited verses**
- **AI Prayer Coaching** 💎
- **Voice-guided prayer** 💎
- **Personalized prayer generation** 💎
- **Prayer history & recordings** 💎
- **Unlimited collections**
- **All Bible translations**
- **Advanced statistics**
- **No ads**
- **Early access to new features**
- **Custom themes**

### Church/Group Plans ($19.99/month)
- Multiple user accounts
- Group challenges
- Admin dashboard
- Custom content
- Progress tracking
- Bulk pricing

---

## 🗺️ Roadmap

### Phase 1: Production Launch (Current)
- ✅ Core features complete
- ✅ All critical bugs fixed
- 🟡 Error tracking setup
- 🟡 App Store submission

### Phase 2: User Growth (1-3 months)
- Push notifications
- Verse collections
- Social sharing
- Onboarding improvements
- Performance optimization

### Phase 3: Premium Features (3-6 months)
- Prayer screen redesign
- AI prayer coaching (Premium)
- Voice-guided prayer (Premium)
- Multiple translations (Premium)
- Advanced statistics (Premium)

### Phase 4: Community (6-12 months)
- Friend system
- Community challenges
- Church/group features
- Social features expansion

### Phase 5: Platform Expansion (12+ months)
- Web version (PWA)
- Desktop app
- Apple Watch app
- Widgets
- API for third-party integrations

---

## 📊 Success Metrics

### Engagement Metrics
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Session length
- Verses practiced per session
- Streak retention rate

### Monetization Metrics
- Free to Premium conversion rate
- Premium subscriber count
- Monthly Recurring Revenue (MRR)
- Churn rate
- Lifetime Value (LTV)

### Growth Metrics
- New user signups
- Referral rate
- App Store rating
- Social media shares
- Press mentions

---

## 🎯 User Feedback Integration

**From User**: "Pray screen needs to be about praying right not a verse reciting"
**Priority**: 🔴 High
**Solution**: Redesign pray screen (see #1 above)

**From User**: "I want that you can listen back to your prayer and that ai can help you get better at praying"
**Priority**: 💎 Premium Feature
**Solution**: AI Prayer Coaching (see Premium Features above)

**From User**: "And we can do a voice guide maybe that it listens to the person speak and then write out what they can say next"
**Priority**: 💎 Premium Feature
**Solution**: Voice-Guided Prayer (see Premium Features above)

---

## 📝 Notes

- Features marked 💎 are planned as premium/paid features
- Priorities can shift based on user feedback and market demands
- Technical debt should be addressed alongside new features
- User research should validate features before major development
- MVP is complete - focus on growth and monetization next

---

**Last Updated**: Current Session
**Maintained By**: Development Team
**Version**: 1.0
