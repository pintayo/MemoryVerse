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
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../theme';
import { featureFlags, getPremiumFeatures } from '../config/featureFlags';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { analyticsService } from '../services/analyticsService';

type PricingPlan = 'monthly' | 'annual';

export const PremiumUpgradeScreen = () => {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>('annual');

  const isPremiumUser = profile?.is_premium || false;

  // Track screen view
  useEffect(() => {
    const source = (route.params as any)?.source || 'profile';
    analyticsService.logPremiumScreenViewed(source);
  }, []);

  const premiumFeatureKeys = getPremiumFeatures();

  // Pricing configuration
  const pricing = {
    monthly: {
      price: '$4.99',
      period: '/month',
      total: '$4.99/month',
      savings: null,
    },
    annual: {
      price: '$39.99',
      period: '/year',
      total: '$3.33/month',
      savings: 'Save 33%',
    },
  };

  const handleUpgrade = () => {
    // Track premium plan selected
    analyticsService.logPremiumPlanSelected(selectedPlan);

    // TODO: Integrate with in-app purchases
    Alert.alert(
      'Coming Soon',
      'In-app purchases will be available soon. Thank you for your interest in Premium!',
      [{ text: 'OK' }]
    );
  };

  const handleRestore = () => {
    // TODO: Restore purchases
    Alert.alert(
      'Restore Purchases',
      'This will restore any previous premium purchases.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => {
          Alert.alert('Coming Soon', 'Restore functionality will be available soon.');
        }},
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
              return (
                <View key={key} style={styles.featureRow}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.checkmark}>
                    <Path
                      d="M5 12 L10 17 L20 7"
                      stroke={theme.colors.success.green}
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <View style={styles.featureText}>
                    <Text style={styles.featureName}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
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
        {/* Hero Section */}
        <View style={styles.hero}>
          <Svg width="64" height="64" viewBox="0 0 24 24" style={styles.heroIcon}>
            <Path
              d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"
              fill={theme.colors.accent.burnishedGold}
            />
          </Svg>
          <Text style={styles.heroTitle}>Unlock Premium</Text>
          <Text style={styles.heroSubtitle}>
            Accelerate your Bible memorization with powerful premium features
          </Text>
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>

          {/* Annual Plan */}
          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPlan === 'annual' && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPlan('annual')}
          >
            {pricing.annual.savings && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>{pricing.annual.savings}</Text>
              </View>
            )}
            <View style={styles.pricingHeader}>
              <Text style={styles.planName}>Annual</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{pricing.annual.price}</Text>
                <Text style={styles.period}>{pricing.annual.period}</Text>
              </View>
              <Text style={styles.priceDetail}>{pricing.annual.total}</Text>
            </View>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.pricingCard,
              selectedPlan === 'monthly' && styles.pricingCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.pricingHeader}>
              <Text style={styles.planName}>Monthly</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{pricing.monthly.price}</Text>
                <Text style={styles.period}>{pricing.monthly.period}</Text>
              </View>
              <Text style={styles.priceDetail}>{pricing.monthly.total}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Premium Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          {premiumFeatureKeys.map((key) => {
            const feature = featureFlags[key as keyof typeof featureFlags];
            return (
              <View key={key} style={styles.featureRow}>
                <Svg width="24" height="24" viewBox="0 0 24 24" style={styles.checkmark}>
                  <Path
                    d="M5 12 L10 17 L20 7"
                    stroke={theme.colors.accent.burnishedGold}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <View style={styles.featureText}>
                  <Text style={styles.featureName}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Upgrade Button */}
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>
            Start {selectedPlan === 'annual' ? 'Annual' : 'Monthly'} Plan
          </Text>
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
    padding: theme.spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  heroIcon: {
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  pricingSection: {
    marginBottom: theme.spacing.xl,
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
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary.mutedStone,
    position: 'relative',
  },
  pricingCardSelected: {
    borderColor: theme.colors.accent.burnishedGold,
    backgroundColor: theme.colors.background.lightCream,
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
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  price: {
    fontSize: 40,
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
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  checkmark: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureName: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  featureDescription: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: theme.colors.accent.burnishedGold,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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
});

export default PremiumUpgradeScreen;
