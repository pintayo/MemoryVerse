/**
 * Feature Flags Configuration
 *
 * Central place to enable/disable features and manage premium vs free tiers
 * with environment-based overrides for development, staging, and production.
 *
 * Usage:
 * import { featureFlags } from '@/config/featureFlags';
 * if (featureFlags.isAvailable('socialSharing', isPremium)) { ... }
 */

import Constants from 'expo-constants';
import { logger } from '../utils/logger';

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

  // NEW PREMIUM FEATURES (V1.2 - IN DEVELOPMENT)
  advancedAnalyticsDashboard: FeatureModule; // Detailed charts, trends, predictions
  customVerseCollections: FeatureModule; // Create, organize, share custom collections
  exportProgressReports: FeatureModule; // Export as PDF/CSV with beautiful formatting
  enhancedPrayerCoaching: FeatureModule; // Conversation history, insights, trends
  multipleTranslations: FeatureModule; // NIV, KJV, NLT, NASB support
  verseComparisonTool: FeatureModule; // Side-by-side translation comparison
  learningPathRecommendations: FeatureModule; // AI-powered personalized study paths

  // DEVELOPER FEATURES
  debugMode: FeatureModule;
  mockData: FeatureModule;
  performanceMetrics: FeatureModule;
  featureFlagUI: FeatureModule;
}

// Environment detection
const isDevelopment = __DEV__;
const environment = Constants.expoConfig?.extra?.environment || 'development';
const isProduction = environment === 'production';
const isStaging = environment === 'staging';

logger.log('[FeatureFlags] Environment:', environment, 'isDev:', isDevelopment);

// Base feature configuration
const baseFeatureFlags: FeatureFlagsConfig = {
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
  // PRACTICE MODES (v1.0)
  // ============================================

  voiceRecording: {
    enabled: isDevelopment || isStaging, // Only in dev/staging
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
  // GAMIFICATION (v1.0)
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
  // NOTIFICATIONS (v1.0)
  // ============================================

  dailyReminders: {
    enabled: true,
    premium: false,
    description: 'Customizable daily practice reminders',
    version: 'v1.0',
  },

  streakFreeze: {
    enabled: true,
    premium: true,
    description: 'Protect streak once per week',
    version: 'v1.0',
  },

  // ============================================
  // MONETIZATION & SETTINGS (v1.0)
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
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Apple/Google in-app purchase integration',
    version: 'v1.0',
  },

  // ============================================
  // GROWTH & RETENTION (v1.0)
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
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Open app from shared links',
    version: 'v1.0',
  },

  // ============================================
  // DATA & EXPORT (v1.0 - FUTURE)
  // ============================================

  exportData: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Export notes and progress as PDF/CSV',
    version: 'v1.0',
  },

  dataBackup: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Automatic cloud backup of all data',
    version: 'v1.0',
  },

  // ============================================
  // POLISH & UX (v1.0)
  // ============================================

  betterErrorStates: {
    enabled: true,
    premium: false,
    description: 'User-friendly error messages and retry',
    version: 'v1.0',
  },

  hapticFeedback: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Vibration feedback for interactions',
    version: 'v1.0',
  },

  loadingSkeletons: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Skeleton screens while loading',
    version: 'v1.0',
  },

  emptyStates: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Beautiful empty state illustrations',
    version: 'v1.0',
  },

  pullToRefresh: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Pull-to-refresh on all list screens',
    version: 'v1.0',
  },

  whatsNewScreen: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Show new features after updates',
    version: 'v1.0',
  },

  // ============================================
  // ANALYTICS & INSIGHTS (v1.1 - PLANNED)
  // ============================================

  progressDashboard: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Visual charts showing learning progress',
    version: 'v1.1',
  },

  detailedAnalytics: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Advanced analytics and insights',
    version: 'v1.1',
  },

  learningInsights: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'AI-powered learning recommendations',
    version: 'v1.1',
  },

  // ============================================
  // COLLECTIONS (v1.2 - PLANNED)
  // ============================================

  verseCollections: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Create and share custom verse lists',
    version: 'v1.2',
  },

  verseOfTheDay: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Daily featured verse notification',
    version: 'v1.2',
  },

  // ============================================
  // SOCIAL FEATURES (v1.3 - PLANNED)
  // ============================================

  socialSharing: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Share verses and progress on social media',
    version: 'v1.3',
  },

  friendChallenges: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Challenge friends to streak competitions',
    version: 'v1.3',
  },

  studyGroups: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Join or create study groups',
    version: 'v1.3',
  },

  // ============================================
  // READING PLANS (v2.0 - PLANNED)
  // ============================================

  readingPlans: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: '30-day, 90-day, 1-year Bible reading plans',
    version: 'v2.0',
  },

  // ============================================
  // AUDIO FEATURES (v2.1 - PLANNED)
  // ============================================

  textToSpeech: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Listen to verses with high-quality TTS',
    version: 'v2.1',
  },

  audioVerses: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Professional audio recordings of verses',
    version: 'v2.1',
  },

  backgroundAudio: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Listen while phone is locked',
    version: 'v2.1',
  },

  // ============================================
  // PREMIUM FEATURES (v2.2 - PLANNED)
  // ============================================

  offlineDownloads: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Download verses for offline practice',
    version: 'v1.1',
  },

  customThemes: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Dark mode, sepia, and custom colors',
    version: 'v2.2',
  },

  advancedFilters: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Filter by multiple criteria simultaneously',
    version: 'v2.2',
  },

  prioritySupport: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: '24-hour response time for support requests',
    version: 'v2.2',
  },

  // ============================================
  // ADVANCED LEARNING (v2.4 - PLANNED)
  // ============================================

  memoryGames: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'Interactive games for memorization',
    version: 'v2.4',
  },

  crossReferences: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'See related verses and connections',
    version: 'v2.4',
  },

  originalLanguage: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Greek/Hebrew original text insights',
    version: 'v2.4',
  },

  commentary: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Access theological commentary',
    version: 'v2.4',
  },

  // ============================================
  // AI FEATURES (v3.0 - PLANNED)
  // ============================================

  aiRecommendations: {
    enabled: false,
    premium: false,
    comingSoon: true,
    description: 'AI suggests verses based on mood/situation',
    version: 'v3.0',
  },

  aiStudyBuddy: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'Chat with AI about verses',
    version: 'v3.0',
  },

  aiMemoryAids: {
    enabled: false,
    premium: true,
    comingSoon: true,
    description: 'AI-generated mnemonics and memory techniques',
    version: 'v3.0',
  },

  // ============================================
  // NEW PREMIUM FEATURES (v1.2 - IN DEVELOPMENT)
  // ============================================

  advancedAnalyticsDashboard: {
    enabled: false, // Hidden until ready for release
    premium: true,
    comingSoon: true,
    description: 'Comprehensive analytics with charts, trends, and predictive insights',
    version: 'v1.2',
  },

  customVerseCollections: {
    enabled: false, // Hidden until ready for release
    premium: true,
    comingSoon: true,
    description: 'Create, organize, and share custom verse collections with others',
    version: 'v1.2',
  },

  exportProgressReports: {
    enabled: false, // Hidden until ready for release
    premium: true,
    comingSoon: true,
    description: 'Export beautifully formatted progress reports as PDF or CSV',
    version: 'v1.2',
  },

  enhancedPrayerCoaching: {
    enabled: false, // Hidden until ready for release
    premium: true,
    comingSoon: true,
    description: 'Advanced AI prayer coaching with conversation history and insights',
    version: 'v1.2',
  },

  multipleTranslations: {
    enabled: false, // Hidden until ready for release
    premium: true,
    comingSoon: true,
    description: 'Access NIV, KJV, NLT, NASB, and more Bible translations',
    version: 'v1.2',
  },

  verseComparisonTool: {
    enabled: false, // Hidden until ready for release
    premium: true,
    comingSoon: true,
    description: 'Compare verses side-by-side across multiple translations',
    version: 'v1.2',
  },

  learningPathRecommendations: {
    enabled: false, // Hidden until ready for release
    premium: true,
    comingSoon: true,
    description: 'AI-powered personalized learning paths based on your progress',
    version: 'v1.2',
  },

  // ============================================
  // DEVELOPER FEATURES
  // ============================================

  debugMode: {
    enabled: isDevelopment,
    premium: false,
    description: 'Show debug information and logs',
    version: 'v1.0',
  },

  mockData: {
    enabled: isDevelopment,
    premium: false,
    description: 'Use mock data instead of API calls',
    version: 'v1.0',
  },

  performanceMetrics: {
    enabled: isDevelopment,
    premium: false,
    description: 'Show performance metrics overlay',
    version: 'v1.0',
  },

  featureFlagUI: {
    enabled: isDevelopment,
    premium: false,
    description: 'Toggle feature flags in-app',
    version: 'v1.0',
  },
};

/**
 * Feature Flag Service
 * Manages runtime feature flag state and overrides
 */
class FeatureFlagService {
  private flags: FeatureFlagsConfig;
  private overrides: Partial<Record<keyof FeatureFlagsConfig, Partial<FeatureModule>>> = {};
  private betaUserOverrides: Partial<Record<keyof FeatureFlagsConfig, Partial<FeatureModule>>> = {};

  constructor() {
    this.flags = baseFeatureFlags;
    logger.log('[FeatureFlags] Initialized');
  }

  /**
   * Check if a feature is available for the current user
   */
  isAvailable(feature: keyof FeatureFlagsConfig, isPremium: boolean = false): boolean {
    const flag = this.getFlag(feature);

    // Feature must be enabled
    if (!flag.enabled) return false;

    // If feature requires premium, check user's premium status
    if (flag.premium && !isPremium) return false;

    return true;
  }

  /**
   * Get feature configuration with overrides applied
   */
  getFlag(feature: keyof FeatureFlagsConfig): FeatureModule {
    const base = this.flags[feature];
    const override = this.overrides[feature];
    const betaOverride = this.betaUserOverrides[feature];

    // Merge: base < override < betaOverride
    return {
      ...base,
      ...override,
      ...betaOverride,
    };
  }

  /**
   * Enable beta features for a user
   */
  setBetaUserFlags(flags: Partial<Record<keyof FeatureFlagsConfig, Partial<FeatureModule>>>) {
    this.betaUserOverrides = { ...this.betaUserOverrides, ...flags };
    logger.log('[FeatureFlags] Beta user flags set:', Object.keys(flags));
  }

  /**
   * Clear beta user flags (e.g., on logout)
   */
  clearBetaUserFlags() {
    this.betaUserOverrides = {};
    logger.log('[FeatureFlags] Beta user flags cleared');
  }

  /**
   * Override a specific flag (for testing/debugging)
   * Only works in development mode
   */
  override(feature: keyof FeatureFlagsConfig, overrides: Partial<FeatureModule>) {
    if (isDevelopment) {
      this.overrides[feature] = { ...this.overrides[feature], ...overrides };
      logger.log(`[FeatureFlags] Override set: ${feature}`, overrides);
    } else {
      logger.warn('[FeatureFlags] Overrides only work in development mode');
    }
  }

  /**
   * Clear all manual overrides
   */
  clearOverrides() {
    this.overrides = {};
    logger.log('[FeatureFlags] All overrides cleared');
  }

  /**
   * Get all flags with overrides applied
   */
  getAllFlags(): FeatureFlagsConfig {
    const result: any = {};
    (Object.keys(this.flags) as Array<keyof FeatureFlagsConfig>).forEach((key) => {
      result[key] = this.getFlag(key);
    });
    return result;
  }

  /**
   * Get environment info
   */
  getEnvironment(): string {
    return environment;
  }

  isDevelopment(): boolean {
    return isDevelopment;
  }

  isProduction(): boolean {
    return isProduction;
  }
}

// Export singleton instance
export const featureFlagsService = new FeatureFlagService();

// Legacy exports for backwards compatibility
export const featureFlags = baseFeatureFlags;

/**
 * Helper function to check if a feature is available for current user
 */
export function isFeatureAvailable(
  feature: keyof FeatureFlagsConfig,
  isPremium: boolean = false
): boolean {
  return featureFlagsService.isAvailable(feature, isPremium);
}

/**
 * Get all features available for current user tier
 */
export function getAvailableFeatures(isPremium: boolean = false): string[] {
  return (Object.keys(baseFeatureFlags) as Array<keyof FeatureFlagsConfig>)
    .filter((feature) => featureFlagsService.isAvailable(feature, isPremium))
    .map((key) => key as string);
}

/**
 * Get features by version
 */
export function getFeaturesByVersion(version: string): string[] {
  return Object.entries(baseFeatureFlags)
    .filter(([_, config]) => config.version === version)
    .map(([key, _]) => key);
}

/**
 * Get upcoming features (coming soon)
 */
export function getUpcomingFeatures(): string[] {
  return Object.entries(baseFeatureFlags)
    .filter(([_, config]) => config.comingSoon === true)
    .map(([key, _]) => key);
}

/**
 * Get premium features
 */
export function getPremiumFeatures(): string[] {
  return Object.entries(baseFeatureFlags)
    .filter(([_, config]) => config.premium === true)
    .map(([key, _]) => key);
}

// Make available in dev console
if (isDevelopment && typeof global !== 'undefined') {
  (global as any).featureFlags = featureFlagsService;
  logger.log('[FeatureFlags] Available in console via: featureFlags');
}

export default featureFlags;
