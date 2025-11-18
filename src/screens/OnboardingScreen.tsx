import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { logger } from '../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingStep {
  title: string;
  description: string;
  illustration: React.ReactNode;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to MemoryVerse',
      description: 'Learn Bible verses through an engaging, interactive experience inspired by the best language learning apps.',
      illustration: (
        <Svg width={200} height={200} viewBox="0 0 200 200">
          {/* Open Bible Book */}
          <G>
            {/* Book pages - left */}
            <Path
              d="M40 60 L40 160 L100 155 L100 55 Z"
              fill={theme.colors.background.warmParchment}
              stroke={theme.colors.secondary.lightGold}
              strokeWidth="2"
            />
            {/* Book pages - right */}
            <Path
              d="M100 55 L100 155 L160 160 L160 60 Z"
              fill={theme.colors.background.lightCream}
              stroke={theme.colors.secondary.lightGold}
              strokeWidth="2"
            />
            {/* Text lines on left page */}
            <Path d="M50 80 L90 80" stroke={theme.colors.text.tertiary} strokeWidth="1.5" />
            <Path d="M50 90 L90 90" stroke={theme.colors.text.tertiary} strokeWidth="1.5" />
            <Path d="M50 100 L90 100" stroke={theme.colors.text.tertiary} strokeWidth="1.5" />
            <Path d="M50 110 L85 110" stroke={theme.colors.text.tertiary} strokeWidth="1.5" />
            {/* Text lines on right page */}
            <Path d="M110 80 L150 80" stroke={theme.colors.text.tertiary} strokeWidth="1.5" />
            <Path d="M110 90 L150 90" stroke={theme.colors.text.tertiary} strokeWidth="1.5" />
            <Path d="M110 100 L150 100" stroke={theme.colors.text.tertiary} strokeWidth="1.5" />
            <Path d="M110 110 L145 110" stroke={theme.colors.text.tertiary} strokeWidth="1.5" />
            {/* Decorative cross on right page */}
            <Path
              d="M135 125 L135 145 M125 135 L145 135"
              stroke={theme.colors.success.celebratoryGold}
              strokeWidth="3"
            />
            {/* Heart decoration */}
            <Path
              d="M100 140 C90 135 85 140 85 145 C85 150 100 160 100 160 C100 160 115 150 115 145 C115 140 110 135 100 140 Z"
              fill={theme.colors.secondary.warmTerracotta}
              opacity="0.8"
            />
          </G>
        </Svg>
      ),
    },
    {
      title: 'Learn & Practice',
      description: 'Master verses through interactive exercises. Type missing words, speak verses aloud, and build lasting memory.',
      illustration: (
        <Svg width={200} height={200} viewBox="0 0 200 200">
          {/* Speech bubble */}
          <G>
            {/* Main bubble */}
            <Rect
              x="30"
              y="40"
              width="140"
              height="100"
              rx="15"
              fill={theme.colors.background.lightCream}
              stroke={theme.colors.secondary.lightGold}
              strokeWidth="2"
            />
            {/* Tail */}
            <Path
              d="M60 140 L55 160 L75 145 Z"
              fill={theme.colors.background.lightCream}
              stroke={theme.colors.secondary.lightGold}
              strokeWidth="2"
            />
            {/* Text lines inside bubble */}
            <Path d="M50 60 L150 60" stroke={theme.colors.text.secondary} strokeWidth="2" />
            <Path d="M50 80 L140 80" stroke={theme.colors.text.secondary} strokeWidth="2" />
            <Path d="M50 100 L145 100" stroke={theme.colors.text.secondary} strokeWidth="2" />
            <Path d="M50 120 L130 120" stroke={theme.colors.text.tertiary} strokeWidth="1.5" />
            {/* Microphone icon at bottom */}
            <Circle
              cx="100"
              cy="170"
              r="20"
              fill={theme.colors.secondary.warmTerracotta}
            />
            <Rect
              x="95"
              y="160"
              width="10"
              height="15"
              rx="5"
              fill={theme.colors.text.onDark}
            />
            <Path
              d="M90 175 Q100 180 110 175"
              stroke={theme.colors.text.onDark}
              strokeWidth="2"
              fill="none"
            />
          </G>
        </Svg>
      ),
    },
    {
      title: 'Track Your Progress',
      description: 'Build your daily streak, earn XP, and climb the leaderboard. Watch your spiritual growth flourish.',
      illustration: (
        <Svg width={200} height={200} viewBox="0 0 200 200">
          {/* Trophy with stats */}
          <G>
            {/* Trophy */}
            <Path
              d="M70 60 L70 50 L130 50 L130 60 L120 90 L110 100 L90 100 L80 90 Z"
              fill={theme.colors.success.celebratoryGold}
              stroke={theme.colors.accent.burnishedGold}
              strokeWidth="2"
            />
            {/* Trophy base */}
            <Rect
              x="85"
              y="100"
              width="30"
              height="10"
              fill={theme.colors.success.celebratoryGold}
            />
            <Rect
              x="75"
              y="110"
              width="50"
              height="8"
              rx="2"
              fill={theme.colors.accent.burnishedGold}
            />
            {/* Trophy handles */}
            <Path
              d="M70 55 L60 55 L55 70 L65 75 L70 70 Z"
              fill={theme.colors.secondary.lightGold}
              stroke={theme.colors.accent.burnishedGold}
              strokeWidth="1.5"
            />
            <Path
              d="M130 55 L140 55 L145 70 L135 75 L130 70 Z"
              fill={theme.colors.secondary.lightGold}
              stroke={theme.colors.accent.burnishedGold}
              strokeWidth="1.5"
            />
            {/* Flame/streak icon */}
            <Path
              d="M50 140 C50 140 45 150 45 155 C45 165 52 172 60 172 C68 172 75 165 75 155 C75 150 70 140 70 140 C70 140 65 145 60 145 C55 145 50 140 50 140 Z"
              fill={theme.colors.secondary.warmTerracotta}
            />
            <Circle cx="60" cy="158" r="4" fill={theme.colors.success.celebratoryGold} />
            {/* XP badge */}
            <Circle cx="140" cy="155" r="25" fill={theme.colors.accent.rosyBlush} />
            <Text
              x="140"
              y="162"
              fontSize="18"
              fontWeight="700"
              fill={theme.colors.text.primary}
              textAnchor="middle"
            >
              XP
            </Text>
            {/* Upward arrow */}
            <Path
              d="M100 140 L100 170 M90 150 L100 140 L110 150"
              stroke={theme.colors.success.mutedOlive}
              strokeWidth="3"
              fill="none"
            />
          </G>
        </Svg>
      ),
    },
  ];

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const step = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentStep(step);
  };

  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      scrollViewRef.current?.scrollTo({
        x: nextStep * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentStep(nextStep);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    logger.log('[OnboardingScreen] Skipped onboarding');
    onComplete();
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    logger.log('[OnboardingScreen] Completed onboarding');
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Scrollable steps */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              {step.illustration}
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              {/* Decorative top border */}
              <View style={styles.decorativeBorder}>
                <Svg width="100%" height="4" viewBox="0 0 300 4">
                  <Path
                    d="M0 2 Q75 0 150 2 Q225 4 300 2"
                    stroke={theme.colors.secondary.lightGold}
                    strokeWidth="2"
                    fill="none"
                  />
                </Svg>
              </View>

              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom section: Dots + Button */}
      <View style={styles.bottomSection}>
        {/* Page indicators */}
        <View style={styles.dotsContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentStep === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started button */}
        <TouchableOpacity
          style={styles.button}
          onPress={goToNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Decorative footer */}
      <View style={styles.decorativeFooter}>
        <Svg width="100%" height="30" viewBox="0 0 300 30">
          <Path
            d="M20 15 Q150 5 280 15"
            stroke={theme.colors.secondary.lightGold}
            strokeWidth="1.5"
            fill="none"
          />
        </Svg>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  skipText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width: SCREEN_WIDTH,
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.screen.horizontal,
    alignItems: 'center',
  },
  illustrationContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  decorativeBorder: {
    width: '60%',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.ui.title.fontSize,
    lineHeight: theme.typography.ui.title.lineHeight,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.ui.body.fontSize,
    lineHeight: theme.typography.ui.body.lineHeight,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary.mutedStone,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.secondary.lightGold,
  },
  button: {
    backgroundColor: theme.colors.secondary.lightGold,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl * 2,
    borderRadius: theme.borderRadius.md,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  decorativeFooter: {
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
  },
});

export default OnboardingScreen;
