/**
 * Achievement Unlock Notification Component
 *
 * Animated notification that appears when an achievement is unlocked
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Achievement } from '../services/achievementsService';

interface AchievementUnlockNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const AchievementUnlockNotification: React.FC<AchievementUnlockNotificationProps> = ({
  achievement,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievement) {
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        dismissNotification();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!achievement) return null;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={dismissNotification}
        activeOpacity={0.95}
      >
        {/* Celebration Particles */}
        <View style={styles.particles}>
          <Text style={[styles.particle, styles.particle1]}>✨</Text>
          <Text style={[styles.particle, styles.particle2]}>🌟</Text>
          <Text style={[styles.particle, styles.particle3]}>⭐</Text>
          <Text style={[styles.particle, styles.particle4]}>✨</Text>
        </View>

        {/* Achievement Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: rotation }],
            },
          ]}
        >
          <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          <View style={styles.checkmarkBadge}>
            <Ionicons name="checkmark" size={14} color={theme.colors.background.lightCream} />
          </View>
        </Animated.View>

        {/* Achievement Info */}
        <View style={styles.content}>
          <Text style={styles.unlockText}>Achievement Unlocked!</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
          <View style={styles.rewardContainer}>
            <Ionicons name="star" size={16} color={theme.colors.secondary.lightGold} />
            <Text style={styles.rewardText}>+{achievement.xpReward} XP</Text>
          </View>
        </View>

        {/* Close Button */}
        <TouchableOpacity onPress={dismissNotification} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.secondary.lightGold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'visible',
  },
  particles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    fontSize: 20,
  },
  particle1: {
    top: -10,
    left: 20,
  },
  particle2: {
    top: -8,
    right: 30,
  },
  particle3: {
    bottom: -8,
    left: 40,
  },
  particle4: {
    bottom: -10,
    right: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.secondary.lightGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    position: 'relative',
    shadowColor: theme.colors.secondary.lightGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementIcon: {
    fontSize: 36,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.softOlive,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background.warmParchment,
  },
  content: {
    flex: 1,
  },
  unlockText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 6,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
  },
  closeButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
});
