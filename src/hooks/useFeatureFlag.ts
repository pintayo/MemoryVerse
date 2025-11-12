/**
 * React Hook for Feature Flags
 *
 * Usage:
 * const canUseFeature = useFeatureFlag('socialSharing');
 * const isPremiumFeature = useFeaturePremiumStatus('streakFreeze');
 */

import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { featureFlags, isFeatureAvailable, type FeatureFlagsConfig } from '../config/featureFlags';

/**
 * Check if a feature is available for current user
 *
 * @param feature - Feature key
 * @returns true if feature is enabled and available to user
 */
export function useFeatureFlag(feature: keyof FeatureFlagsConfig): boolean {
  const { profile } = useAuth();
  const isPremium = profile?.is_premium || false;

  return useMemo(() => {
    return isFeatureAvailable(feature, isPremium);
  }, [feature, isPremium]);
}

/**
 * Get feature config
 *
 * @param feature - Feature key
 * @returns Feature configuration object
 */
export function useFeatureConfig(feature: keyof FeatureFlagsConfig) {
  return useMemo(() => {
    return featureFlags[feature];
  }, [feature]);
}

/**
 * Check if feature requires premium
 *
 * @param feature - Feature key
 * @returns true if feature requires premium subscription
 */
export function useFeaturePremiumStatus(feature: keyof FeatureFlagsConfig): boolean {
  return useMemo(() => {
    return featureFlags[feature].premium;
  }, [feature]);
}

/**
 * Get all enabled features for current user
 *
 * @returns Array of enabled feature keys
 */
export function useEnabledFeatures(): string[] {
  const { profile } = useAuth();
  const isPremium = profile?.is_premium || false;

  return useMemo(() => {
    return Object.entries(featureFlags)
      .filter(([_, config]) => {
        if (!config.enabled) return false;
        if (config.premium && !isPremium) return false;
        return true;
      })
      .map(([key, _]) => key);
  }, [isPremium]);
}

/**
 * Check if user can access premium features
 *
 * @returns true if user has active premium subscription
 */
export function useHasPremium(): boolean {
  const { profile } = useAuth();
  return profile?.is_premium || false;
}

export default useFeatureFlag;
