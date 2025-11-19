logger.log('[HomeScreen] Module loading...');

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BibleCompanion, Button, Card, VerseText, VerseReference } from '../components';
import { AchievementsModal } from '../components/AchievementsModal';
import { AchievementUnlockNotification } from '../components/AchievementUnlockNotification';
import { theme } from '../theme';
import Svg, { Path } from 'react-native-svg';
import { verseService } from '../services/verseService';
import { getTodaysDailyVerse } from '../services/dailyVerseService';
import { Verse } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { loadTodaysTasks, completeTask, DailyTaskId } from '../services/dailyTasksService';
import { achievementsService, Achievement } from '../services/achievementsService';
import { readingProgressService } from '../services/readingProgressService';
import { practiceStatsService } from '../services/practiceStatsService';
import { memorizationService } from '../services/memorizationService';

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
  const [dailyTasksCompletion, setDailyTasksCompletion] = useState<Record<DailyTaskId, boolean>>({
    verse: false,
    practice: false,
    understand: false,
    chapter: false,
    review: false,
  });

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  // Get real stats from profile
  const streak = profile?.current_streak || 0;
  const xp = profile?.total_xp || 0;
  const [versesLearned, setVersesLearned] = useState(0);

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

  // Load today's verse and daily tasks on mount
  useEffect(() => {
    loadTodayVerse();
    loadDailyTasks();
    loadAchievements();
  }, [profile]);

  const loadDailyTasks = async () => {
    const tasks = await loadTodaysTasks();
    setDailyTasksCompletion(tasks);
  };

  const loadAchievements = async () => {
    try {
      // Get stats from various sources
      const readingStats = await readingProgressService.getReadingStats();
      const practiceStats = await practiceStatsService.getPracticeStats();
      const memorizedCount = await memorizationService.getMemorizedCount(user?.id || null);

      // Update verses learned state
      setVersesLearned(memorizedCount);

      const stats = {
        versesLearned: memorizedCount,
        currentStreak: profile?.current_streak || 0,
        currentLevel: currentLevel,
        practiceSessionsCompleted: practiceStats.totalSessionsCompleted,
        chaptersRead: readingStats.totalChaptersRead,
      };

      // Load all achievements with current progress
      const allAchievements = await achievementsService.getAchievements(stats);
      setAchievements(allAchievements);

      // Check for newly unlocked achievements
      const newlyUnlocked = await achievementsService.checkForNewAchievements(stats);
      if (newlyUnlocked.length > 0) {
        // Show notification for the first newly unlocked achievement
        setUnlockedAchievement(newlyUnlocked[0]);
      }
    } catch (error) {
      logger.error('[HomeScreen] Error loading achievements:', error);
    }
  };

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

  const handleShareVerse = async (verse: Verse) => {
    try {
      const shareMessage = `"${verse.text}"\n\n— ${verse.book} ${verse.chapter}:${verse.verse_number} (KJV)`;

      await Share.share({
        message: shareMessage,
      });

      logger.log('[HomeScreen] Verse shared successfully');
    } catch (error) {
      logger.error('[HomeScreen] Error sharing verse:', error);
    }
  };

  // Daily checklist tasks (free user-friendly, no premium features)
  const dailyTasks = [
    { id: 'verse' as DailyTaskId, icon: '📖', label: 'Read today\'s verse', completed: dailyTasksCompletion.verse },
    { id: 'practice' as DailyTaskId, icon: '🎯', label: 'Practice a verse', completed: dailyTasksCompletion.practice },
    { id: 'understand' as DailyTaskId, icon: '💡', label: 'Understand a verse', completed: dailyTasksCompletion.understand },
    { id: 'chapter' as DailyTaskId, icon: '📚', label: 'Read 1 Bible chapter', completed: dailyTasksCompletion.chapter },
    { id: 'review' as DailyTaskId, icon: '🔄', label: 'Review learned verses', completed: dailyTasksCompletion.review },
  ];

  // Handle clicking on a daily task goal
  const handleTaskClick = async (taskId: DailyTaskId, isCompleted: boolean) => {
    // Don't do anything if already completed
    if (isCompleted) return;

    // Map task IDs to navigation actions
    const taskActions: Record<DailyTaskId, () => void> = {
      verse: () => {
        // Scroll to today's verse (already visible on this screen)
        // Or navigate to daily verse if on different screen
      },
      practice: () => {
        if (!user) {
          Alert.alert(
            'Account Required',
            'This action requires an account to save your progress. Please sign in or create an account.',
            [{ text: 'OK' }]
          );
          return;
        }
        navigation.navigate('Practice');
      },
      understand: () => {
        if (!user) {
          Alert.alert(
            'Account Required',
            'This action requires an account to save your progress. Please sign in or create an account.',
            [{ text: 'OK' }]
          );
          return;
        }
        if (todayVerse?.id) {
          navigation.navigate('Understand', { verseId: todayVerse.id });
        }
      },
      chapter: () => {
        if (!user) {
          Alert.alert(
            'Account Required',
            'This action requires an account to save your reading progress. Please sign in or create an account.',
            [{ text: 'OK' }]
          );
          return;
        }
        navigation.navigate('Bible');
      },
      review: () => {
        if (!user) {
          Alert.alert(
            'Account Required',
            'This action requires an account to save your progress. Please sign in or create an account.',
            [{ text: 'OK' }]
          );
          return;
        }
        navigation.navigate('Review');
      },
    };

    // Execute the action for this task
    taskActions[taskId]();
  };

  const actionButtons = [
    {
      id: 'read',
      title: 'Read',
      icon: 'book',
      description: 'Read the Bible',
      onPress: () => {
        navigation.navigate('Bible');
      },
    },
    {
      id: 'understand',
      title: 'Understand',
      icon: 'lightbulb',
      description: 'Learn the context',
      onPress: async () => {
        if (todayVerse?.id) {
          await completeTask('understand');
          await loadDailyTasks(); // Refresh the UI
          navigation.navigate('Understand', { verseId: todayVerse.id });
        }
      },
    },
    {
      id: 'review',
      title: 'Review',
      icon: 'refresh',
      description: 'Review learned verses',
      onPress: async () => {
        await completeTask('review');
        await loadDailyTasks(); // Refresh the UI
        navigation.navigate('Review');
      },
    },
    {
      id: 'practice',
      title: 'Practice',
      icon: 'brain',
      description: 'Recall & recite verses',
      onPress: async () => {
        await completeTask('practice');
        await loadDailyTasks(); // Refresh the UI
        navigation.navigate('Practice');
      },
    },
    {
      id: 'pray',
      title: 'Pray',
      icon: 'heart',
      description: 'Prayer training',
      onPress: () => {
        // Note: Pray is not tracked in daily tasks for free users
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
        {/* Simple Header */}
        <View style={styles.simpleHeader}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            {streak > 0 && (
              <View style={styles.miniStats}>
                <Svg width="14" height="14" viewBox="0 0 16 20">
                  <Path
                    d="M8 0 C8 0 4 5 4 9 C4 12.3 5.8 15 8 15 C10.2 15 12 12.3 12 9 C12 5 8 0 8 0 Z"
                    fill={theme.colors.secondary.warmTerracotta}
                  />
                </Svg>
                <Text style={styles.miniStatText}>{streak} day streak · Level {currentLevel}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleCompanionPress}>
            <BibleCompanion
              streak={streak}
              xp={xp}
              isCelebrating={isCelebrating}
              onPress={() => {}}
              size={50}
            />
          </TouchableOpacity>
        </View>

        {/* TODAY'S VERSE - Hero Position - Tap to see context */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            if (todayVerse?.id) {
              await completeTask('verse');
              await loadDailyTasks();
              navigation.navigate('Understand', { verseId: todayVerse.id });
            }
          }}
          disabled={isLoading || !!error || !todayVerse}
        >
          <Card variant="cream" outlined style={styles.heroVerseCard}>
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
                <View style={styles.verseCardFooter}>
                  <Text style={styles.tapHint}>Tap to understand this verse</Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleShareVerse(todayVerse);
                    }}
                    style={styles.shareButton}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24">
                      <Path
                        d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z"
                        fill={theme.colors.secondary.lightGold}
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </Card>
        </TouchableOpacity>

        {/* Quick Actions - Full Width List (calmer vibe) */}
        <View style={styles.actionsContainer}>
          {actionButtons.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                index === actionButtons.length - 1 && styles.actionButtonLast
              ]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.actionButtonContent}>
                <View style={[styles.actionIconContainer, { backgroundColor: getActionColor(action.id) }]}>
                  {renderActionIcon(action.icon)}
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Checklist - Simple & Clean */}
        <Card variant="parchment" outlined style={styles.dailyChecklistCard}>
          <Text style={styles.checklistTitle}>Today's Spiritual Goals</Text>
          <Text style={styles.checklistSubtitle}>Complete these to build your faith daily</Text>

          {dailyTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.checklistItem}
              onPress={() => handleTaskClick(task.id, task.completed)}
              disabled={task.completed}
            >
              <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                {task.completed && (
                  <Svg width="12" height="12" viewBox="0 0 12 12">
                    <Path
                      d="M2 6 L5 9 L10 3"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </View>
              <Text style={[styles.checklistLabel, task.completed && styles.checklistLabelCompleted]}>
                {task.icon} {task.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Your Progress - Only visible when logged in - Moved to bottom */}
        {user && (
          <Card variant="parchment" outlined style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <TouchableOpacity
                onPress={() => setShowAchievementsModal(true)}
                style={styles.achievementsButton}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24">
                  <Path
                    d="M12 2L15 9L22 9L17 14L19 21L12 17L5 21L7 14L2 9L9 9Z"
                    fill={theme.colors.secondary.lightGold}
                  />
                </Svg>
                <Text style={styles.achievementsButtonText}>
                  {achievements.filter(a => a.unlocked).length}/{achievements.length}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressStatsRow}>
              {/* Verses Memorized */}
              <View style={styles.progressStat}>
                <View style={styles.progressStatIconContainer}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2ZM9 4H11V9L10 8.25L9 9V4ZM18 20H6V4H7V13L10 10.75L13 13V4H18V20Z"
                      fill={theme.colors.secondary.lightGold}
                    />
                  </Svg>
                </View>
                <Text style={styles.progressStatValue}>{versesLearned}</Text>
                <Text style={styles.progressStatLabel}>Verses{'\n'}Memorized</Text>
              </View>

              {/* Current Streak */}
              <View style={styles.progressStat}>
                <View style={styles.progressStatIconContainer}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M12 2C12 2 8 6 8 10C8 13.31 10.69 16 14 16C17.31 16 20 13.31 20 10C20 6 16 2 16 2C16 2 14.5 4.5 14 7C13.5 4.5 12 2 12 2ZM14 14C11.79 14 10 12.21 10 10C10 8.5 10.67 7.25 11.5 6.25C11.5 9.25 13.25 11.5 15 13C14.67 13.66 14.37 14 14 14Z"
                      fill={theme.colors.secondary.warmTerracotta}
                    />
                  </Svg>
                </View>
                <Text style={styles.progressStatValue}>{streak}</Text>
                <Text style={styles.progressStatLabel}>Day{'\n'}Streak</Text>
              </View>

              {/* Total XP */}
              <View style={styles.progressStat}>
                <View style={styles.progressStatIconContainer}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M12 2L15 9L22 9L17 14L19 21L12 17L5 21L7 14L2 9L9 9Z"
                      fill={theme.colors.success.celebratoryGold}
                    />
                  </Svg>
                </View>
                <Text style={styles.progressStatValue}>{xp}</Text>
                <Text style={styles.progressStatLabel}>Total{'\n'}XP</Text>
              </View>
            </View>

            {/* Level Progress Bar */}
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelProgressHeader}>
                <Text style={styles.levelProgressLabel}>Level {currentLevel}</Text>
                <Text style={styles.levelProgressXP}>{xpToNextLevel} XP to Level {currentLevel + 1}</Text>
              </View>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, { width: `${Math.min(levelProgress, 100)}%` }]} />
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Achievements Modal */}
      <AchievementsModal
        visible={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        achievements={achievements}
      />

      {/* Achievement Unlock Notification */}
      <AchievementUnlockNotification
        achievement={unlockedAchievement}
        onDismiss={() => setUnlockedAchievement(null)}
      />
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
  // NEW: Simple Header
  simpleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  miniStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  miniStatText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  // Hero Verse Card
  heroVerseCard: {
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
    minHeight: 180,
  },
  verseLabel: {
    fontSize: 12,
    fontWeight: '700',
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
  tapHint: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    fontStyle: 'italic',
    flex: 1,
  },
  verseCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  shareButton: {
    padding: theme.spacing.xs,
  },
  // Progress Card
  progressCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  achievementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
  },
  achievementsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.lightCream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
  },
  progressStatLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 14,
  },
  levelProgressContainer: {
    marginTop: theme.spacing.sm,
  },
  levelProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  levelProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  levelProgressXP: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.success.celebratoryGold,
    borderRadius: 4,
  },
  // Daily Checklist
  dailyChecklistCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 4,
  },
  checklistSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.oatmeal,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary.mutedStone,
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: theme.colors.success.celebratoryGold,
    borderColor: theme.colors.success.celebratoryGold,
  },
  checklistLabel: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    flex: 1,
  },
  checklistLabelCompleted: {
    color: theme.colors.text.tertiary,
    textDecorationLine: 'line-through' as const,
  },
  // Quick Actions - Full Width List
  actionsContainer: {
    marginBottom: theme.spacing.lg,
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
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fonts.ui.default,
  },
  actionDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  // Loading & Error States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
});

logger.log('[HomeScreen] Styles created');
logger.log('[HomeScreen] Exporting HomeScreen...');

export default HomeScreen;

logger.log('[HomeScreen] Module loaded successfully!');
