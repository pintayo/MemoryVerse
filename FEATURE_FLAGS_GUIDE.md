# Feature Flags System - Complete Guide

**Last Updated:** 2025-11-10
**Version:** 1.0
**Purpose:** Easy on/off toggle for all features + Premium tier management

---

## 🎯 What Problem Does This Solve?

### Before Feature Flags:
```typescript
// Code scattered everywhere checking conditions
if (user.isPremium && ENABLE_SOCIAL_SHARING && !isProduction) {
  // Show social sharing feature
}
```

### With Feature Flags:
```typescript
// Simple, centralized control
if (useFeatureFlag('socialSharing')) {
  // Show social sharing feature
}
```

---

## 📦 What's Included

**Files Created:**
1. `src/config/featureFlags.ts` - Central configuration
2. `src/hooks/useFeatureFlag.ts` - React hooks for components
3. `src/components/FeatureCard.tsx` - UI component for feature discovery
4. `FEATURE_FLAGS_GUIDE.md` - This guide

**Features:**
- ✅ Toggle any feature on/off instantly
- ✅ Premium vs Free tier management
- ✅ "Coming Soon" badges
- ✅ Version tracking (v1.0, v1.1, etc.)
- ✅ Easy A/B testing
- ✅ Gradual rollout support

---

## 🚀 Quick Start

### 1. Check if Feature is Enabled

```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const canUseSocialSharing = useFeatureFlag('socialSharing');

  if (!canUseSocialSharing) {
    return null; // Don't render feature
  }

  return <SocialSharingButton />;
}
```

### 2. Get Feature Config

```typescript
import { useFeatureConfig } from '@/hooks/useFeatureFlag';

function FeatureSettings() {
  const config = useFeatureConfig('readingPlans');

  return (
    <View>
      <Text>{config.description}</Text>
      {config.comingSoon && <Badge>Coming Soon</Badge>}
      {config.premium && <Badge>Premium</Badge>}
    </View>
  );
}
```

### 3. Check Premium Status

```typescript
import { useHasPremium } from '@/hooks/useFeatureFlag';

function PremiumFeature() {
  const hasPremium = useHasPremium();

  if (!hasPremium) {
    return <UpgradePrompt />;
  }

  return <PremiumContent />;
}
```

---

## 🎨 Using the FeatureCard Component

Perfect for settings screens or feature discovery:

```typescript
import { FeatureCard } from '@/components';
import { featureFlags } from '@/config/featureFlags';
import { useHasPremium } from '@/hooks/useFeatureFlag';
import Svg, { Path } from 'react-native-svg';

function FeaturesScreen() {
  const hasPremium = useHasPremium();

  return (
    <ScrollView>
      <FeatureCard
        title="Reading Plans"
        description="30-day, 90-day, and 1-year Bible reading plans"
        icon={
          <Svg width="32" height="32" viewBox="0 0 24 24">
            <Path d="M..." fill="#..." />
          </Svg>
        }
        feature={featureFlags.readingPlans}
        isPremiumUser={hasPremium}
        onPress={() => navigation.navigate('ReadingPlans')}
        onUpgradePress={() => navigation.navigate('Premium')}
      />

      <FeatureCard
        title="Social Sharing"
        description="Share verses on social media"
        icon={<ShareIcon />}
        feature={featureFlags.socialSharing}
        isPremiumUser={hasPremium}
        onPress={() => navigation.navigate('Share')}
      />
    </ScrollView>
  );
}
```

**The FeatureCard automatically shows:**
- ✅ "Premium" badge if requires premium
- ✅ "Coming Soon" badge if not yet released
- ✅ Version tag (v1.1, v2.0, etc.)
- ✅ Disabled state if not available
- ✅ "Tap to upgrade" hint for premium features

---

## 🔧 Configuration Guide

### Enabling a Feature

Open `src/config/featureFlags.ts`:

```typescript
readingPlans: {
  enabled: true,  // ← Change false to true
  premium: false,
  comingSoon: false, // ← Remove this when ready
  description: '30-day, 90-day, 1-year reading plans',
  version: 'v2.0',
}
```

### Making a Feature Premium

```typescript
advancedAnalytics: {
  enabled: true,
  premium: true,  // ← Requires premium subscription
  description: 'Detailed learning analytics and insights',
  version: 'v1.1',
}
```

### Beta Testing a Feature

```typescript
aiStudyBuddy: {
  enabled: true,
  premium: false,
  betaOnly: true,  // ← Only beta users see this
  comingSoon: true,
  description: 'Chat with AI about verses',
  version: 'v3.0',
}
```

---

## 📝 Real-World Examples

### Example 1: Conditionally Show Navigation Tab

```typescript
// src/navigation/BottomTabNavigator.tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function BottomTabNavigator() {
  const showCollections = useFeatureFlag('verseCollections');

  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Review" component={ReviewScreen} />

      {showCollections && (
        <Tab.Screen name="Collections" component={CollectionsScreen} />
      )}

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

### Example 2: Premium Upsell

```typescript
// src/screens/StreakCalendarScreen.tsx
import { useFeatureFlag, useHasPremium } from '@/hooks/useFeatureFlag';

function StreakCalendarScreen() {
  const canUseStreakFreeze = useFeatureFlag('streakFreeze');
  const hasPremium = useHasPremium();

  const handleStreakFreezePress = () => {
    if (!hasPremium) {
      Alert.alert(
        'Premium Feature',
        'Streak Freeze requires a premium subscription',
        [
          { text: 'Maybe Later' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Premium') }
        ]
      );
      return;
    }

    // Use streak freeze
    activateStreakFreeze();
  };

  if (!canUseStreakFreeze) {
    return null; // Don't show feature at all
  }

  return <StreakFreezeButton onPress={handleStreakFreezePress} />;
}
```

### Example 3: Coming Soon Section

```typescript
// src/screens/ProfileScreen.tsx
import { getUpcomingFeatures } from '@/config/featureFlags';
import { FeatureCard } from '@/components';

function ProfileScreen() {
  const upcomingFeatures = getUpcomingFeatures();

  return (
    <ScrollView>
      {/* Current features */}
      <Section title="Available Now">
        {/* ... */}
      </Section>

      {/* Coming soon features */}
      {upcomingFeatures.length > 0 && (
        <Section title="Coming Soon">
          {upcomingFeatures.map((featureKey) => (
            <FeatureCard
              key={featureKey}
              feature={featureFlags[featureKey]}
              {...getFeatureProps(featureKey)}
            />
          ))}
        </Section>
      )}
    </ScrollView>
  );
}
```

---

## 🎭 Advanced Use Cases

### A/B Testing

```typescript
// Enable feature for 50% of users
const userId = user?.id || '';
const userBucket = parseInt(userId.slice(-2), 16) % 100;

const isInABTest = userBucket < 50; // 50% of users

if (isInABTest && featureFlags.newDesign.enabled) {
  return <NewDesign />;
}

return <OldDesign />;
```

### Gradual Rollout

```typescript
// Rollout percentage stored in feature config
socialSharing: {
  enabled: true,
  premium: false,
  rolloutPercentage: 25, // Start with 25% of users
  ...
}

// In your component
const rolloutPercent = featureFlags.socialSharing.rolloutPercentage || 100;
const userHash = hashUserId(user.id);
const isInRollout = (userHash % 100) < rolloutPercent;

if (isInRollout && useFeatureFlag('socialSharing')) {
  return <SocialSharing />;
}
```

### Time-Based Activation

```typescript
// Enable feature on specific date
const FEATURE_LAUNCH_DATE = new Date('2025-12-01');

function useTimedFeature(feature: string) {
  const flagEnabled = useFeatureFlag(feature);
  const isAfterLaunch = new Date() >= FEATURE_LAUNCH_DATE;

  return flagEnabled && isAfterLaunch;
}
```

---

## 🛠️ Helper Functions

### Get All Features by Version

```typescript
import { getFeaturesByVersion } from '@/config/featureFlags';

const v11Features = getFeaturesByVersion('v1.1');
// Returns: ['progressDashboard', 'detailedAnalytics', 'learningInsights']
```

### Get All Premium Features

```typescript
import { getPremiumFeatures } from '@/config/featureFlags';

const premiumFeatures = getPremiumFeatures();
// Returns: ['streakFreeze', 'detailedAnalytics', 'audioVerses', ...]
```

### Check if Feature Available (without React)

```typescript
import { isFeatureAvailable } from '@/config/featureFlags';

const isPremium = user?.is_premium || false;

if (isFeatureAvailable('customThemes', isPremium)) {
  // Feature is enabled AND user has access
}
```

---

## 📊 Feature Lifecycle

### 1. Planning Phase
```typescript
newFeature: {
  enabled: false,
  premium: false,
  comingSoon: true, // Show in "Coming Soon"
  description: '...',
  version: 'v2.0',
}
```

### 2. Development Phase
```typescript
newFeature: {
  enabled: false, // Still building
  premium: false,
  comingSoon: true,
  betaOnly: true, // Can enable for beta testers
  description: '...',
  version: 'v2.0',
}
```

### 3. Beta Testing
```typescript
newFeature: {
  enabled: true, // ← Enable for testing
  premium: false,
  comingSoon: true,
  betaOnly: true,
  description: '...',
  version: 'v2.0',
}
```

### 4. Soft Launch (25% rollout)
```typescript
newFeature: {
  enabled: true,
  premium: false,
  comingSoon: false, // ← Remove badge
  betaOnly: false,
  rolloutPercentage: 25, // Gradual rollout
  description: '...',
  version: 'v2.0',
}
```

### 5. Full Launch
```typescript
newFeature: {
  enabled: true,
  premium: false,
  description: '...',
  version: 'v2.0',
}
```

---

## 🎯 Best Practices

### ✅ DO:
- Use feature flags for ALL new features
- Set `comingSoon: true` while building
- Update `version` field when adding features
- Check flags at component level, not deep in logic
- Document what each feature does

### ❌ DON'T:
- Hard-code feature availability checks
- Forget to update flags after launch
- Use flags for bug fixes (use proper fixes instead)
- Nest feature flag checks too deeply
- Leave old flags enabled forever

---

## 🚀 Shipping Features

### Pre-Launch Checklist:
- [ ] Feature is fully tested
- [ ] Set `enabled: true`
- [ ] Remove `comingSoon: true`
- [ ] Update version field
- [ ] Test with premium: false and premium: true
- [ ] Update FEATURE_FLAGS_GUIDE.md

### Launch Day:
```bash
# 1. Update feature flag
# 2. Commit and push
git add src/config/featureFlags.ts
git commit -m "feat: Enable [feature name] for all users"
git push

# 3. Deploy app update
# 4. Monitor analytics
```

---

## 📈 Monitoring

### Track Feature Usage

```typescript
import { analytics } from '@/services/analyticsService';

if (useFeatureFlag('socialSharing')) {
  analytics.trackEvent('feature_enabled', {
    feature: 'socialSharing',
    isPremium: hasPremium,
  });
}
```

### A/B Test Results

```typescript
// Track which variant user sees
analytics.trackEvent('ab_test_variant', {
  feature: 'newDesign',
  variant: isVariantA ? 'A' : 'B',
});
```

---

## 🔄 Migration Guide

### Converting Existing Features

**Before:**
```typescript
// Scattered checks everywhere
if (user.is_premium) {
  return <StreakFreeze />;
}
```

**After:**
```typescript
// Centralized control
if (useFeatureFlag('streakFreeze')) {
  return <StreakFreeze />;
}
```

**Steps:**
1. Add feature to `featureFlags.ts`
2. Replace manual checks with `useFeatureFlag()`
3. Test both enabled/disabled states
4. Remove old conditional logic

---

## 🆘 Troubleshooting

**Feature not showing?**
1. Check `enabled: true` in featureFlags.ts
2. Check `premium` matches user's status
3. Verify component uses `useFeatureFlag()`
4. Check console for errors

**Premium check not working?**
1. Verify `profile.is_premium` is set in database
2. Check AuthContext provides profile
3. Test with test premium account

---

## 📚 Reference

### All Available Hooks

```typescript
import {
  useFeatureFlag,        // Check if feature available
  useFeatureConfig,      // Get full feature config
  useFeaturePremiumStatus, // Check if requires premium
  useEnabledFeatures,    // Get all enabled features
  useHasPremium,         // Check if user has premium
} from '@/hooks/useFeatureFlag';
```

### All Helper Functions

```typescript
import {
  isFeatureAvailable,    // Check availability (non-React)
  getAvailableFeatures,  // Get all available features
  getFeaturesByVersion,  // Get features by version
  getUpcomingFeatures,   // Get coming soon features
  getPremiumFeatures,    // Get premium features
} from '@/config/featureFlags';
```

---

## 🎉 Success!

You now have a **production-ready feature flags system**!

**Benefits:**
- ✅ Ship features but keep them off
- ✅ Easy A/B testing
- ✅ Premium tier management
- ✅ Gradual rollouts
- ✅ "Coming Soon" previews
- ✅ No code changes to toggle features

**Next Steps:**
1. Build future features with flags disabled
2. Enable when ready to ship
3. Monitor usage and engagement
4. Iterate based on data

---

**Happy Feature Flagging! 🚀**
