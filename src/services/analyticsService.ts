/**
 * Analytics Service
 * Tracks user behavior and app events using Firebase Analytics
 */

import analytics from '@react-native-firebase/analytics';
import { logger } from '../utils/logger';

// Track if analytics is enabled
let analyticsEnabled = true;

// Helper to safely call analytics
const safeAnalytics = async (fn: () => Promise<void>, eventName: string) => {
  if (!analyticsEnabled) {
    logger.log(`[Analytics] Skipped (disabled): ${eventName}`);
    return;
  }

  try {
    await fn();
    logger.log(`[Analytics] Tracked: ${eventName}`);
  } catch (error) {
    logger.warn(`[Analytics] Failed to track ${eventName}:`, error);
  }
};

export const analyticsService = {
  /**
   * Initialize analytics
   */
  async initialize() {
    try {
      analyticsEnabled = true;
      logger.log('[Analytics] Firebase Analytics initialized');
    } catch (error) {
      logger.error('[Analytics] Failed to initialize:', error);
      analyticsEnabled = false;
    }
  },

  /**
   * Set user ID for analytics
   */
  async setUserId(userId: string) {
    await safeAnalytics(
      async () => {
        await analytics().setUserId(userId);
      },
      `setUserId: ${userId}`
    );
  },

  /**
   * Set user properties
   */
  async setUserProperty(name: string, value: string) {
    await safeAnalytics(
      async () => {
        await analytics().setUserProperty(name, value);
      },
      `setUserProperty: ${name}=${value}`
    );
  },

  /**
   * Track screen view
   */
  async logScreenView(screenName: string, screenClass?: string) {
    await safeAnalytics(
      async () => {
        await analytics().logScreenView({
          screen_name: screenName,
          screen_class: screenClass || screenName,
        });
      },
      `screen_view: ${screenName}`
    );
  },

  // ============================================================================
  // USER EVENTS
  // ============================================================================

  /**
   * Track user registration
   */
  async logSignUp(method: string = 'email') {
    await safeAnalytics(
      async () => {
        await analytics().logSignUp({ method });
      },
      'sign_up'
    );
  },

  /**
   * Track user login
   */
  async logLogin(method: string = 'email') {
    await safeAnalytics(
      async () => {
        await analytics().logLogin({ method });
      },
      'login'
    );
  },

  // ============================================================================
  // VERSE LEARNING EVENTS
  // ============================================================================

  /**
   * Track verse viewed
   */
  async logVerseViewed(verseId: string, book: string, chapter: number, verse: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('verse_viewed', {
          verse_id: verseId,
          book,
          chapter,
          verse,
        });
      },
      'verse_viewed'
    );
  },

  /**
   * Track verse learned
   */
  async logVerseLearned(verseId: string, book: string, difficulty: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('verse_learned', {
          verse_id: verseId,
          book,
          difficulty,
        });
      },
      'verse_learned'
    );
  },

  /**
   * Track verse mastered
   */
  async logVerseMastered(verseId: string, book: string, attempts: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('verse_mastered', {
          verse_id: verseId,
          book,
          attempts,
        });
      },
      'verse_mastered'
    );
  },

  // ============================================================================
  // PRACTICE EVENTS
  // ============================================================================

  /**
   * Track practice session started
   */
  async logPracticeStarted(sessionType: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('practice_started', {
          session_type: sessionType,
        });
      },
      'practice_started'
    );
  },

  /**
   * Track practice session completed
   */
  async logPracticeCompleted(sessionType: string, accuracy: number, xpEarned: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('practice_completed', {
          session_type: sessionType,
          accuracy,
          xp_earned: xpEarned,
        });
      },
      'practice_completed'
    );
  },

  // ============================================================================
  // GAMIFICATION EVENTS
  // ============================================================================

  /**
   * Track level up
   */
  async logLevelUp(newLevel: number, totalXP: number) {
    await safeAnalytics(
      async () => {
        await analytics().logLevelUp({
          level: newLevel,
          character: 'user',
        });
        await analytics().logEvent('level_up_details', {
          new_level: newLevel,
          total_xp: totalXP,
        });
      },
      'level_up'
    );
  },

  /**
   * Track achievement unlocked
   */
  async logAchievementUnlocked(achievementId: string, achievementName: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('unlock_achievement', {
          achievement_id: achievementId,
        });
        await analytics().logEvent('achievement_unlocked', {
          achievement_id: achievementId,
          achievement_name: achievementName,
        });
      },
      'achievement_unlocked'
    );
  },

  /**
   * Track streak milestone
   */
  async logStreakMilestone(streakDays: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('streak_milestone', {
          streak_days: streakDays,
        });
      },
      'streak_milestone'
    );
  },

  // ============================================================================
  // PREMIUM EVENTS
  // ============================================================================

  /**
   * Track premium viewed
   */
  async logPremiumViewed(source: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('premium_viewed', {
          source,
        });
      },
      'premium_viewed'
    );
  },

  /**
   * Track purchase initiated
   */
  async logPurchaseInitiated(productId: string, price: number, currency: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('begin_checkout', {
          items: [{ item_id: productId }],
          value: price,
          currency,
        });
      },
      'purchase_initiated'
    );
  },

  /**
   * Track purchase completed
   */
  async logPurchaseCompleted(
    productId: string,
    price: number,
    currency: string,
    transactionId: string
  ) {
    await safeAnalytics(
      async () => {
        await analytics().logPurchase({
          value: price,
          currency,
          items: [{ item_id: productId }],
          transaction_id: transactionId,
        });
      },
      'purchase'
    );
  },

  // ============================================================================
  // PROFILE EVENTS
  // ============================================================================

  /**
   * Track profile updated
   */
  async logProfileUpdated(field: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('profile_updated', {
          field,
        });
      },
      'profile_updated'
    );
  },

  // ============================================================================
  // FEATURE USAGE EVENTS
  // ============================================================================

  /**
   * Track AI context generated
   */
  async logAIContextGenerated(verseId: string, provider: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('ai_context_generated', {
          verse_id: verseId,
          provider,
        });
      },
      'ai_context_generated'
    );
  },

  /**
   * Track Bible verse picker used
   */
  async logBiblePickerUsed(action: 'book' | 'chapter' | 'verse' | 'random') {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('bible_picker_used', {
          action,
        });
      },
      'bible_picker_used'
    );
  },

  /**
   * Track prayer session
   */
  async logPrayerSession(durationSeconds: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('prayer_session', {
          duration_seconds: durationSeconds,
        });
      },
      'prayer_session'
    );
  },

  // ============================================================================
  // CUSTOM EVENTS
  // ============================================================================

  /**
   * Track custom event
   */
  async logEvent(eventName: string, params?: { [key: string]: any }) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent(eventName, params);
      },
      eventName
    );
  },
};

logger.log('[analyticsService] Module loaded');
