import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { theme } from '../theme';
import Svg, { Path, Circle } from 'react-native-svg';

interface LessonCompleteModalProps {
  visible: boolean;
  correctCount: number;
  totalVerses: number;
  xpEarned: number;
  currentXP: number;
  currentLevel: number;
  xpForNextLevel: number;
  onClose: () => void;
}

export const LessonCompleteModal: React.FC<LessonCompleteModalProps> = ({
  visible,
  correctCount,
  totalVerses,
  xpEarned,
  currentXP,
  currentLevel,
  xpForNextLevel,
  onClose,
}) => {
  const xpBarAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate modal appearance
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Animate XP bar fill
      const startXP = currentXP - xpEarned;
      const startProgress = startXP / xpForNextLevel;
      const endProgress = currentXP / xpForNextLevel;

      xpBarAnim.setValue(startProgress);

      setTimeout(() => {
        Animated.timing(xpBarAnim, {
          toValue: endProgress,
          duration: 1500,
          useNativeDriver: false,
        }).start();
      }, 500);
    } else {
      scaleAnim.setValue(0);
      xpBarAnim.setValue(0);
    }
  }, [visible]);

  const percentage = Math.round((correctCount / totalVerses) * 100);
  const isPerfect = correctCount === totalVerses;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            {isPerfect ? (
              <Svg width="64" height="64" viewBox="0 0 24 24">
                <Path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill={theme.colors.success.celebratoryGold}
                />
              </Svg>
            ) : (
              <Svg width="64" height="64" viewBox="0 0 24 24">
                <Circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill={theme.colors.success.mutedOlive}
                />
                <Path
                  d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                  fill={theme.colors.text.onDark}
                />
              </Svg>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isPerfect ? 'Perfect! 🎉' : 'Lesson Complete!'}
          </Text>

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {correctCount}/{totalVerses}
            </Text>
            <Text style={styles.scorePercentage}>{percentage}%</Text>
          </View>

          {/* XP Earned */}
          <View style={styles.xpContainer}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill={theme.colors.secondary.lightGold}
              />
            </Svg>
            <Text style={styles.xpText}>+{xpEarned} XP</Text>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.levelText}>Level {currentLevel}</Text>
              <Text style={styles.xpProgressText}>
                {currentXP}/{xpForNextLevel} XP
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: xpBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.screen.horizontal,
  },
  modalContainer: {
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xxl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...theme.shadows.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xxl,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  scoreLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  scorePercentage: {
    fontSize: 18,
    color: theme.colors.success.mutedOlive,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.secondary.lightGold,
    borderRadius: theme.borderRadius.full,
  },
  xpText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  progressSection: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  levelText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  xpProgressText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.primary.oatmeal,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.success.celebratoryGold,
    borderRadius: theme.borderRadius.full,
  },
  button: {
    backgroundColor: theme.colors.success.mutedOlive,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  buttonText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
});
