import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '../theme';

interface BibleCompanionProps {
  streak?: number;
  xp?: number;
  isCelebrating?: boolean;
  onPress?: () => void;
}

const BibleCompanion: React.FC<BibleCompanionProps> = ({
  streak = 0,
  xp = 0,
  isCelebrating = false,
  onPress,
}) => {
  // Animation values
  const breathAnim = useRef(new Animated.Value(0)).current;
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // Breathing animation (idle state)
  useEffect(() => {
    const breathAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breathAnimation.start();

    return () => breathAnimation.stop();
  }, [breathAnim]);

  // Celebration animation
  useEffect(() => {
    if (isCelebrating) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(celebrateAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(celebrateAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          })
        ),
      ]).start();

      // Reset after celebration
      setTimeout(() => {
        celebrateAnim.setValue(0);
        sparkleAnim.setValue(0);
      }, 2000);
    }
  }, [isCelebrating, celebrateAnim, sparkleAnim]);

  // Glow animation for high streaks
  useEffect(() => {
    if (streak >= 7) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.start();
      return () => glowAnimation.stop();
    }
  }, [streak, glowAnim]);

  // Interpolate animations
  const breathScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const celebrateScale = celebrateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Determine ornate level based on streak
  const ornateLevel = Math.min(Math.floor(streak / 7), 3);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { scale: breathScale },
              { scale: celebrateScale },
            ],
          },
        ]}
      >
        {/* Glow effect for high streaks */}
        {streak >= 7 && (
          <Animated.View
            style={[
              styles.glowContainer,
              {
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        {/* Sparkles during celebration */}
        {isCelebrating && (
          <>
            <Animated.View
              style={[
                styles.sparkle,
                styles.sparkle1,
                { transform: [{ rotate: sparkleRotate }] },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkle,
                styles.sparkle2,
                { transform: [{ rotate: sparkleRotate }] },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkle,
                styles.sparkle3,
                { transform: [{ rotate: sparkleRotate }] },
              ]}
            />
          </>
        )}

        {/* The Bible Book */}
        <Svg width="80" height="100" viewBox="0 0 80 100">
          <Defs>
            <LinearGradient id="bookGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.colors.primary.sandyBeige} />
              <Stop offset="1" stopColor={theme.colors.primary.mutedStone} />
            </LinearGradient>
            <LinearGradient id="pageGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={theme.colors.secondary.lightGold} />
              <Stop offset="1" stopColor={theme.colors.success.celebratoryGold} />
            </LinearGradient>
          </Defs>

          {/* Book cover */}
          <Rect
            x="10"
            y="10"
            width="60"
            height="80"
            rx="4"
            fill="url(#bookGradient)"
            stroke={theme.colors.secondary.lightGold}
            strokeWidth="2"
          />

          {/* Page edges (right side) */}
          <Rect
            x="68"
            y="12"
            width="4"
            height="76"
            fill="url(#pageGradient)"
          />

          {/* Ornate golden details based on streak */}
          {ornateLevel >= 1 && (
            <>
              {/* Corner embellishments */}
              <Path
                d="M 15 15 Q 20 15 20 20 L 20 15 Z"
                fill={theme.colors.secondary.lightGold}
              />
              <Path
                d="M 65 15 Q 60 15 60 20 L 60 15 Z"
                fill={theme.colors.secondary.lightGold}
              />
            </>
          )}

          {ornateLevel >= 2 && (
            <>
              {/* Side decorations */}
              <Path
                d="M 40 15 L 38 20 L 42 20 Z"
                fill={theme.colors.success.celebratoryGold}
              />
              <Circle
                cx="40"
                cy="50"
                r="8"
                stroke={theme.colors.success.celebratoryGold}
                strokeWidth="1.5"
                fill="none"
              />
            </>
          )}

          {ornateLevel >= 3 && (
            <>
              {/* Full illuminated manuscript style */}
              <Path
                d="M 15 85 Q 20 85 20 80 L 20 85 Z"
                fill={theme.colors.secondary.lightGold}
              />
              <Path
                d="M 65 85 Q 60 85 60 80 L 60 85 Z"
                fill={theme.colors.secondary.lightGold}
              />
            </>
          )}

          {/* Face */}
          {/* Eyes */}
          <Circle cx="32" cy="42" r="3" fill={theme.colors.text.primary} />
          <Circle cx="48" cy="42" r="3" fill={theme.colors.text.primary} />

          {/* Smile */}
          <Path
            d="M 32 52 Q 40 58 48 52"
            stroke={theme.colors.text.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Rosy blush */}
          <Circle cx="26" cy="48" r="4" fill={theme.colors.accent.rosyBlush} opacity="0.4" />
          <Circle cx="54" cy="48" r="4" fill={theme.colors.accent.rosyBlush} opacity="0.4" />
        </Svg>

        {/* Streak indicator */}
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <View style={styles.flameContainer}>
              <Svg width="16" height="20" viewBox="0 0 16 20">
                <Path
                  d="M8 0 C8 0 4 5 4 9 C4 12.3 5.8 15 8 15 C10.2 15 12 12.3 12 9 C12 5 8 0 8 0 Z"
                  fill={theme.colors.secondary.warmTerracotta}
                />
                <Path
                  d="M8 4 C8 4 6 7 6 9 C6 10.7 7 12 8 12 C9 12 10 10.7 10 9 C10 7 8 4 8 4 Z"
                  fill={theme.colors.success.celebratoryGold}
                />
              </Svg>
            </View>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 100,
  },
  glowContainer: {
    position: 'absolute',
    width: 90,
    height: 110,
    borderRadius: 12,
    backgroundColor: theme.colors.success.celebratoryGold,
    opacity: 0.3,
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.effects.sparkle,
  },
  sparkle1: {
    top: 5,
    right: 5,
  },
  sparkle2: {
    top: 20,
    right: -5,
  },
  sparkle3: {
    top: 40,
    right: 2,
  },
  streakBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: 12,
    padding: 4,
    ...theme.shadows.sm,
  },
  flameContainer: {
    width: 16,
    height: 20,
  },
});

export default BibleCompanion;
