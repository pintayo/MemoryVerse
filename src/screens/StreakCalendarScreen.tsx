import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { Card } from '../components';
import { theme } from '../theme';
import { streakService, StreakData, DayActivity } from '../services/streakService';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useGuestProtection } from '../hooks/useGuestProtection';
import { logger } from '../utils/logger';

interface StreakCalendarScreenProps {
  navigation: any;
}

const StreakCalendarScreen: React.FC<StreakCalendarScreenProps> = ({ navigation }) => {
  const { user, profile, isGuest } = useAuth();
  const { guardAction, PromptComponent } = useGuestProtection();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Feature flag for streak freeze
  const canUseStreakFreeze = useFeatureFlag('streakFreeze');

  // Show prompt when guests view streak calendar
  useEffect(() => {
    if (isGuest) {
      guardAction('streaks');
    }
  }, [isGuest]);

  useEffect(() => {
    if (!isGuest) {
      loadStreakData();
    } else {
      setIsLoading(false);
    }
  }, [isGuest]);

  const loadStreakData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const data = await streakService.getStreakData(user.id, 90);
      setStreakData(data);
    } catch (error) {
      logger.error('[StreakCalendarScreen] Error loading streak data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreakFreeze = async () => {
    if (!user?.id) return;

    if (!profile?.is_premium) {
      Alert.alert(
        'Premium Feature',
        'Streak Freeze is a premium feature. Upgrade to protect your streak!',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!streakData?.freezeAvailable) {
      Alert.alert(
        'Freeze Not Available',
        'You can only use Streak Freeze once per week.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Use Streak Freeze?',
      'This will protect your streak for 1 day if you miss practice. You can use this once per week.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Freeze',
          onPress: async () => {
            const success = await streakService.useStreakFreeze(user.id);
            if (success) {
              Alert.alert('Success', 'Streak Freeze activated! Your streak is protected for today.');
              await loadStreakData();
            }
          },
        },
      ]
    );
  };

  const renderStreakHeader = () => {
    if (!streakData) return null;

    return (
      <Card variant="cream" elevated style={styles.headerCard}>
        {/* Flame decoration */}
        <View style={styles.flameContainer}>
          <Svg width="80" height="100" viewBox="0 0 80 100">
            <Path
              d="M40 10 C40 10 30 30 30 45 C30 60 35 75 40 75 C45 75 50 60 50 45 C50 30 40 10 40 10 Z"
              fill={theme.colors.secondary.warmTerracotta}
            />
            <Path
              d="M40 25 C40 25 35 35 35 42 C35 50 37 58 40 58 C43 58 45 50 45 42 C45 35 40 25 40 25 Z"
              fill={theme.colors.success.celebratoryGold}
            />
            <Circle cx="40" cy="45" r="5" fill={theme.colors.text.onDark} opacity="0.3" />
          </Svg>
        </View>

        {/* Streak count */}
        <Text style={styles.streakCount}>{streakData.currentStreak}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>

        {/* Longest streak */}
        <Text style={styles.longestStreak}>
          Longest: {streakData.longestStreak} days
        </Text>

        {/* Warning message */}
        {streakData.currentStreak > 0 && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              Keep practicing daily to maintain your streak!
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderMilestones = () => {
    if (!streakData) return null;

    const milestones = [
      { days: 7, label: '7 Days', icon: '📖' },
      { days: 30, label: '1 Month', icon: '📜' },
      { days: 100, label: '100 Days', icon: '✝️' },
      { days: 365, label: '1 Year', icon: '👑' },
    ];

    return (
      <Card variant="cream" style={styles.milestonesCard}>
        <Text style={styles.sectionTitle}>Milestones</Text>

        <View style={styles.milestonesContainer}>
          {milestones.map((milestone) => {
            const reached = streakData.milestonesReached.includes(milestone.days);
            const isNext = milestone.days === streakData.nextMilestone;

            return (
              <View
                key={milestone.days}
                style={[
                  styles.milestoneItem,
                  reached && styles.milestoneReached,
                  isNext && styles.milestoneNext,
                ]}
              >
                <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
                <Text style={[
                  styles.milestoneLabel,
                  reached && styles.milestoneLabelReached,
                ]}>
                  {milestone.label}
                </Text>
                {reached && (
                  <Svg width="20" height="20" viewBox="0 0 24 24" style={styles.checkIcon}>
                    <Circle cx="12" cy="12" r="10" fill={theme.colors.success.celebratoryGold} />
                    <Path
                      d="M8 12 L11 15 L16 9"
                      stroke={theme.colors.text.onDark}
                      strokeWidth="2"
                      fill="none"
                    />
                  </Svg>
                )}
                {isNext && !reached && (
                  <View style={styles.nextBadge}>
                    <Text style={styles.nextBadgeText}>
                      {milestone.days - streakData.currentStreak} more
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  const renderCalendarHeatmap = () => {
    if (!streakData) return null;

    // Group by weeks (7 days per row)
    const weeks: DayActivity[][] = [];
    const history = [...streakData.practiceHistory];

    // Pad to start on Sunday
    const firstDay = new Date(history[0]?.date || new Date());
    const dayOfWeek = firstDay.getDay();
    for (let i = 0; i < dayOfWeek; i++) {
      history.unshift({ date: '', count: 0, completed: false });
    }

    // Group into weeks
    for (let i = 0; i < history.length; i += 7) {
      weeks.push(history.slice(i, i + 7));
    }

    return (
      <Card variant="cream" style={styles.calendarCard}>
        <Text style={styles.sectionTitle}>Practice Calendar</Text>
        <Text style={styles.sectionSubtitle}>Last 90 days</Text>

        {/* Day labels */}
        <View style={styles.dayLabels}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={styles.dayLabel}>{day}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.calendarGrid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.calendarRow}>
                {week.map((day, dayIndex) => renderCalendarDay(day, dayIndex))}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Less</Text>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[
                styles.legendBox,
                { backgroundColor: getActivityColor(level) },
              ]}
            />
          ))}
          <Text style={styles.legendLabel}>More</Text>
        </View>
      </Card>
    );
  };

  const renderCalendarDay = (day: DayActivity, index: number) => {
    if (!day.date) {
      return <View key={index} style={styles.calendarDayEmpty} />;
    }

    const color = getActivityColor(day.count);
    const isToday = day.date === new Date().toISOString().split('T')[0];

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          { backgroundColor: color },
          isToday && styles.calendarDayToday,
        ]}
        onPress={() => {
          if (day.count > 0) {
            Alert.alert(
              day.date,
              `${day.count} practice session${day.count > 1 ? 's' : ''} completed`
            );
          }
        }}
      >
        {isToday && (
          <View style={styles.todayIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  const getActivityColor = (count: number): string => {
    if (count === 0) return theme.colors.background.warmParchment;
    if (count === 1) return theme.colors.accent.rosyBlush;
    if (count === 2) return theme.colors.secondary.lightGold;
    if (count === 3) return theme.colors.accent.burnishedGold;
    return theme.colors.success.celebratoryGold;
  };

  const renderStreakFreeze = () => {
    if (!streakData) return null;

    // Check feature flag - don't show if disabled
    if (!canUseStreakFreeze) return null;

    return (
      <Card variant="cream" style={styles.freezeCard}>
        <View style={styles.freezeHeader}>
          <Svg width="40" height="40" viewBox="0 0 40 40">
            <Path
              d="M20 5 L20 35 M5 20 L35 20 M12 12 L28 28 M28 12 L12 28"
              stroke={theme.colors.secondary.lightGold}
              strokeWidth="2"
            />
            <Circle
              cx="20"
              cy="20"
              r="15"
              stroke={theme.colors.secondary.lightGold}
              strokeWidth="2"
              fill="none"
            />
          </Svg>
          <View style={styles.freezeInfo}>
            <Text style={styles.freezeTitle}>Streak Freeze</Text>
            <Text style={styles.freezeSubtitle}>
              {profile?.is_premium ? 'Protect your streak for 1 day' : 'Premium Feature'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.freezeButton,
            (!profile?.is_premium || !streakData.freezeAvailable) && styles.freezeButtonDisabled,
          ]}
          onPress={handleStreakFreeze}
          disabled={!profile?.is_premium || !streakData.freezeAvailable}
        >
          <Text style={styles.freezeButtonText}>
            {!profile?.is_premium
              ? 'Upgrade to Premium'
              : streakData.freezeAvailable
              ? 'Use Freeze (1/week)'
              : 'Used This Week'}
          </Text>
        </TouchableOpacity>

        {!profile?.is_premium && (
          <Text style={styles.freezeDescription}>
            Premium members can freeze their streak once per week to prevent losing progress.
          </Text>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading your streak...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Guest UI - Show nice message encouraging sign-up
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M15 18 L9 12 L15 6"
                stroke={theme.colors.text.primary}
                strokeWidth="2"
                fill="none"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.title}>Streak Calendar</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.guestContainer}>
          <Svg width="120" height="120" viewBox="0 0 120 120">
            <Path
              d="M60 20 C60 20 45 45 45 65 C45 85 52 100 60 100 C68 100 75 85 75 65 C75 45 60 20 60 20 Z"
              fill={theme.colors.secondary.warmTerracotta}
              opacity="0.3"
            />
          </Svg>
          <Text style={styles.guestTitle}>Build Your Streak!</Text>
          <Text style={styles.guestMessage}>
            Sign up to track your daily practice streak and stay motivated!
          </Text>

          <View style={styles.guestBenefits}>
            <Text style={styles.guestBenefitItem}>🔥 Track daily streaks</Text>
            <Text style={styles.guestBenefitItem}>📜 Visual practice calendar</Text>
            <Text style={styles.guestBenefitItem}>✝️ Reach milestones</Text>
            <Text style={styles.guestBenefitItem}>❄️ Streak freeze (Premium)</Text>
          </View>

          <TouchableOpacity
            style={styles.guestSignUpButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.guestSignUpButtonText}>Create Free Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestLoginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.guestLoginButtonText}>I Have an Account</Text>
          </TouchableOpacity>
        </View>

        {PromptComponent}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path
              d="M15 18 L9 12 L15 6"
              stroke={theme.colors.text.primary}
              strokeWidth="2"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.title}>Your Streak</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStreakHeader()}
        {renderMilestones()}
        {renderCalendarHeatmap()}
        {renderStreakFreeze()}
      </ScrollView>

      {PromptComponent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.ui.title.fontSize,
    lineHeight: theme.typography.ui.title.lineHeight,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
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
  headerCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  flameContainer: {
    marginBottom: theme.spacing.sm,
  },
  streakCount: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  streakLabel: {
    fontSize: theme.typography.ui.heading.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  longestStreak: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  warningContainer: {
    backgroundColor: theme.colors.accent.rosyBlush,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  warningText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    fontWeight: '600',
  },
  milestonesCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
  },
  milestonesContainer: {
    gap: theme.spacing.sm,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary.mutedStone,
  },
  milestoneReached: {
    backgroundColor: theme.colors.accent.rosyBlush,
    borderColor: theme.colors.success.celebratoryGold,
  },
  milestoneNext: {
    borderColor: theme.colors.secondary.lightGold,
    borderStyle: 'dashed',
  },
  milestoneIcon: {
    fontSize: 28,
    marginRight: theme.spacing.md,
  },
  milestoneLabel: {
    flex: 1,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  milestoneLabelReached: {
    color: theme.colors.text.primary,
  },
  checkIcon: {
    marginLeft: theme.spacing.sm,
  },
  nextBadge: {
    backgroundColor: theme.colors.secondary.lightGold,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  nextBadgeText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '700',
  },
  calendarCard: {
    marginBottom: theme.spacing.lg,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.sm,
  },
  dayLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    gap: 4,
  },
  calendarRow: {
    flexDirection: 'row',
    gap: 4,
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayEmpty: {
    width: 32,
    height: 32,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: theme.colors.text.primary,
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.primary,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: theme.spacing.md,
  },
  legendLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
  freezeCard: {
    marginBottom: theme.spacing.lg,
  },
  freezeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  freezeInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  freezeTitle: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  freezeSubtitle: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  freezeButton: {
    backgroundColor: theme.colors.secondary.lightGold,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  freezeButtonDisabled: {
    backgroundColor: theme.colors.primary.mutedStone,
    opacity: 0.6,
  },
  freezeButtonText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '700',
  },
  freezeDescription: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  guestMessage: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  guestBenefits: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  guestBenefitItem: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  guestSignUpButton: {
    backgroundColor: theme.colors.secondary.lightGold,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    width: '100%',
    maxWidth: 300,
  },
  guestSignUpButtonText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  guestLoginButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  guestLoginButtonText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
});

export default StreakCalendarScreen;
