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
  // SETTINGS & PREFERENCES EVENTS
  // ============================================================================

  /**
   * Track settings screen viewed
   */
  async logSettingsViewed() {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('settings_viewed', {});
      },
      'settings_viewed'
    );
  },

  /**
   * Track settings changed
   */
  async logSettingChanged(settingName: string, value: string | boolean) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('setting_changed', {
          setting_name: settingName,
          value: String(value),
        });
      },
      'setting_changed'
    );
  },

  /**
   * Track notification permission granted/denied
   */
  async logNotificationPermission(granted: boolean) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('notification_permission', {
          granted,
        });
      },
      'notification_permission'
    );
  },

  // ============================================================================
  // PREMIUM FUNNEL EVENTS
  // ============================================================================

  /**
   * Track premium screen viewed with source
   */
  async logPremiumScreenViewed(source: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('premium_screen_viewed', {
          source, // e.g., 'profile', 'settings', 'feature_lock', 'onboarding'
        });
      },
      'premium_screen_viewed'
    );
  },

  /**
   * Track premium plan selected
   */
  async logPremiumPlanSelected(plan: 'monthly' | 'annual') {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('premium_plan_selected', {
          plan,
        });
      },
      'premium_plan_selected'
    );
  },

  /**
   * Track premium feature locked interaction
   */
  async logPremiumFeatureLocked(featureName: string, action: 'viewed' | 'clicked') {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('premium_feature_locked', {
          feature_name: featureName,
          action,
        });
      },
      'premium_feature_locked'
    );
  },

  // ============================================================================
  // APP REVIEW EVENTS
  // ============================================================================

  /**
   * Track app review prompt shown
   */
  async logAppReviewPromptShown() {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('app_review_prompt_shown', {});
      },
      'app_review_prompt_shown'
    );
  },

  /**
   * Track app review submitted
   */
  async logAppReviewSubmitted() {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('app_review_submitted', {});
      },
      'app_review_submitted'
    );
  },

  // ============================================================================
  // SEARCH & DISCOVERY EVENTS
  // ============================================================================

  /**
   * Track verse search performed
   */
  async logVerseSearch(query: string, resultsCount: number, filters?: object) {
    await safeAnalytics(
      async () => {
        await analytics().logSearch({
          search_term: query,
        });
        await analytics().logEvent('verse_search', {
          query: query.substring(0, 100), // Limit length
          results_count: resultsCount,
          has_filters: !!filters,
        });
      },
      'verse_search'
    );
  },

  /**
   * Track search filter applied
   */
  async logSearchFilterApplied(filterType: string, filterValue: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('search_filter_applied', {
          filter_type: filterType,
          filter_value: filterValue,
        });
      },
      'search_filter_applied'
    );
  },

  // ============================================================================
  // NOTES & STUDY EVENTS
  // ============================================================================

  /**
   * Track note created
   */
  async logNoteCreated(verseId: string, noteLength: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('note_created', {
          verse_id: verseId,
          note_length: noteLength,
        });
      },
      'note_created'
    );
  },

  /**
   * Track note updated
   */
  async logNoteUpdated(noteId: string, newLength: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('note_updated', {
          note_id: noteId,
          note_length: newLength,
        });
      },
      'note_updated'
    );
  },

  /**
   * Track note deleted
   */
  async logNoteDeleted(noteId: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('note_deleted', {
          note_id: noteId,
        });
      },
      'note_deleted'
    );
  },

  // ============================================================================
  // STREAK & ENGAGEMENT EVENTS
  // ============================================================================

  /**
   * Track streak freeze used
   */
  async logStreakFreezeUsed(streakDays: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('streak_freeze_used', {
          streak_days: streakDays,
        });
      },
      'streak_freeze_used'
    );
  },

  /**
   * Track streak lost
   */
  async logStreakLost(previousStreakDays: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('streak_lost', {
          previous_streak_days: previousStreakDays,
        });
      },
      'streak_lost'
    );
  },

  /**
   * Track daily reminder scheduled
   */
  async logDailyReminderScheduled(time: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('daily_reminder_scheduled', {
          time,
        });
      },
      'daily_reminder_scheduled'
    );
  },

  // ============================================================================
  // ONBOARDING EVENTS
  // ============================================================================

  /**
   * Track onboarding started
   */
  async logOnboardingStarted() {
    await safeAnalytics(
      async () => {
        await analytics().logTutorialBegin();
        await analytics().logEvent('onboarding_started', {});
      },
      'onboarding_started'
    );
  },

  /**
   * Track onboarding step viewed
   */
  async logOnboardingStep(stepNumber: number, stepName: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('onboarding_step', {
          step_number: stepNumber,
          step_name: stepName,
        });
      },
      'onboarding_step'
    );
  },

  /**
   * Track onboarding completed
   */
  async logOnboardingCompleted(timeSpentSeconds: number) {
    await safeAnalytics(
      async () => {
        await analytics().logTutorialComplete();
        await analytics().logEvent('onboarding_completed', {
          time_spent_seconds: timeSpentSeconds,
        });
      },
      'onboarding_completed'
    );
  },

  /**
   * Track onboarding skipped
   */
  async logOnboardingSkipped(stepNumber: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('onboarding_skipped', {
          step_number: stepNumber,
        });
      },
      'onboarding_skipped'
    );
  },

  // ============================================================================
  // FEATURE FLAGS EVENTS
  // ============================================================================

  /**
   * Track feature flag viewed
   */
  async logFeatureFlagViewed(featureName: string, isEnabled: boolean, isPremium: boolean) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('feature_flag_viewed', {
          feature_name: featureName,
          is_enabled: isEnabled,
          is_premium: isPremium,
        });
      },
      'feature_flag_viewed'
    );
  },

  /**
   * Track coming soon feature clicked
   */
  async logComingSoonFeatureClicked(featureName: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('coming_soon_feature_clicked', {
          feature_name: featureName,
        });
      },
      'coming_soon_feature_clicked'
    );
  },

  // ============================================================================
  // ERROR & PERFORMANCE EVENTS
  // ============================================================================

  /**
   * Track app error
   */
  async logError(errorMessage: string, errorStack?: string, screen?: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('app_error', {
          error_message: errorMessage.substring(0, 100),
          screen: screen || 'unknown',
          has_stack: !!errorStack,
        });
      },
      'app_error'
    );
  },

  /**
   * Track API error
   */
  async logAPIError(endpoint: string, statusCode: number, errorMessage: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('api_error', {
          endpoint,
          status_code: statusCode,
          error_message: errorMessage.substring(0, 100),
        });
      },
      'api_error'
    );
  },

  /**
   * Track slow performance
   */
  async logSlowPerformance(screen: string, loadTimeMs: number) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('slow_performance', {
          screen,
          load_time_ms: loadTimeMs,
        });
      },
      'slow_performance'
    );
  },

  // ============================================================================
  // NAVIGATION EVENTS
  // ============================================================================

  /**
   * Track tab switched
   */
  async logTabSwitched(fromTab: string, toTab: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('tab_switched', {
          from_tab: fromTab,
          to_tab: toTab,
        });
      },
      'tab_switched'
    );
  },

  /**
   * Track deep link opened
   */
  async logDeepLinkOpened(path: string, source: string) {
    await safeAnalytics(
      async () => {
        await analytics().logEvent('deep_link_opened', {
          path,
          source,
        });
      },
      'deep_link_opened'
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
