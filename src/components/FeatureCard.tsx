/**
 * Feature Card Component
 *
 * Shows available, premium, or coming soon features
 * Used in ProfileScreen and settings
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { type FeatureModule } from '../config/featureFlags';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  feature: FeatureModule;
  isPremiumUser: boolean;
  onPress?: () => void;
  onUpgradePress?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  feature,
  isPremiumUser,
  onPress,
  onUpgradePress,
}) => {
  const isAvailable = feature.enabled && (!feature.premium || isPremiumUser);
  const needsPremium = feature.premium && !isPremiumUser;
  const comingSoon = feature.comingSoon;

  const handlePress = () => {
    if (needsPremium && onUpgradePress) {
      onUpgradePress();
    } else if (isAvailable && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        !isAvailable && styles.cardDisabled,
      ]}
      onPress={handlePress}
      disabled={!isAvailable && !needsPremium}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{icon}</View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>

          {/* Badges */}
          <View style={styles.badges}>
            {needsPremium && (
              <View style={[styles.badge, styles.badgePremium]}>
                <Text style={styles.badgeText}>Premium</Text>
              </View>
            )}
            {comingSoon && (
              <View style={[styles.badge, styles.badgeComingSoon]}>
                <Text style={styles.badgeText}>Coming Soon</Text>
              </View>
            )}
            {feature.version && feature.version !== 'v1.0' && (
              <View style={[styles.badge, styles.badgeVersion]}>
                <Text style={styles.badgeText}>{feature.version}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.description}>{description}</Text>

        {/* Action hint */}
        {needsPremium && (
          <Text style={styles.actionHint}>Tap to upgrade</Text>
        )}
      </View>

      {/* Arrow icon */}
      {(isAvailable || needsPremium) && (
        <Svg width="20" height="20" viewBox="0 0 24 24" style={styles.arrow}>
          <Path
            d="M8 5 L16 12 L8 19"
            stroke={needsPremium ? theme.colors.accent.burnishedGold : theme.colors.text.tertiary}
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  badgePremium: {
    backgroundColor: theme.colors.accent.burnishedGold,
  },
  badgeComingSoon: {
    backgroundColor: theme.colors.accent.rosyBlush,
  },
  badgeVersion: {
    backgroundColor: theme.colors.primary.mutedStone,
  },
  badgeText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '700',
  },
  description: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  actionHint: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.accent.burnishedGold,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  arrow: {
    marginLeft: theme.spacing.sm,
  },
});

export default FeatureCard;
