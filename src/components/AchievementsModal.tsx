/**
 * Achievements Modal Component
 *
 * Displays user achievements with animated progress and unlock celebrations
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Achievement, AchievementCategory } from '../services/achievementsService';

interface AchievementsModalProps {
  visible: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  visible,
  onClose,
  achievements,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const animatedValuesRef = useRef<Record<string, Animated.Value>>({});

  // Get or create animated value for achievement
  const getAnimatedValue = (achievementId: string): Animated.Value => {
    if (!animatedValuesRef.current[achievementId]) {
      animatedValuesRef.current[achievementId] = new Animated.Value(0);
    }
    return animatedValuesRef.current[achievementId];
  };

  useEffect(() => {
    if (visible) {
      // Animate achievements in when modal opens
      achievements.forEach((achievement, index) => {
        const animValue = getAnimatedValue(achievement.id);
        Animated.timing(animValue, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Reset animations when modal closes
      Object.values(animatedValuesRef.current).forEach((value) => {
        value.setValue(0);
      });
    }
  }, [visible, achievements]);

  const categories: { id: AchievementCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'learning', label: 'Learning', icon: 'book' },
    { id: 'streak', label: 'Streaks', icon: 'flame' },
    { id: 'level', label: 'Levels', icon: 'trending-up' },
    { id: 'practice', label: 'Practice', icon: 'fitness' },
    { id: 'reading', label: 'Reading', icon: 'library' },
  ];

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Achievements</Text>
            <Text style={styles.headerSubtitle}>
              {unlockedCount} of {totalCount} unlocked
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={20}
                color={
                  selectedCategory === category.id
                    ? theme.colors.background.lightCream
                    : theme.colors.text.primary
                }
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Achievements List */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {filteredAchievements.map((achievement) => {
            const animValue = getAnimatedValue(achievement.id);
            return (
              <Animated.View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.unlocked ? styles.achievementCardUnlocked : styles.achievementCardLocked,
                  {
                    opacity: animValue,
                    transform: [
                      {
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
              {/* Achievement Icon */}
              <View
                style={[
                  styles.iconContainer,
                  achievement.unlocked ? styles.iconContainerUnlocked : styles.iconContainerLocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                {achievement.unlocked && (
                  <View style={styles.checkmarkBadge}>
                    <Ionicons name="checkmark" size={12} color={theme.colors.background.lightCream} />
                  </View>
                )}
              </View>

              {/* Achievement Info */}
              <View style={styles.achievementInfo}>
                <Text
                  style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked,
                  ]}
                >
                  {achievement.title}
                </Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>

                {/* Progress Bar */}
                {!achievement.unlocked && achievement.currentProgress !== undefined && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              (achievement.currentProgress / achievement.requirement) * 100,
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {achievement.currentProgress} / {achievement.requirement}
                    </Text>
                  </View>
                )}

                {/* XP Reward */}
                <View style={styles.rewardContainer}>
                  <Ionicons name="star" size={14} color={theme.colors.secondary.lightGold} />
                  <Text style={styles.rewardText}>+{achievement.xpReward} XP</Text>
                </View>
              </View>
            </Animated.View>
            );
          })}

          {filteredAchievements.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No achievements in this category yet</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.lightCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.warmParchment,
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.secondary.lightGold,
    borderColor: theme.colors.secondary.lightGold,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  categoryTextActive: {
    color: theme.colors.background.lightCream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
  },
  achievementCardUnlocked: {
    backgroundColor: theme.colors.background.warmParchment,
    borderColor: theme.colors.secondary.lightGold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementCardLocked: {
    backgroundColor: theme.colors.background.lightCream,
    borderColor: theme.colors.primary.mutedStone,
    opacity: 0.7,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  iconContainerUnlocked: {
    backgroundColor: theme.colors.secondary.lightGold,
  },
  iconContainerLocked: {
    backgroundColor: theme.colors.primary.mutedStone,
  },
  achievementIcon: {
    fontSize: 32,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary.softOlive,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.warmParchment,
  },
  achievementInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: theme.colors.text.secondary,
  },
  achievementDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.primary.mutedStone,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.secondary.lightGold,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
});
