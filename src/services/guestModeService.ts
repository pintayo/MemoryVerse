/**
 * Guest Mode Service
 *
 * Manages anonymous/guest user experience:
 * - Allow users to explore app without signing in
 * - Track which prompts have been dismissed
 * - Provide temporary local storage for guest sessions
 * - Track what features require sign-up
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// =============================================
// CONSTANTS
// =============================================

const STORAGE_KEYS = {
  GUEST_MODE: '@memoryverse_guest_mode',
  DISMISSED_PROMPTS: '@memoryverse_dismissed_prompts',
  GUEST_FAVORITES: '@memoryverse_guest_favorites',
  GUEST_PRACTICE_COUNT: '@memoryverse_guest_practice_count',
};

export type PromptTrigger =
  | 'practice'
  | 'favorites'
  | 'progress'
  | 'streaks'
  | 'achievements'
  | 'notes'
  | 'collections'
  | 'analytics'
  | 'export'
  | 'prayer_history';

// Features that can be used without login
export const GUEST_ALLOWED_FEATURES = [
  'read_daily_verse',
  'read_bible',
  'practice_once', // Allow one practice without prompt
  'pray_once',     // Allow one prayer without prompt
  'view_verse_context',
  'search_verses',
];

// Features that require sign-up
export const SIGN_UP_REQUIRED_FEATURES: PromptTrigger[] = [
  'favorites',
  'progress',
  'streaks',
  'achievements',
  'notes',
  'collections',
  'analytics',
  'export',
  'prayer_history',
];

// =============================================
// PROMPT DISMISSAL TRACKING
// =============================================

/**
 * Check if user has dismissed a specific prompt
 */
export async function hasUserDismissedPrompt(trigger: PromptTrigger): Promise<boolean> {
  try {
    const dismissedPromptsStr = await AsyncStorage.getItem(STORAGE_KEYS.DISMISSED_PROMPTS);
    if (!dismissedPromptsStr) return false;

    const dismissedPrompts: PromptTrigger[] = JSON.parse(dismissedPromptsStr);
    return dismissedPrompts.includes(trigger);
  } catch (error) {
    logger.error('[GuestMode] Error checking dismissed prompts:', error);
    return false;
  }
}

/**
 * Mark a prompt as dismissed (don't show again)
 */
export async function dismissPrompt(trigger: PromptTrigger): Promise<boolean> {
  try {
    const dismissedPromptsStr = await AsyncStorage.getItem(STORAGE_KEYS.DISMISSED_PROMPTS);
    let dismissedPrompts: PromptTrigger[] = dismissedPromptsStr
      ? JSON.parse(dismissedPromptsStr)
      : [];

    if (!dismissedPrompts.includes(trigger)) {
      dismissedPrompts.push(trigger);
      await AsyncStorage.setItem(
        STORAGE_KEYS.DISMISSED_PROMPTS,
        JSON.stringify(dismissedPrompts)
      );
    }

    logger.log('[GuestMode] Prompt dismissed:', trigger);
    return true;
  } catch (error) {
    logger.error('[GuestMode] Error dismissing prompt:', error);
    return false;
  }
}

/**
 * Clear all dismissed prompts (for testing or reset)
 */
export async function clearDismissedPrompts(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DISMISSED_PROMPTS);
    logger.log('[GuestMode] All dismissed prompts cleared');
    return true;
  } catch (error) {
    logger.error('[GuestMode] Error clearing dismissed prompts:', error);
    return false;
  }
}

// =============================================
// GUEST SESSION TRACKING
// =============================================

/**
 * Track guest practice count (to allow first practice without prompt)
 */
export async function getGuestPracticeCount(): Promise<number> {
  try {
    const countStr = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_PRACTICE_COUNT);
    return countStr ? parseInt(countStr, 10) : 0;
  } catch (error) {
    logger.error('[GuestMode] Error getting practice count:', error);
    return 0;
  }
}

/**
 * Increment guest practice count
 */
export async function incrementGuestPracticeCount(): Promise<number> {
  try {
    const currentCount = await getGuestPracticeCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.GUEST_PRACTICE_COUNT, newCount.toString());
    logger.log('[GuestMode] Practice count incremented to:', newCount);
    return newCount;
  } catch (error) {
    logger.error('[GuestMode] Error incrementing practice count:', error);
    return 0;
  }
}

/**
 * Check if guest should see practice prompt
 * Allow first practice without prompt, show prompt for subsequent practices
 */
export async function shouldShowPracticePrompt(): Promise<boolean> {
  try {
    const practiceCount = await getGuestPracticeCount();
    const hasDismissed = await hasUserDismissedPrompt('practice');

    // Show prompt if they've practiced before and haven't dismissed it
    return practiceCount > 0 && !hasDismissed;
  } catch (error) {
    logger.error('[GuestMode] Error checking practice prompt:', error);
    return false;
  }
}

// =============================================
// GUEST FAVORITES (LOCAL STORAGE)
// =============================================

/**
 * Get guest favorites from local storage
 */
export async function getGuestFavorites(): Promise<string[]> {
  try {
    const favoritesStr = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_FAVORITES);
    return favoritesStr ? JSON.parse(favoritesStr) : [];
  } catch (error) {
    logger.error('[GuestMode] Error getting guest favorites:', error);
    return [];
  }
}

/**
 * Add a verse to guest favorites (prompts for sign-up)
 */
export async function addGuestFavorite(verseId: string): Promise<boolean> {
  try {
    const favorites = await getGuestFavorites();
    if (!favorites.includes(verseId)) {
      favorites.push(verseId);
      await AsyncStorage.setItem(STORAGE_KEYS.GUEST_FAVORITES, JSON.stringify(favorites));
      logger.log('[GuestMode] Favorite added to guest storage:', verseId);
    }
    return true;
  } catch (error) {
    logger.error('[GuestMode] Error adding guest favorite:', error);
    return false;
  }
}

/**
 * Remove a verse from guest favorites
 */
export async function removeGuestFavorite(verseId: string): Promise<boolean> {
  try {
    const favorites = await getGuestFavorites();
    const filtered = favorites.filter(id => id !== verseId);
    await AsyncStorage.setItem(STORAGE_KEYS.GUEST_FAVORITES, JSON.stringify(filtered));
    logger.log('[GuestMode] Favorite removed from guest storage:', verseId);
    return true;
  } catch (error) {
    logger.error('[GuestMode] Error removing guest favorite:', error);
    return false;
  }
}

/**
 * Clear all guest data (on sign-up or sign-in)
 */
export async function clearGuestData(): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.GUEST_FAVORITES,
      STORAGE_KEYS.GUEST_PRACTICE_COUNT,
      // Note: Keep dismissed prompts even after login
    ]);
    logger.log('[GuestMode] Guest data cleared');
    return true;
  } catch (error) {
    logger.error('[GuestMode] Error clearing guest data:', error);
    return false;
  }
}

// =============================================
// FEATURE ACCESS CHECKS
// =============================================

/**
 * Check if a feature requires authentication
 */
export function requiresAuthentication(feature: string): boolean {
  return !GUEST_ALLOWED_FEATURES.includes(feature);
}

/**
 * Get benefits message for sign-up prompt based on trigger
 */
export function getSignUpBenefits(trigger: PromptTrigger): string[] {
  const commonBenefits = [
    '📊 Track your progress and streaks',
    '🎯 Earn XP and level up',
    '⭐ Save favorite verses',
    '📝 Add personal study notes',
    '☁️ Sync across all devices',
  ];

  const triggerSpecificBenefits: { [key in PromptTrigger]?: string[] } = {
    practice: [
      '📈 Track your accuracy over time',
      '🎓 Personalized learning recommendations',
      '🔄 Spaced repetition scheduling',
      ...commonBenefits,
    ],
    favorites: [
      '⭐ Save unlimited favorite verses',
      '📚 Organize verses into collections',
      '🔄 Access favorites on any device',
      ...commonBenefits,
    ],
    progress: [
      '📊 Detailed progress analytics',
      '🎯 Set and track learning goals',
      '🏆 Unlock achievements and badges',
      ...commonBenefits,
    ],
    streaks: [
      '🔥 Build and maintain daily streaks',
      '❄️ Use streak freeze (Premium)',
      '🏅 Compete on leaderboards',
      ...commonBenefits,
    ],
    notes: [
      '📝 Add personal study notes',
      '💡 AI-generated verse insights',
      '🔍 Search your notes',
      ...commonBenefits,
    ],
    collections: [
      '📚 Create custom verse collections',
      '🤝 Share collections with friends',
      '🌟 Access featured collections',
      ...commonBenefits,
    ],
    prayer_history: [
      '🙏 Save prayer conversation history',
      '📊 Track prayer themes and insights',
      '💬 Continue previous prayer sessions',
      ...commonBenefits,
    ],
  };

  return triggerSpecificBenefits[trigger] || commonBenefits;
}

/**
 * Get title for sign-up prompt based on trigger
 */
export function getSignUpPromptTitle(trigger: PromptTrigger): string {
  const titles: { [key in PromptTrigger]: string } = {
    practice: 'Save Your Progress?',
    favorites: 'Save Favorite Verses?',
    progress: 'Track Your Progress?',
    streaks: 'Build Your Streak?',
    achievements: 'Unlock Achievements?',
    notes: 'Save Study Notes?',
    collections: 'Create Collections?',
    analytics: 'View Advanced Analytics?',
    export: 'Export Your Data?',
    prayer_history: 'Save Prayer History?',
  };

  return titles[trigger] || 'Sign Up for More Features';
}

/**
 * Get message for sign-up prompt based on trigger
 */
export function getSignUpPromptMessage(trigger: PromptTrigger): string {
  const messages: { [key in PromptTrigger]: string } = {
    practice: 'Your practice progress won\'t be saved without an account. Sign up to track your learning journey!',
    favorites: 'Sign up to save your favorite verses and access them across all your devices.',
    progress: 'Create an account to track your progress, earn XP, and level up!',
    streaks: 'Sign up to build daily streaks, earn achievements, and compete with others!',
    achievements: 'Create an account to unlock achievements and track your milestones.',
    notes: 'Sign up to save personal study notes and sync them across devices.',
    collections: 'Create an account to build custom verse collections and share them with others.',
    analytics: 'Sign up to access detailed analytics and insights about your learning.',
    export: 'Create an account to export your progress, notes, and analytics.',
    prayer_history: 'Sign up to save your prayer conversations and track insights over time.',
  };

  return messages[trigger] || 'Sign up to unlock all features and save your progress!';
}

// =============================================
// EXPORTS
// =============================================

export default {
  hasUserDismissedPrompt,
  dismissPrompt,
  clearDismissedPrompts,
  getGuestPracticeCount,
  incrementGuestPracticeCount,
  shouldShowPracticePrompt,
  getGuestFavorites,
  addGuestFavorite,
  removeGuestFavorite,
  clearGuestData,
  requiresAuthentication,
  getSignUpBenefits,
  getSignUpPromptTitle,
  getSignUpPromptMessage,
};
