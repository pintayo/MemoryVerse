logger.log('[HomeScreen] Module loading...');

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BibleCompanion, Button, Card, VerseText, VerseReference } from '../components';
import { theme } from '../theme';
import Svg, { Path } from 'react-native-svg';
import { verseService } from '../services/verseService';
import { getTodaysDailyVerse } from '../services/dailyVerseService';
import { Verse } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

logger.log('[HomeScreen] All imports complete');

logger.log('[HomeScreen] Defining interface...');

interface HomeScreenProps {
  navigation: any;
}

logger.log('[HomeScreen] Defining component...');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, profile } = useAuth();
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [todayVerse, setTodayVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get real stats from profile
  const streak = profile?.current_streak || 0;
  const xp = profile?.total_xp || 0;
  const versesLearned = profile?.verses_memorized || 0;

  // Calculate level and XP progress
  const currentLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const levelProgress = (xpInCurrentLevel / xpNeededForLevel) * 100;
  const xpToNextLevel = xpForNextLevel - xp;

  // Daily goal tracking (assume goal is 5 verses per day)
  const DAILY_GOAL = 5;
  const [versesToday, setVersesToday] = useState(0); // TODO: Track from practice sessions today
  const dailyGoalProgress = (versesToday / DAILY_GOAL) * 100;

  // Check if user practiced today for streak protection
  const lastPracticeDate = profile?.last_practice_date;
  const today = new Date().toDateString();
  const practicedToday = lastPracticeDate && new Date(lastPracticeDate).toDateString() === today;

  // Load today's verse on mount
  useEffect(() => {
    loadTodayVerse();
  }, []);

  const loadTodayVerse = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get today's verse - synchronized for all users
      const verse = await getTodaysDailyVerse('KJV');

      if (verse) {
        setTodayVerse(verse);
      } else {
        setError('No verses found. Please import Bible data.');
      }
    } catch (err) {
      logger.error('[HomeScreen] Error loading verse:', err);
      setError('Failed to load verse. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanionPress = () => {
    setIsCelebrating(true);
    setTimeout(() => setIsCelebrating(false), 2000);

    // Show encouragement or tips based on streak
    const messages = [
      {
        title: "Keep Going! 🌟",
        message: `You're on a ${streak}-day streak! Remember: "Thy word have I hid in mine heart, that I might not sin against thee." - Psalm 119:11`
      },
      {
        title: "Scripture Tip 💡",
        message: "Try practicing your verses at the same time each day. Consistency builds strong memory and spiritual discipline!"
      },
      {
        title: "You're Amazing! ✨",
        message: `${xp} XP earned so far! Every verse you memorize is a treasure stored in your heart.`
      },
      {
        title: "Prayer Time 🙏",
        message: "After memorizing, try praying the verse back to God. It deepens understanding and makes the Word come alive!"
      },
      {
        title: "Share the Word 📖",
        message: "Challenge: Share a verse you've learned with someone today. Teaching others helps solidify your own memory!"
      }
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    Alert.alert(
      randomMessage.title,
      randomMessage.message,
      [{ text: "Amen!", style: "default" }]
    );
  };

  const actionButtons = [
    {
      id: 'read',
      title: 'Read',
      icon: 'book',
      description: 'Read today\'s verse',
      onPress: () => {
        if (todayVerse) {
          navigation.navigate('VerseCard');
        }
      },
    },
    {
      id: 'understand',
      title: 'Understand',
      icon: 'lightbulb',
      description: 'Learn the context',
      onPress: () => {
        if (todayVerse?.id) {
          navigation.navigate('Understand', { verseId: todayVerse.id });
        }
      },
    },
    {
      id: 'review',
      title: 'Review',
      icon: 'refresh',
      description: 'Review learned verses',
      onPress: () => {
        navigation.navigate('Review');
      },
    },
    {
      id: 'practice',
      title: 'Practice',
      icon: 'brain',
      description: 'Recall & recite verses',
      onPress: () => {
        navigation.navigate('Practice');
      },
    },
    {
      id: 'pray',
      title: 'Pray',
      icon: 'heart',
      description: 'Prayer training',
      onPress: () => {
        if (todayVerse?.id) {
          navigation.navigate('Pray', { verseId: todayVerse.id });
        }
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Bible Companion */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good morning!</Text>
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => navigation.navigate('StreakCalendar')}
                activeOpacity={0.7}
              >
                <Svg width="20" height="24" viewBox="0 0 16 20">
                  <Path
                    d="M8 0 C8 0 4 5 4 9 C4 12.3 5.8 15 8 15 C10.2 15 12 12.3 12 9 C12 5 8 0 8 0 Z"
                    fill={theme.colors.secondary.warmTerracotta}
                  />
                  <Path
                    d="M8 4 C8 4 6 7 6 9 C6 10.7 7 12 8 12 C9 12 10 10.7 10 9 C10 7 8 4 8 4 Z"
                    fill={theme.colors.success.celebratoryGold}
                  />
                </Svg>
                <Text style={styles.statText}>{streak} day streak</Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Svg width="20" height="20" viewBox="0 0 20 20">
                  <Path
                    d="M10 2 L12 8 L18 8 L13 12 L15 18 L10 14 L5 18 L7 12 L2 8 L8 8 Z"
                    fill={theme.colors.success.celebratoryGold}
                  />
                </Svg>
                <Text style={styles.statText}>{xp} XP</Text>
              </View>
            </View>
          </View>
          <View style={styles.companionContainer}>
            <BibleCompanion
              streak={streak}
              xp={xp}
              isCelebrating={isCelebrating}
              onPress={handleCompanionPress}
            />
          </View>
        </View>

        {/* Streak Urgency Banner - Show if haven't practiced today */}
        {!practicedToday && streak > 0 && (
          <TouchableOpacity
            style={styles.streakUrgencyBanner}
            onPress={() => navigation.navigate('Practice')}
            activeOpacity={0.8}
          >
            <View style={styles.streakUrgencyContent}>
              <View style={styles.streakUrgencyLeft}>
                <Svg width="32" height="32" viewBox="0 0 24 24">
                  <Path
                    d="M12 2C12 2 7 8 7 13C7 17.42 9.58 21 12 21C14.42 21 17 17.42 17 13C17 8 12 2 12 2Z"
                    fill={theme.colors.secondary.warmTerracotta}
                  />
                  <Path
                    d="M12 6C12 6 9 10 9 13C9 15.21 10.34 17 12 17C13.66 17 15 15.21 15 13C15 10 12 6 12 6Z"
                    fill={theme.colors.success.celebratoryGold}
                  />
                </Svg>
                <View style={styles.streakUrgencyText}>
                  <Text style={styles.streakUrgencyTitle}>Protect Your {streak}-Day Streak! 🔥</Text>
                  <Text style={styles.streakUrgencySubtitle}>
                    "Train yourself to be godly" - 1 Timothy 4:7
                  </Text>
                </View>
              </View>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M9 6 L15 12 L9 18"
                  stroke="white"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </TouchableOpacity>
        )}

        {/* XP Progress to Next Level */}
        <Card variant="warm" style={styles.xpProgressCard}>
          <View style={styles.xpProgressHeader}>
            <View style={styles.xpProgressInfo}>
              <Text style={styles.xpProgressLevel}>LEVEL {currentLevel}</Text>
              <Text style={styles.xpProgressNext}>{xpToNextLevel} XP to Level {currentLevel + 1}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Svg width="28" height="28" viewBox="0 0 24 24">
                <Path
                  d="M12 2L15 9L22 9L17 14L19 21L12 17L5 21L7 14L2 9L9 9Z"
                  fill={theme.colors.success.celebratoryGold}
                />
              </Svg>
            </View>
          </View>
          <View style={styles.xpProgressBarContainer}>
            <View style={[styles.xpProgressBarFill, { width: `${Math.min(levelProgress, 100)}%` }]} />
          </View>
          <Text style={styles.xpProgressText}>
            Keep going! Every verse brings you closer to spiritual mastery 📖
          </Text>
        </Card>

        {/* Daily Goal Widget */}
        <Card variant="parchment" outlined style={styles.dailyGoalCard}>
          <View style={styles.dailyGoalHeader}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M12 2C12 2 4 6 4 12C4 18 12 22 12 22C12 22 20 18 20 12C20 6 12 2 12 2Z"
                fill={theme.colors.accent.burnishedGold}
              />
              <Path
                d="M9 12L11 14L15 10"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.dailyGoalTitle}>Today's Spiritual Goal</Text>
          </View>
          <View style={styles.dailyGoalContent}>
            <View style={styles.dailyGoalCircle}>
              <Svg width="80" height="80" viewBox="0 0 100 100">
                {/* Background circle */}
                <Path
                  d="M 50 10 A 40 40 0 1 1 49.99 10"
                  stroke={theme.colors.primary.oatmeal}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Progress circle */}
                <Path
                  d={`M 50 10 A 40 40 0 ${dailyGoalProgress > 50 ? 1 : 0} 1 ${
                    50 + 40 * Math.sin((dailyGoalProgress / 100) * 2 * Math.PI)
                  } ${
                    50 - 40 * Math.cos((dailyGoalProgress / 100) * 2 * Math.PI)
                  }`}
                  stroke={theme.colors.success.celebratoryGold}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.dailyGoalCircleText}>
                <Text style={styles.dailyGoalCount}>{versesToday}/{DAILY_GOAL}</Text>
              </View>
            </View>
            <View style={styles.dailyGoalRight}>
              <Text style={styles.dailyGoalVersesText}>
                {versesToday === 0 ? "Let's hide God's Word in your heart today! 💪" :
                 versesToday < DAILY_GOAL ? `Only ${DAILY_GOAL - versesToday} more verse${DAILY_GOAL - versesToday === 1 ? '' : 's'} to reach your goal! 🎯` :
                 "Goal crushed! You're building spiritual discipline! 🎉"}
              </Text>
              <Text style={styles.dailyGoalScripture}>
                "I have hidden your word in my heart" - Psalm 119:11
              </Text>
            </View>
          </View>
        </Card>

        {/* Story Mode Teaser - Coming Soon */}
        <Card variant="warm" style={styles.storyModeTeaser}>
          <View style={styles.storyModeHeader}>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>COMING SOON</Text>
            </View>
          </View>

          <View style={styles.storyModeContent}>
            <View style={styles.storyModeIllustration}>
              {/* Jesus placeholder illustration - beautiful golden cross */}
              <Svg width="80" height="80" viewBox="0 0 80 80">
                {/* Radiant background */}
                <Path
                  d="M40 10 L42 38 L70 40 L42 42 L40 70 L38 42 L10 40 L38 38 Z"
                  fill={theme.colors.success.celebratoryGold}
                  opacity="0.3"
                />
                {/* Cross */}
                <Path
                  d="M35 20 L45 20 L45 35 L60 35 L60 45 L45 45 L45 60 L35 60 L35 45 L20 45 L20 35 L35 35 Z"
                  fill={theme.colors.success.celebratoryGold}
                />
                {/* Crown of thorns circle */}
                <Path
                  d="M40 15 A 15 15 0 1 1 39.99 15"
                  stroke={theme.colors.secondary.warmTerracotta}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="2,3"
                />
              </Svg>
            </View>

            <View style={styles.storyModeText}>
              <Text style={styles.storyModeTitle}>Story Mode</Text>
              <Text style={styles.storyModeSubtitle}>Season 1: The Life of Jesus</Text>
              <Text style={styles.storyModeDescription}>
                Experience the Gospel through interactive stories with beautiful animations.
                Make choices, answer questions, and walk in Jesus' footsteps.
              </Text>
            </View>
          </View>

          <View style={styles.storyModeFeatures}>
            <View style={styles.featureItem}>
              <Svg width="16" height="16" viewBox="0 0 16 16">
                <Path d="M8 2L10 6L14 6L11 9L12 13L8 11L4 13L5 9L2 6L6 6Z" fill={theme.colors.success.celebratoryGold} />
              </Svg>
              <Text style={styles.featureText}>5 Episodes Weekly</Text>
            </View>
            <View style={styles.featureItem}>
              <Svg width="16" height="16" viewBox="0 0 16 16">
                <Path d="M8 2L10 6L14 6L11 9L12 13L8 11L4 13L5 9L2 6L6 6Z" fill={theme.colors.success.celebratoryGold} />
              </Svg>
              <Text style={styles.featureText}>Interactive Quizzes</Text>
            </View>
            <View style={styles.featureItem}>
              <Svg width="16" height="16" viewBox="0 0 16 16">
                <Path d="M8 2L10 6L14 6L11 9L12 13L8 11L4 13L5 9L2 6L6 6Z" fill={theme.colors.success.celebratoryGold} />
              </Svg>
              <Text style={styles.featureText}>Animated Scenes</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notifyMeButton}
            onPress={() => {
              Alert.alert(
                "You're on the list! 🎉",
                "We'll notify you as soon as Story Mode launches. Get ready to experience the Bible like never before!",
                [{ text: "Amen!", style: "default" }]
              );
              // TODO: Track interest in analytics
              logger.log('[HomeScreen] User interested in Story Mode');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.notifyMeButtonText}>Notify Me When It Launches</Text>
            <Svg width="20" height="20" viewBox="0 0 20 20">
              <Path
                d="M10 2C10 2 4 5 4 10C4 15 10 18 10 18C10 18 16 15 16 10C16 5 10 2 10 2Z M8 10L9 11L12 8"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.storyModeLaunchHint}>
            Launching in 4-6 weeks • Stay tuned for weekly episodes
          </Text>
        </Card>

        {/* Today's Verse Card */}
        <Card variant="cream" outlined style={styles.verseCard}>
          <Text style={styles.verseLabel}>Today's Verse</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
              <Text style={styles.loadingText}>Loading verse...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadTodayVerse}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : todayVerse ? (
            <>
              <VerseText size="large" style={styles.verseText}>
                {todayVerse.text}
              </VerseText>
              <VerseReference style={styles.verseReference}>
                {`${todayVerse.book} ${todayVerse.chapter}:${todayVerse.verse_number}`}
              </VerseReference>
            </>
          ) : null}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {actionButtons.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                index === actionButtons.length - 1 && styles.actionButtonLast,
              ]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.actionButtonContent}>
                <View style={[
                  styles.actionIconContainer,
                  { backgroundColor: getActionColor(action.id) },
                ]}>
                  {renderActionIcon(action.icon)}
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Path
                    d="M9 6 L15 12 L9 18"
                    stroke={theme.colors.text.tertiary}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((versesLearned / 10) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{versesLearned} verses memorized</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

logger.log('[HomeScreen] Component defined successfully');

// Helper functions
logger.log('[HomeScreen] Defining helper functions...');

const getActionColor = (id: string): string => {
  const colors: { [key: string]: string } = {
    read: theme.colors.secondary.softClay,
    understand: theme.colors.secondary.lightGold,
    review: theme.colors.success.mutedOlive,
    practice: theme.colors.success.mutedOlive,
    pray: theme.colors.secondary.warmTerracotta,
  };
  return colors[id] || theme.colors.secondary.softClay;
};

const renderActionIcon = (iconName: string) => {
  const iconColor = theme.colors.text.onDark;

  switch (iconName) {
    case 'book':
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M4 19.5C4 18.12 5.12 17 6.5 17H20V3H6C4.34 3 3 4.34 3 6V20C3 21.66 4.34 23 6 23H20V21H6C5.45 21 5 20.55 5 20C5 19.45 5.45 19 6 19H20V19.5"
            fill={iconColor}
          />
        </Svg>
      );
    case 'lightbulb':
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M12 2C8.69 2 6 4.69 6 8C6 10.5 7.33 12.68 9.3 13.91V17C9.3 17.55 9.75 18 10.3 18H13.7C14.25 18 14.7 17.55 14.7 17V13.91C16.67 12.68 18 10.5 18 8C18 4.69 15.31 2 12 2ZM11 20V19H13V20H11ZM11 22V21H13V22H11Z"
            fill={iconColor}
          />
        </Svg>
      );
    case 'refresh':
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M12 6V9L16 5L12 1V4C7.58 4 4 7.58 4 12C4 13.57 4.46 15.03 5.24 16.26L6.7 14.8C6.25 13.97 6 13.01 6 12C6 8.69 8.69 6 12 6ZM18.76 7.74L17.3 9.2C17.75 10.03 18 10.99 18 12C18 15.31 15.31 18 12 18V15L8 19L12 23V20C16.42 20 20 16.42 20 12C20 10.43 19.54 8.97 18.76 7.74Z"
            fill={iconColor}
          />
        </Svg>
      );
    case 'brain':
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M21.33 12.91C21.42 14.46 20.71 15.95 19.44 16.86L19.33 16.94C18.98 17.18 18.59 17.36 18.18 17.46L18 17.5V18C18 19.1 17.1 20 16 20H15V21.5C15 21.78 14.78 22 14.5 22H10.5C10.22 22 10 21.78 10 21.5V20H9C7.9 20 7 19.1 7 18V17.5L6.82 17.46C5.67 17.17 4.7 16.36 4.18 15.27C3.71 14.26 3.68 13.09 4.09 12.06C4.29 11.54 4.58 11.07 4.96 10.68C4.74 10.05 4.62 9.37 4.62 8.68C4.62 5.83 6.95 3.5 9.8 3.5C10.15 3.5 10.49 3.54 10.82 3.6C11.74 2.61 13.08 2 14.56 2C17.26 2 19.44 4.18 19.44 6.88C19.44 7.12 19.42 7.36 19.39 7.59C20.99 8.3 22.08 9.95 21.33 12.91Z"
            fill={iconColor}
          />
        </Svg>
      );
    case 'mic':
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.91 11C17.91 14.39 15.2 17.18 11.91 17.49V21H10.91V17.49C7.62 17.18 4.91 14.39 4.91 11H6.91C6.91 13.76 9.15 16 11.91 16C14.67 16 16.91 13.76 16.91 11H17.91Z"
            fill={iconColor}
          />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path
            d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
            fill={iconColor}
          />
        </Svg>
      );
    default:
      return null;
  }
};

logger.log('[HomeScreen] Helper functions defined');
logger.log('[HomeScreen] Creating styles...');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.typography.ui.title.fontSize,
    lineHeight: theme.typography.ui.title.lineHeight,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontFamily: theme.typography.fonts.ui.default,
  },
  companionContainer: {
    marginLeft: theme.spacing.md,
  },
  verseCard: {
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    minHeight: 200,
  },
  verseLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.secondary.lightGold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fonts.ui.default,
  },
  verseText: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  verseReference: {
    marginTop: theme.spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.error.main,
    textAlign: 'center',
    fontFamily: theme.typography.fonts.ui.default,
    paddingHorizontal: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.secondary.lightGold,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  retryButtonText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
  actionsContainer: {
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  actionButtonLast: {
    marginBottom: 0,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fonts.ui.default,
  },
  actionDescription: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  progressSection: {
    marginTop: theme.spacing.lg,
  },
  progressTitle: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fonts.ui.default,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.primary.oatmeal,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success.mutedOlive,
    borderRadius: theme.borderRadius.sm,
  },
  progressText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  // Streak Urgency Banner
  streakUrgencyBanner: {
    backgroundColor: theme.colors.secondary.warmTerracotta,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  streakUrgencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakUrgencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  streakUrgencyText: {
    flex: 1,
  },
  streakUrgencyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
  },
  streakUrgencySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
  },
  // XP Progress Card
  xpProgressCard: {
    marginBottom: theme.spacing.md,
  },
  xpProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  xpProgressInfo: {
    flex: 1,
  },
  xpProgressLevel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
    letterSpacing: 1,
  },
  xpProgressNext: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.success.celebratoryGold + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpProgressBarContainer: {
    height: 10,
    backgroundColor: theme.colors.primary.oatmeal,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  xpProgressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.success.celebratoryGold,
    borderRadius: theme.borderRadius.full,
  },
  xpProgressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
  },
  // Daily Goal Card
  dailyGoalCard: {
    marginBottom: theme.spacing.lg,
  },
  dailyGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  dailyGoalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  dailyGoalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dailyGoalCircle: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyGoalCircleText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyGoalCount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  dailyGoalRight: {
    flex: 1,
  },
  dailyGoalVersesText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  dailyGoalScripture: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.scripture.default,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  // Story Mode Teaser
  storyModeTeaser: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background.lightCream,
    borderWidth: 2,
    borderColor: theme.colors.success.celebratoryGold + '40',
    ...theme.shadows.lg,
  },
  storyModeHeader: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.success.celebratoryGold,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1.5,
    fontFamily: theme.typography.fonts.ui.default,
  },
  storyModeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  storyModeIllustration: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  storyModeText: {
    flex: 1,
  },
  storyModeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  storyModeSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary.warmTerracotta,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  storyModeDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 18,
  },
  storyModeFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary.oatmeal,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  notifyMeButton: {
    backgroundColor: theme.colors.success.celebratoryGold,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
  },
  notifyMeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    fontFamily: theme.typography.fonts.ui.default,
  },
  storyModeLaunchHint: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

logger.log('[HomeScreen] Styles created');
logger.log('[HomeScreen] Exporting HomeScreen...');

export default HomeScreen;

logger.log('[HomeScreen] Module loaded successfully!');
