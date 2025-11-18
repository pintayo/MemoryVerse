/**
 * Usage Limits Service
 * Manages daily usage limits for premium features
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface SubscriptionTier {
  name: string;
  dailyLimit: number;
}

// Define subscription tiers and their limits
export const SUBSCRIPTION_TIERS = {
  FREE: { name: 'Free', dailyLimit: 0 },
  BASIC: { name: 'Basic (€4.99/mo)', dailyLimit: 1 },
  STANDARD: { name: 'Standard (€9.99/mo)', dailyLimit: 5 },
  PREMIUM: { name: 'Premium (€14.99/mo)', dailyLimit: 10 },
} as const;

// Feature names
export const FEATURES = {
  TALK_ABOUT_DAY: 'talk_about_day',
  AI_PRAYER_GENERATION: 'ai_prayer_generation',
  OFFLINE_DOWNLOADS: 'offline_downloads',
} as const;

/**
 * Get the subscription tier for a user
 * Checks the user's actual subscription tier from their profile
 */
export function getUserSubscriptionTier(
  isPremium: boolean,
  subscriptionTier?: string | null
): SubscriptionTier {
  if (!isPremium) {
    return SUBSCRIPTION_TIERS.FREE;
  }

  // Map subscription tier to limits
  switch (subscriptionTier?.toLowerCase()) {
    case 'premium':
      return SUBSCRIPTION_TIERS.PREMIUM; // 10 prayers/day
    case 'standard':
      return SUBSCRIPTION_TIERS.STANDARD; // 5 prayers/day
    case 'basic':
      return SUBSCRIPTION_TIERS.BASIC; // 1 prayer/day
    default:
      // Default to BASIC for premium users without explicit tier
      return SUBSCRIPTION_TIERS.BASIC;
  }
}

/**
 * Check remaining usage for a feature
 */
export async function getRemainingUsage(
  userId: string,
  featureName: string,
  dailyLimit: number
): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_remaining_usage', {
        p_user_id: userId,
        p_feature_name: featureName,
        p_daily_limit: dailyLimit,
      });

    if (error) {
      logger.error('[usageLimitsService] Error getting remaining usage:', error);
      throw error;
    }

    return data as number;
  } catch (error) {
    logger.error('[usageLimitsService] Failed to get remaining usage:', error);
    return 0;
  }
}

/**
 * Check if user can use a feature and increment usage count
 * Returns remaining usage or -1 if limit exceeded
 */
export async function checkAndIncrementUsage(
  userId: string,
  featureName: string,
  dailyLimit: number
): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('check_and_increment_usage', {
        p_user_id: userId,
        p_feature_name: featureName,
        p_daily_limit: dailyLimit,
      });

    if (error) {
      logger.error('[usageLimitsService] Error checking usage:', error);
      throw error;
    }

    const remaining = data as number;
    logger.log(`[usageLimitsService] Usage check for ${featureName}: ${remaining} remaining`);
    return remaining;
  } catch (error) {
    logger.error('[usageLimitsService] Failed to check usage:', error);
    return -1;
  }
}

/**
 * Check if user can use "Talk about your day" feature
 */
export async function canUseTalkAboutDay(
  userId: string,
  isPremium: boolean,
  subscriptionTier?: string | null
): Promise<{ canUse: boolean; remaining: number; limit: number; message?: string }> {
  // Check if user is premium
  if (!isPremium) {
    return {
      canUse: false,
      remaining: 0,
      limit: 0,
      message: 'This is a premium feature. Upgrade to access it!',
    };
  }

  const tier = getUserSubscriptionTier(isPremium, subscriptionTier);
  const remaining = await getRemainingUsage(userId, FEATURES.TALK_ABOUT_DAY, tier.dailyLimit);

  if (remaining <= 0) {
    return {
      canUse: false,
      remaining: 0,
      limit: tier.dailyLimit,
      message: `You've used all ${tier.dailyLimit} daily prayers. Resets at midnight!`,
    };
  }

  return {
    canUse: true,
    remaining,
    limit: tier.dailyLimit,
  };
}

/**
 * Use "Talk about your day" feature (increments usage)
 */
export async function useTalkAboutDay(
  userId: string,
  isPremium: boolean,
  subscriptionTier?: string | null
): Promise<{ success: boolean; remaining: number; message?: string }> {
  if (!isPremium) {
    return {
      success: false,
      remaining: 0,
      message: 'Premium subscription required',
    };
  }

  const tier = getUserSubscriptionTier(isPremium, subscriptionTier);
  const remaining = await checkAndIncrementUsage(userId, FEATURES.TALK_ABOUT_DAY, tier.dailyLimit);

  if (remaining < 0) {
    return {
      success: false,
      remaining: 0,
      message: `Daily limit of ${tier.dailyLimit} prayers reached. Try again tomorrow!`,
    };
  }

  return {
    success: true,
    remaining,
  };
}

/**
 * Get usage stats for display
 */
export async function getUsageStats(
  userId: string,
  isPremium: boolean,
  subscriptionTier?: string | null
): Promise<{
  talkAboutDay: { used: number; limit: number; remaining: number };
}> {
  const tier = getUserSubscriptionTier(isPremium, subscriptionTier);
  const remaining = await getRemainingUsage(userId, FEATURES.TALK_ABOUT_DAY, tier.dailyLimit);
  const used = Math.max(0, tier.dailyLimit - remaining);

  return {
    talkAboutDay: {
      used,
      limit: tier.dailyLimit,
      remaining,
    },
  };
}

logger.log('[usageLimitsService] Module loaded');
