/**
 * Subscription Tier Benefits Configuration
 * Defines what features are available at each tier level
 */

export type SubscriptionTier = 'free' | 'basic' | 'standard' | 'premium';

export interface TierBenefits {
  name: string;
  displayName: string;
  price: string;
  pricePerMonth: number;
  recommended?: boolean;
  features: {
    // AI Features
    aiPrayersPerDay: number;
    aiVerseContext: boolean;
    aiChapterSummaries: boolean;

    // Bible Features
    translations: string[];
    translationsCount: number;
    unlimitedPractice: boolean;
    practiceLimit?: number;

    // Progress & Engagement
    streakFreeze: boolean;
    streakFreezeLimit?: string;
    prayerHistory: boolean;
    progressExport: boolean;
    advancedAnalytics: boolean;

    // Premium Features
    storyModeAccess: boolean;
    personalizedPlans: boolean;
    prioritySupport: boolean;

    // Display features (for marketing)
    highlights: string[];
  };
}

export const TIER_BENEFITS: Record<SubscriptionTier, TierBenefits> = {
  free: {
    name: 'free',
    displayName: 'Free',
    price: 'Free',
    pricePerMonth: 0,
    features: {
      aiPrayersPerDay: 0,
      aiVerseContext: false,
      aiChapterSummaries: false,
      translations: ['KJV'],
      translationsCount: 1,
      unlimitedPractice: true,
      streakFreeze: false,
      prayerHistory: false,
      progressExport: false,
      advancedAnalytics: false,
      storyModeAccess: false,
      personalizedPlans: false,
      prioritySupport: false,
      highlights: [
        'Daily Bible verse',
        '1 Bible translation (KJV)',
        'Unlimited practice mode',
        'Daily spiritual goals tracking',
      ],
    },
  },

  basic: {
    name: 'basic',
    displayName: 'Basic',
    price: '€4.99/month',
    pricePerMonth: 4.99,
    features: {
      aiPrayersPerDay: 1,
      aiVerseContext: true,
      aiChapterSummaries: false,
      translations: ['KJV', 'NIV', 'WEB'],
      translationsCount: 3,
      unlimitedPractice: true,
      streakFreeze: true,
      streakFreezeLimit: '1x per week',
      prayerHistory: false,
      progressExport: false,
      advancedAnalytics: false,
      storyModeAccess: false,
      personalizedPlans: false,
      prioritySupport: false,
      highlights: [
        '1 AI prayer per day',
        'AI verse context & explanations',
        '3 Bible translations',
        'Streak freeze (1x/week)',
        'Unlimited practice mode',
      ],
    },
  },

  standard: {
    name: 'standard',
    displayName: 'Standard',
    price: '€9.99/month',
    pricePerMonth: 9.99,
    recommended: true,
    features: {
      aiPrayersPerDay: 3,
      aiVerseContext: true,
      aiChapterSummaries: true,
      translations: ['KJV', 'NIV', 'WEB', 'ESV', 'NLT', 'NASB', 'YLT'],
      translationsCount: 7,
      unlimitedPractice: true,
      streakFreeze: true,
      streakFreezeLimit: 'Unlimited',
      prayerHistory: true,
      progressExport: false,
      advancedAnalytics: false,
      storyModeAccess: false,
      personalizedPlans: false,
      prioritySupport: false,
      highlights: [
        '3 AI prayers per day',
        'Unlimited AI verse context',
        'AI chapter summaries',
        'All 7 Bible translations',
        'Unlimited practice mode',
        'Unlimited streak freezes',
        'Prayer history saved',
      ],
    },
  },

  premium: {
    name: 'premium',
    displayName: 'Pro',
    price: '€14.99/month',
    pricePerMonth: 14.99,
    features: {
      aiPrayersPerDay: 10,
      aiVerseContext: true,
      aiChapterSummaries: true,
      translations: ['KJV', 'NIV', 'WEB', 'ESV', 'NLT', 'NASB', 'YLT'],
      translationsCount: 7,
      unlimitedPractice: true,
      streakFreeze: true,
      streakFreezeLimit: 'Unlimited',
      prayerHistory: true,
      progressExport: true,
      advancedAnalytics: true,
      storyModeAccess: true,
      personalizedPlans: true,
      prioritySupport: true,
      highlights: [
        '10 AI prayers per day',
        'Everything in Standard',
        'Early Story Mode access',
        'Personalized study plans',
        'Advanced analytics',
        'Progress export (PDF)',
        'Priority support',
      ],
    },
  },
};

/**
 * Get tier benefits for a specific tier
 */
export function getTierBenefits(tier: SubscriptionTier): TierBenefits {
  return TIER_BENEFITS[tier];
}

/**
 * Get user's current tier from profile
 */
export function getUserTier(profile: any): SubscriptionTier {
  if (!profile?.is_premium) return 'free';

  const tier = profile.subscription_tier as string;
  if (tier === 'basic' || tier === 'standard' || tier === 'premium') {
    return tier;
  }

  // Fallback: if is_premium but no tier specified, assume basic
  return 'basic';
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  feature: keyof TierBenefits['features']
): boolean {
  const benefits = getTierBenefits(userTier);
  return !!benefits.features[feature];
}

/**
 * Get upgrade prompt text for a locked feature
 */
export function getUpgradePrompt(
  currentTier: SubscriptionTier,
  feature: string
): { title: string; message: string } {
  if (currentTier === 'free') {
    return {
      title: '✨ Unlock Pro Features',
      message: `${feature} is available with a Pro subscription.\n\nUpgrade to access unlimited AI insights, all Bible translations, and more!`,
    };
  }

  if (currentTier === 'basic') {
    return {
      title: '🚀 Upgrade to Standard',
      message: `${feature} is available in Standard tier and higher.\n\nUnlock 3 AI prayers per day, all translations, and chapter summaries!`,
    };
  }

  if (currentTier === 'standard') {
    return {
      title: '💎 Upgrade to Pro',
      message: `${feature} is available in Pro tier.\n\nGet 10 AI prayers per day, early Story Mode access, personalized plans, and advanced analytics!`,
    };
  }

  return {
    title: 'Feature Locked',
    message: `${feature} requires a Pro subscription.`,
  };
}
