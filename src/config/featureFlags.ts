/**
 * Feature Flags Configuration
 *
 * Central place to enable/disable features and manage premium vs free tiers
 *
 * Usage:
 * import { featureFlags } from '@/config/featureFlags';
 * if (featureFlags.socialSharing.enabled) { ... }
 */

export interface FeatureModule {
  enabled: boolean;
  premium: boolean; // Requires premium subscription?
  comingSoon?: boolean; // Show "Coming Soon" badge
  betaOnly?: boolean; // Only available in beta
  description: string;
  version: string; // When this feature was added (e.g., 'v1.1', 'v2.0')
}

export interface FeatureFlagsConfig {
  // CORE FEATURES (Always enabled)
  onboarding: FeatureModule;
  verseSearch: FeatureModule;
  spacedRepetition: FeatureModule;
  studyNotes: FeatureModule;
  streakTracking: FeatureModule;

  // PRACTICE MODES
  voiceRecording: FeatureModule;
  aiPrayerCoaching: FeatureModule;

  // GAMIFICATION
  leaderboard: FeatureModule;
  achievements: FeatureModule;
  xpSystem: FeatureModule;

  // NOTIFICATIONS & REMINDERS
  dailyReminders: FeatureModule;
  streakFreeze: FeatureModule;

  // MONETIZATION & SETTINGS
  premiumUpgrade: FeatureModule;
  settingsScreen: FeatureModule;
  inAppPurchases: FeatureModule;

  // GROWTH & RETENTION
  appReviewPrompt: FeatureModule;
  enhancedAnalytics: FeatureModule;
  deepLinking: FeatureModule;

  // DATA & EXPORT
  exportData: FeatureModule;
  dataBackup: FeatureModule;

  // POLISH & UX
  betterErrorStates: FeatureModule;
  hapticFeedback: FeatureModule;
  loadingSkeletons: FeatureModule;
  emptyStates: FeatureModule;
  pullToRefresh: FeatureModule;
  whatsNewScreen: FeatureModule;

  // CONTENT & DISCOVERY
  verseCollections: FeatureModule;
  readingPlans: FeatureModule;
  verseOfTheDay: FeatureModule;

  // ANALYTICS & INSIGHTS
  progressDashboard: FeatureModule;
  detailedAnalytics: FeatureModule;
  learningInsights: FeatureModule;

  // SOCIAL FEATURES
  socialSharing: FeatureModule;
  friendChallenges: FeatureModule;
  studyGroups: FeatureModule;

  // PREMIUM FEATURES
  offlineDownloads: FeatureModule;
  customThemes: FeatureModule;
  advancedFilters: FeatureModule;
  prioritySupport: FeatureModule;

  // AUDIO FEATURES
  textToSpeech: FeatureModule;
  audioVerses: FeatureModule;
  backgroundAudio: FeatureModule;

  // ADVANCED LEARNING
  memoryGames: FeatureModule;
  crossReferences: FeatureModule;
  originalLanguage: FeatureModule;
  commentary: FeatureModule;

  // AI FEATURES
  aiRecommendations: FeatureModule;
  aiStudyBuddy: FeatureModule;
  aiMemoryAids: FeatureModule;
}

export const featureFlags: FeatureFlagsConfig = {
  // ============================================
  // CORE FEATURES (v1.0 - SHIPPED)
  // ============================================

  onboarding: {
    enabled: true,
    premium: false,
    description: '3-screen tutorial for new users',
    version: 'v1.0',
  },

  verseSearch: {
    enabled: true,
    premium: false,
    description: 'Search verses by keyword or reference with filters',
    version: 'v1.0',
  },

  spacedRepetition: {
    enabled: true,
    premium: false,
    description: 'SM-2 algorithm for optimal review scheduling',
    version: 'v1.0',
  },

  studyNotes: {
    enabled: true,
    premium: false,
    description: 'Add personal notes to any verse',
    version: 'v1.0',
  },

  streakTracking: {
    enabled: true,
    premium: false,
    description: '90-day calendar heatmap with milestones',
    version: 'v1.0',
  },

  // ============================================
  // PRACTICE MODES (v1.0 - SHIPPED)
  // ============================================

  voiceRecording: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Speech-to-text for prayer and practice',
    version: 'v1.1',
  },

  aiPrayerCoaching: {
    enabled: true,
    premium: true,
    description: 'AI-powered personalized daily prayers with usage limits',
    version: 'v1.0',
  },

  // ============================================
  // GAMIFICATION (v1.0 - SHIPPED)
  // ============================================

  leaderboard: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Global XP leaderboard - compete with other users',
    version: 'v1.1',
  },

  achievements: {
    enabled: true,
    premium: false,
    description: 'Badge system for milestones',
    version: 'v1.0',
  },

  xpSystem: {
    enabled: true,
    premium: false,
    description: 'Experience points and leveling',
    version: 'v1.0',
  },

  // ============================================
  // NOTIFICATIONS (v1.0 - SHIPPED)
  // ============================================

  dailyReminders: {
    enabled: true,
    premium: false,
    description: 'Customizable daily practice reminders',
    version: 'v1.0',
  },

  streakFreeze: {
    enabled: true,
    premium: true, // Premium only
    description: 'Protect streak once per week',
    version: 'v1.0',
  },

  // ============================================
  // MONETIZATION & SETTINGS (v1.0 - BUILDING NOW)
  // ============================================

  premiumUpgrade: {
    enabled: true,
    premium: false,
    description: 'Premium subscription upgrade screen',
    version: 'v1.0',
  },

  settingsScreen: {
    enabled: true,
    premium: false,
    description: 'Comprehensive settings and preferences',
    version: 'v1.0',
  },

  inAppPurchases: {
    enabled: false, // TODO: Configure IAP
    premium: false,
    comingSoon: true,
    description: 'Apple/Google in-app purchase integration',
    version: 'v1.0',
  },

  // ============================================
  // GROWTH & RETENTION (v1.0 - BUILDING NOW)
  // ============================================

  appReviewPrompt: {
    enabled: true,
    premium: false,
    description: 'Smart app store review requests',
    version: 'v1.0',
  },

  enhancedAnalytics: {
    enabled: true,
    premium: false,
    description: 'Detailed event tracking and funnels',
    version: 'v1.0',
  },

  deepLinking: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Open app from shared links',
    version: 'v1.0',
  },

  // ============================================
  // DATA & EXPORT (v1.0 - FUTURE)
  // ============================================

  exportData: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Export notes and progress as PDF/CSV',
    version: 'v1.0',
  },

  dataBackup: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'Automatic cloud backup of all data',
    version: 'v1.0',
  },

  // ============================================
  // POLISH & UX (v1.0 - BUILDING NOW)
  // ============================================

  betterErrorStates: {
    enabled: true,
    premium: false,
    description: 'User-friendly error messages and retry',
    version: 'v1.0',
  },

  hapticFeedback: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Vibration feedback for interactions',
    version: 'v1.0',
  },

  loadingSkeletons: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Skeleton screens while loading',
    version: 'v1.0',
  },

  emptyStates: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Beautiful empty state illustrations',
    version: 'v1.0',
  },

  pullToRefresh: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Pull-to-refresh on all list screens',
    version: 'v1.0',
  },

  whatsNewScreen: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Show new features after updates',
    version: 'v1.0',
  },

  // ============================================
  // v1.1 - ANALYTICS & INSIGHTS (PLANNED)
  // ============================================

  progressDashboard: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Visual charts showing learning progress',
    version: 'v1.1',
  },

  detailedAnalytics: {
    enabled: false, // TODO: Build this
    premium: true, // Premium feature
    comingSoon: true,
    description: 'Advanced analytics and insights',
    version: 'v1.1',
  },

  learningInsights: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'AI-powered learning recommendations',
    version: 'v1.1',
  },

  // ============================================
  // v1.2 - COLLECTIONS (PLANNED)
  // ============================================

  verseCollections: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Create and share custom verse lists',
    version: 'v1.2',
  },

  verseOfTheDay: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Daily featured verse notification',
    version: 'v1.2',
  },

  // ============================================
  // v1.3 - SOCIAL FEATURES (PLANNED)
  // ============================================

  socialSharing: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Share verses and progress on social media',
    version: 'v1.3',
  },

  friendChallenges: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Challenge friends to streak competitions',
    version: 'v1.3',
  },

  studyGroups: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Join or create study groups',
    version: 'v1.3',
  },

  // ============================================
  // v2.0 - READING PLANS (PLANNED)
  // ============================================

  readingPlans: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: '30-day, 90-day, 1-year Bible reading plans',
    version: 'v2.0',
  },

  // ============================================
  // v2.1 - AUDIO FEATURES (PLANNED)
  // ============================================

  textToSpeech: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Listen to verses with high-quality TTS',
    version: 'v2.1',
  },

  audioVerses: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'Professional audio recordings of verses',
    version: 'v2.1',
  },

  backgroundAudio: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'Listen while phone is locked',
    version: 'v2.1',
  },

  // ============================================
  // v2.2 - PREMIUM FEATURES (PLANNED)
  // ============================================

  offlineDownloads: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Download verses for offline practice',
    version: 'v1.1',
  },

  customThemes: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'Dark mode, sepia, and custom colors',
    version: 'v2.2',
  },

  advancedFilters: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'Filter by multiple criteria simultaneously',
    version: 'v2.2',
  },

  prioritySupport: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: '24-hour response time for support requests',
    version: 'v2.2',
  },

  // ============================================
  // v2.4 - ADVANCED LEARNING (PLANNED)
  // ============================================

  memoryGames: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'Interactive games for memorization',
    version: 'v2.4',
  },

  crossReferences: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'See related verses and connections',
    version: 'v2.4',
  },

  originalLanguage: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'Greek/Hebrew original text insights',
    version: 'v2.4',
  },

  commentary: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'Access theological commentary',
    version: 'v2.4',
  },

  // ============================================
  // v3.0 - AI FEATURES (PLANNED)
  // ============================================

  aiRecommendations: {
    enabled: false, // TODO: Build this
    premium: false,
    comingSoon: true,
    description: 'AI suggests verses based on mood/situation',
    version: 'v3.0',
  },

  aiStudyBuddy: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'Chat with AI about verses',
    version: 'v3.0',
  },

  aiMemoryAids: {
    enabled: false, // TODO: Build this
    premium: true,
    comingSoon: true,
    description: 'AI-generated mnemonics and memory techniques',
    version: 'v3.0',
  },
};

/**
 * Helper function to check if a feature is available for current user
 *
 * @param feature - Feature key from featureFlags
 * @param isPremium - Whether user has premium subscription
 * @returns true if feature is enabled and available to user
 */
export function isFeatureAvailable(
  feature: keyof FeatureFlagsConfig,
  isPremium: boolean = false
): boolean {
  const flag = featureFlags[feature];

  // Feature must be enabled
  if (!flag.enabled) return false;

  // If feature requires premium, check user's premium status
  if (flag.premium && !isPremium) return false;

  return true;
}

/**
 * Get all features available for current user tier
 *
 * @param isPremium - Whether user has premium subscription
 * @returns Array of available feature keys
 */
export function getAvailableFeatures(isPremium: boolean = false): string[] {
  return Object.entries(featureFlags)
    .filter(([_, config]) => {
      if (!config.enabled) return false;
      if (config.premium && !isPremium) return false;
      return true;
    })
    .map(([key, _]) => key);
}

/**
 * Get features by version
 *
 * @param version - Version string (e.g., 'v1.0', 'v1.1')
 * @returns Features added in that version
 */
export function getFeaturesByVersion(version: string): string[] {
  return Object.entries(featureFlags)
    .filter(([_, config]) => config.version === version)
    .map(([key, _]) => key);
}

/**
 * Get upcoming features (coming soon)
 *
 * @returns Features marked as coming soon
 */
export function getUpcomingFeatures(): string[] {
  return Object.entries(featureFlags)
    .filter(([_, config]) => config.comingSoon === true)
    .map(([key, _]) => key);
}

/**
 * Get premium features
 *
 * @returns All features that require premium
 */
export function getPremiumFeatures(): string[] {
  return Object.entries(featureFlags)
    .filter(([_, config]) => config.premium === true)
    .map(([key, _]) => key);
}

export default featureFlags;
