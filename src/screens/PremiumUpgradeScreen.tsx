/**
 * Premium Upgrade Screen
 *
 * Beautiful pricing and subscription management screen
 * Shows all premium features and handles upgrade flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../theme';
import { featureFlags, getPremiumFeatures } from '../config/featureFlags';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { analyticsService } from '../services/analyticsService';
import { purchaseService, SubscriptionTier } from '../services/purchaseService';

export const PremiumUpgradeScreen = () => {
  const { profile, refreshProfile } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [offerings, setOfferings] = useState<SubscriptionTier[]>([]);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const isPremiumUser = profile?.is_premium || false;

  // Track screen view
  useEffect(() => {
    const source = (route.params as any)?.source || 'profile';
    analyticsService.logPremiumScreenViewed(source);
  }, []);

  // Load offerings from RevenueCat
  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setIsLoadingOfferings(true);
    try {
      const tiers = await purchaseService.getOfferings();
      setOfferings(tiers);

      // Auto-select the recommended tier (annual)
      const recommended = tiers.find(t => t.isRecommended);
      if (recommended) {
        setSelectedTier(recommended);
      } else if (tiers.length > 0) {
        setSelectedTier(tiers[0]);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    } finally {
      setIsLoadingOfferings(false);
    }
  };

  // Get premium features excluding 'originalLanguage'
  const premiumFeatureKeys = getPremiumFeatures().filter(key => key !== 'originalLanguage');

  const handleUpgrade = async () => {
    if (!selectedTier || !selectedTier.package) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    // Track premium plan selected
    analyticsService.logPremiumPlanSelected(selectedTier.id);

    setIsPurchasing(true);
    try {
      const result = await purchaseService.purchasePackage(selectedTier.package);

      if (result.success) {
        // Refresh profile to update premium status
        await refreshProfile();

        Alert.alert(
          'Welcome to Premium! 🎉',
          'Thank you for subscribing! You now have access to all premium features.',
          [{ text: 'Start Exploring', onPress: () => navigation.goBack() }]
        );
      } else if (!result.userCancelled) {
        // Only show error if user didn't cancel
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore Purchases',
      'This will restore any previous premium purchases from this App Store account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setIsPurchasing(true);
            try {
              const result = await purchaseService.restorePurchases();

              if (result.success) {
                // Refresh profile
                await refreshProfile();

                if (result.isPremium) {
                  Alert.alert(
                    'Success!',
                    'Your premium subscription has been restored.',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert(
                    'No Purchases Found',
                    'No previous purchases were found on this account.',
                    [{ text: 'OK' }]
                  );
                }
              } else {
                Alert.alert(
                  'Restore Failed',
                  result.error || 'Unable to restore purchases.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to restore purchases.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsPurchasing(false);
            }
          }
        },
      ]
    );
  };

  if (isPremiumUser) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Premium Active Header */}
          <View style={styles.activeHeader}>
            <View style={styles.checkmarkCircle}>
              <Svg width="32" height="32" viewBox="0 0 24 24">
                <Circle cx="12" cy="12" r="10" fill={theme.colors.success.green} />
                <Path
                  d="M7 12 L10 15 L17 8"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.activeTitle}>Premium Active</Text>
            <Text style={styles.activeSubtitle}>
              You have full access to all premium features
            </Text>
          </View>

          {/* Premium Features List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Premium Features</Text>
            {premiumFeatureKeys.map((key) => {
              const feature = featureFlags[key as keyof typeof featureFlags];
              const isAvailable = feature.enabled;

              return (
                <View
                  key={key}
                  style={[
                    styles.featureRow,
                    !isAvailable && styles.featureRowDisabled
                  ]}
                >
                  <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.checkmark}>
                    <Path
                      d="M5 12 L10 17 L20 7"
                      stroke={isAvailable ? theme.colors.success.green : theme.colors.text.tertiary}
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <View style={styles.featureText}>
                    <View style={styles.featureNameRow}>
                      <Text style={[
                        styles.featureName,
                        !isAvailable && styles.featureNameDisabled
                      ]}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      {!isAvailable && (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>Coming Soon</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.featureDescription,
                      !isAvailable && styles.featureDescriptionDisabled
                    ]}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Manage Subscription */}
          <TouchableOpacity style={styles.manageButton} onPress={handleRestore}>
            <Text style={styles.manageButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Compact Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Unlock Premium</Text>
          <Text style={styles.heroSubtitle}>
            Deepen your faith with unlimited AI prayers, streak protection, verse insights, and early Story Mode access
          </Text>
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>

          {isLoadingOfferings ? (
            <View style={styles.loadingOfferings}>
              <ActivityIndicator size="large" color={theme.colors.accent.burnishedGold} />
              <Text style={styles.loadingText}>Loading subscription options...</Text>
            </View>
          ) : offerings.length === 0 ? (
            <View style={styles.noOfferings}>
              <Text style={styles.noOfferingsText}>
                Unable to load subscription plans. Please try again later.
              </Text>
            </View>
          ) : (
            <>
              {offerings.map((tier) => (
                <TouchableOpacity
                  key={tier.id}
                  style={[
                    styles.pricingCard,
                    selectedTier?.id === tier.id && styles.pricingCardSelected,
                    tier.isRecommended && styles.pricingCardRecommended,
                  ]}
                  onPress={() => setSelectedTier(tier)}
                  disabled={isPurchasing}
                >
                  {tier.isRecommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  )}
                  {tier.savings && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>{tier.savings}</Text>
                    </View>
                  )}
                  <View style={styles.pricingHeader}>
                    <Text style={styles.planName}>{tier.title}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{tier.price}</Text>
                      <Text style={styles.period}>{tier.period}</Text>
                    </View>
                    <Text style={styles.priceDetail}>{tier.pricePerMonth}</Text>
                  </View>

                  {/* Concrete, measurable premium features - ONLY WHAT'S ACTUALLY AVAILABLE */}
                  <View style={styles.tierFeatures}>
                    <View style={styles.bulletPoint}>
                      <Text style={styles.bulletIcon}>✨</Text>
                      <Text style={styles.tierFeatureTextHighlight}>
                        Unlimited AI prayers (free: 3/day) - Get personalized prayers anytime
                      </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                      <Text style={styles.bulletIcon}>🔥</Text>
                      <Text style={styles.tierFeatureTextHighlight}>
                        Streak freeze protection (once per week) - Never lose your hard-earned streak
                      </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                      <Text style={styles.bulletIcon}>📖</Text>
                      <Text style={styles.tierFeatureTextHighlight}>
                        AI-generated verse context - Understand every verse deeply
                      </Text>
                    </View>
                    <View style={styles.bulletPoint}>
                      <Text style={styles.bulletIcon}>📺</Text>
                      <Text style={styles.tierFeatureTextMore}>
                        Early access to Story Mode (launching in 4-6 weeks!)
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Upgrade Button */}
        <TouchableOpacity
          style={[styles.upgradeButton, isPurchasing && styles.upgradeButtonDisabled]}
          onPress={handleUpgrade}
          disabled={isPurchasing || isLoadingOfferings || !selectedTier}
        >
          {isPurchasing ? (
            <>
              <ActivityIndicator color="white" style={{ marginRight: 8 }} />
              <Text style={styles.upgradeButtonText}>Processing...</Text>
            </>
          ) : (
            <Text style={styles.upgradeButtonText}>
              Subscribe to {selectedTier?.title || 'Premium'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Restore Purchases */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          Subscription automatically renews unless cancelled at least 24 hours before the end of
          the current period. Payment will be charged to your App Store account.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.lightCream,
  },
  content: {
    padding: theme.spacing.md,
  },
  hero: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  heroIcon: {
    marginBottom: theme.spacing.sm,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  heroSubtitle: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  pricingSection: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
  },
  pricingCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderWidth: 2,
    borderColor: theme.colors.primary.mutedStone,
    position: 'relative',
  },
  pricingCardSelected: {
    borderColor: theme.colors.accent.burnishedGold,
    backgroundColor: theme.colors.background.lightCream,
  },
  pricingCardRecommended: {
    borderColor: theme.colors.secondary.lightGold,
    borderWidth: 3,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.secondary.lightGold,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    zIndex: 1,
  },
  recommendedText: {
    color: theme.colors.text.primary,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: theme.typography.fonts.ui.default,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: theme.spacing.md,
    backgroundColor: theme.colors.success.green,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  savingsText: {
    color: 'white',
    fontSize: theme.typography.ui.caption.fontSize,
    fontWeight: '700',
    fontFamily: theme.typography.fonts.ui.default,
  },
  pricingHeader: {
    alignItems: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 0,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.accent.burnishedGold,
    fontFamily: theme.typography.fonts.ui.default,
  },
  period: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginLeft: 4,
  },
  priceDetail: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  featureRowDisabled: {
    opacity: 0.5,
  },
  checkmark: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  featureName: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    textTransform: 'capitalize',
  },
  featureNameDisabled: {
    color: theme.colors.text.tertiary,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.secondary.lightGold + '30',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.secondary.lightGold + '50',
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
    textTransform: 'uppercase',
  },
  featureDescription: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 20,
  },
  featureDescriptionDisabled: {
    color: theme.colors.text.tertiary,
  },
  upgradeButton: {
    backgroundColor: theme.colors.accent.burnishedGold,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: '700',
    fontFamily: theme.typography.fonts.ui.default,
  },
  restoreButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  restoreText: {
    color: theme.colors.accent.burnishedGold,
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    fontFamily: theme.typography.fonts.ui.default,
  },
  terms: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Premium Active Styles
  activeHeader: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.success.green,
  },
  checkmarkCircle: {
    marginBottom: theme.spacing.md,
  },
  activeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.success.green,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  activeSubtitle: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  manageButton: {
    backgroundColor: theme.colors.accent.burnishedGold,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  manageButtonText: {
    color: 'white',
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: '700',
    fontFamily: theme.typography.fonts.ui.default,
  },
  loadingOfferings: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  noOfferings: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  noOfferingsText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  tierFeatures: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary.oatmeal,
    gap: theme.spacing.xs,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletIcon: {
    fontSize: 14,
    lineHeight: 18,
  },
  tierFeatureText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  tierFeatureTextHighlight: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
    lineHeight: 18,
  },
  tierFeatureTextMore: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default PremiumUpgradeScreen;
