import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Card } from '../components';
import { theme } from '../theme';
import { spacedRepetitionService, ReviewVerse, ReviewStats } from '../services/spacedRepetitionService';
import { practiceService } from '../services/practiceService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

interface ReviewScreenProps {
  navigation: any;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ navigation }) => {
  const { user, profile } = useAuth();
  const [reviewsByUrgency, setReviewsByUrgency] = useState<{
    overdue: ReviewVerse[];
    dueToday: ReviewVerse[];
    dueSoon: ReviewVerse[];
  }>({ overdue: [], dueToday: [], dueSoon: [] });
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const [reviews, reviewStats] = await Promise.all([
        spacedRepetitionService.getReviewsByUrgency(user.id),
        spacedRepetitionService.getReviewStats(user.id),
      ]);

      setReviewsByUrgency(reviews);
      setStats(reviewStats);
    } catch (error) {
      logger.error('[ReviewScreen] Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReviews();
    setIsRefreshing(false);
  };

  const handleReviewVerse = (verse: ReviewVerse) => {
    // Randomly select a practice mode based on user level
    const userLevel = profile?.level || 1;
    const mode = practiceService.selectModeForUser(userLevel);

    // Navigate to the selected mode
    if (mode === 'recall') {
      navigation.navigate('Recall', { verseId: verse.id });
    } else if (mode === 'fill-in-blanks') {
      navigation.navigate('FillInBlanks', {});
    } else if (mode === 'multiple-choice') {
      navigation.navigate('MultipleChoice', {});
    }
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <Card variant="cream" elevated style={styles.statsCard}>
        <Text style={styles.statsTitle}>Review Progress</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Svg width="40" height="40" viewBox="0 0 40 40">
              <Circle cx="20" cy="20" r="18" fill={theme.colors.secondary.warmTerracotta} opacity="0.2" />
              <Path
                d="M20 8 L20 22 L28 22"
                stroke={theme.colors.secondary.warmTerracotta}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.statValue}>{stats.dueToday}</Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </View>

          <View style={styles.statItem}>
            <Svg width="40" height="40" viewBox="0 0 40 40">
              <Circle cx="20" cy="20" r="18" fill={theme.colors.secondary.lightGold} opacity="0.2" />
              <Path
                d="M15 20 L18 23 L25 16"
                stroke={theme.colors.accent.burnishedGold}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
            <Text style={styles.statValue}>{stats.reviewing}</Text>
            <Text style={styles.statLabel}>Reviewing</Text>
          </View>

          <View style={styles.statItem}>
            <Svg width="40" height="40" viewBox="0 0 40 40">
              <Circle cx="20" cy="20" r="18" fill={theme.colors.success.celebratoryGold} opacity="0.2" />
              <Path
                d="M20 10 L23 17 L30 17 L24 22 L26 30 L20 25 L14 30 L16 22 L10 17 L17 17 Z"
                fill={theme.colors.success.celebratoryGold}
              />
            </Svg>
            <Text style={styles.statValue}>{stats.mastered}</Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
        </View>

        <View style={styles.statsFooter}>
          <Text style={styles.statsFooterText}>
            {stats.dueThisWeek} verses due this week
          </Text>
        </View>
      </Card>
    );
  };

  const renderVerseCard = (verse: ReviewVerse, urgency: 'overdue' | 'today' | 'soon') => {
    const urgencyColors = {
      overdue: theme.colors.secondary.warmTerracotta,
      today: theme.colors.secondary.lightGold,
      soon: theme.colors.primary.mutedStone,
    };

    const statusIcons = {
      learning: '📖',
      reviewing: '🔄',
      mastered: '⭐',
    };

    return (
      <TouchableOpacity
        key={verse.id}
        onPress={() => handleReviewVerse(verse)}
        activeOpacity={0.8}
      >
        <Card variant="cream" style={styles.verseCard}>
          {/* Urgency indicator */}
          <View style={[styles.urgencyBar, { backgroundColor: urgencyColors[urgency] }]} />

          {/* Content */}
          <View style={styles.verseContent}>
            {/* Header */}
            <View style={styles.verseHeader}>
              <Text style={styles.verseReference}>
                {verse.book} {verse.chapter}:{verse.verse_number}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusIcon}>{statusIcons[verse.status]}</Text>
                <Text style={styles.statusText}>{verse.status}</Text>
              </View>
            </View>

            {/* Verse text preview */}
            <Text style={styles.verseText} numberOfLines={2}>
              {verse.text}
            </Text>

            {/* Stats */}
            <View style={styles.verseStats}>
              <View style={styles.verseStatItem}>
                <Svg width="16" height="16" viewBox="0 0 24 24">
                  <Path
                    d="M12 2 L15 9 L22 9 L16 14 L18 22 L12 17 L6 22 L8 14 L2 9 L9 9 Z"
                    fill={theme.colors.secondary.lightGold}
                  />
                </Svg>
                <Text style={styles.verseStatText}>
                  {Math.round(verse.accuracy_score * 100)}%
                </Text>
              </View>

              <View style={styles.verseStatItem}>
                <Svg width="16" height="16" viewBox="0 0 24 24">
                  <Path
                    d="M4 20 L8 20 L8 14 L4 14 Z M10 20 L14 20 L14 10 L10 10 Z M16 20 L20 20 L20 16 L16 16 Z"
                    fill={theme.colors.text.tertiary}
                  />
                </Svg>
                <Text style={styles.verseStatText}>
                  {verse.attempts} attempts
                </Text>
              </View>

              {verse.days_until_review < 0 && (
                <View style={[styles.verseStatItem, styles.overdueTag]}>
                  <Text style={styles.overdueText}>
                    {Math.abs(verse.days_until_review)}d overdue
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Review button */}
          <View style={styles.reviewButtonContainer}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M8 5 L16 12 L8 19 Z"
                fill={theme.colors.text.secondary}
              />
            </Svg>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSection = (
    title: string,
    verses: ReviewVerse[],
    urgency: 'overdue' | 'today' | 'soon',
    icon: React.ReactNode
  ) => {
    if (verses.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {icon}
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{verses.length}</Text>
          </View>
        </View>

        <View style={styles.versesContainer}>
          {verses.map((verse) => renderVerseCard(verse, urgency))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </View>
    );
  }

  const totalReviews = reviewsByUrgency.overdue.length + reviewsByUrgency.dueToday.length + reviewsByUrgency.dueSoon.length;

  return (
    <View style={styles.container}>
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {renderStatsCard()}

        {totalReviews === 0 ? (
          <View style={styles.emptyContainer}>
            <Svg width="100" height="100" viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="40" fill={theme.colors.success.celebratoryGold} opacity="0.2" />
              <Path
                d="M35 50 L45 60 L65 35"
                stroke={theme.colors.success.celebratoryGold}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
            <Text style={styles.emptyText}>All Caught Up!</Text>
            <Text style={styles.emptySubtext}>
              No verses due for review right now. Great job staying on top of your studies!
            </Text>
          </View>
        ) : (
          <>
            {renderSection(
              'Overdue',
              reviewsByUrgency.overdue,
              'overdue',
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 2 C6.48 2 2 6.48 2 12 C2 17.52 6.48 22 12 22 C17.52 22 22 17.52 22 12 C22 6.48 17.52 2 12 2 Z M13 13 L9 13 L9 7 L13 7 L13 13 Z"
                  fill={theme.colors.secondary.warmTerracotta}
                />
              </Svg>
            )}

            {renderSection(
              'Due Today',
              reviewsByUrgency.dueToday,
              'today',
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 2 C6.48 2 2 6.48 2 12 C2 17.52 6.48 22 12 22 C17.52 22 22 17.52 22 12 C22 6.48 17.52 2 12 2 Z M12 6 L12 12 L16 14 L12 12 Z"
                  fill={theme.colors.secondary.lightGold}
                />
              </Svg>
            )}

            {renderSection(
              'Coming Soon',
              reviewsByUrgency.dueSoon,
              'soon',
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  stroke={theme.colors.primary.mutedStone}
                  strokeWidth="2"
                  fill="none"
                />
                <Path d="M3 10 L21 10" stroke={theme.colors.primary.mutedStone} strokeWidth="2" />
                <Path d="M8 2 L8 6" stroke={theme.colors.primary.mutedStone} strokeWidth="2" />
                <Path d="M16 2 L16 6" stroke={theme.colors.primary.mutedStone} strokeWidth="2" />
              </Svg>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  header: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.ui.title.fontSize,
    lineHeight: theme.typography.ui.title.lineHeight,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  subtitle: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingBottom: theme.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  statLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  statsFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary.mutedStone,
    paddingTop: theme.spacing.sm,
  },
  statsFooterText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    flex: 1,
  },
  countBadge: {
    backgroundColor: theme.colors.secondary.lightGold,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  versesContainer: {
    gap: theme.spacing.md,
  },
  verseCard: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  urgencyBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  verseContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  verseReference: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.background.warmParchment,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textTransform: 'capitalize',
  },
  verseText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  verseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  verseStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verseStatText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  overdueTag: {
    backgroundColor: theme.colors.secondary.warmTerracotta,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  overdueText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '700',
  },
  reviewButtonContainer: {
    justifyContent: 'center',
    paddingRight: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
});

export default ReviewScreen;
