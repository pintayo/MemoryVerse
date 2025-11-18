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
    review: theme.colors.primary.sageGreen,
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
});

logger.log('[HomeScreen] Styles created');
logger.log('[HomeScreen] Exporting HomeScreen...');

export default HomeScreen;

logger.log('[HomeScreen] Module loaded successfully!');
