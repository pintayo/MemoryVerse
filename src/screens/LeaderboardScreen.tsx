import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components';
import { theme } from '../theme';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { Profile } from '../types/database';
import { logger } from '../utils/logger';

interface LeaderboardScreenProps {
  navigation: any;
}

type TabType = 'week' | 'allTime';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  streak: number;
  xp: number;
  isCurrentUser?: boolean;
  userId: string;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('week');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const { user, profile } = useAuth();

  // Load leaderboard data
  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);

      // Get leaderboard data
      const result = await profileService.getLeaderboard(50, activeTab);

      if (result.data) {
        // Map profiles to leaderboard entries
        const entries: LeaderboardEntry[] = result.data.map((p, index) => ({
          rank: index + 1,
          name: p.full_name || 'User',
          avatar: p.avatar || '😊',
          streak: p.current_streak || 0,
          xp: p.total_xp || 0,
          isCurrentUser: p.id === user?.id,
          userId: p.id,
        }));

        setLeaderboard(entries);

        // Find current user's rank
        const userEntry = entries.find(e => e.userId === user?.id);
        if (userEntry) {
          setUserRank(userEntry.rank);
        } else if (user?.id) {
          // User not in top 50, get their actual rank
          const rankResult = await profileService.getUserRank(user.id);
          if (rankResult.data) {
            setUserRank(rankResult.data.rank);
          }
        }
      }
    } catch (error) {
      logger.error('[LeaderboardScreen] Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentLeaderboard = leaderboard;

  const renderRankBadge = (rank: number) => {
    const isTop3 = rank <= 3;
    const colors = {
      1: theme.colors.success.celebratoryGold,
      2: theme.colors.primary.mutedStone,
      3: theme.colors.secondary.warmTerracotta,
    };

    if (isTop3) {
      return (
        <View style={[styles.rankBadge, styles.rankBadgeTop3, { backgroundColor: colors[rank as 1 | 2 | 3] }]}>
          <Text style={styles.rankTextTop3}>{rank}</Text>
          <Svg width="20" height="20" viewBox="0 0 20 20" style={styles.crownIcon}>
            <Path
              d="M2 8 L5 12 L10 8 L15 12 L18 8 L18 16 L2 16 Z"
              fill={rank === 1 ? theme.colors.success.celebratoryGold : theme.colors.text.onDark}
              opacity={0.5}
            />
          </Svg>
        </View>
      );
    }

    return (
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
    );
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry) => {
    return (
      <Card
        key={entry.rank}
        variant="cream"
        elevated={entry.isCurrentUser}
        outlined={entry.isCurrentUser}
        style={[
          styles.entryCard,
          entry.isCurrentUser && styles.currentUserCard,
        ]}
      >
        {/* Illuminated manuscript border decoration */}
        {entry.rank <= 3 && (
          <>
            <View style={[styles.cornerDecoration, styles.cornerTopLeft]} />
            <View style={[styles.cornerDecoration, styles.cornerTopRight]} />
            <View style={[styles.cornerDecoration, styles.cornerBottomLeft]} />
            <View style={[styles.cornerDecoration, styles.cornerBottomRight]} />
          </>
        )}

        <View style={styles.entryContent}>
          {/* Rank */}
          {renderRankBadge(entry.rank)}

          {/* Avatar */}
          <View style={[
            styles.avatarContainer,
            entry.rank <= 3 && styles.avatarContainerTop3,
          ]}>
            <Text style={styles.avatar}>{entry.avatar}</Text>
          </View>

          {/* Info */}
          <View style={styles.entryInfo}>
            <Text style={[
              styles.entryName,
              entry.isCurrentUser && styles.currentUserText,
            ]}>
              {entry.name}
            </Text>
            <View style={styles.entryStats}>
              <View style={styles.statBadge}>
                <Svg width="14" height="16" viewBox="0 0 16 20">
                  <Path
                    d="M8 0 C8 0 4 5 4 9 C4 12.3 5.8 15 8 15 C10.2 15 12 12.3 12 9 C12 5 8 0 8 0 Z"
                    fill={theme.colors.secondary.warmTerracotta}
                  />
                </Svg>
                <Text style={styles.statBadgeText}>{entry.streak}</Text>
              </View>
              <Text style={styles.xpText}>{entry.xp} XP</Text>
            </View>
          </View>

          {/* Trophy for top 3 */}
          {entry.rank <= 3 && (
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                d="M20 4H17V3C17 1.9 16.1 1 15 1H9C7.9 1 7 1.9 7 3V4H4C2.9 4 2 4.9 2 6V10C2 11.66 3.34 13 5 13H5.97C6.53 14.75 7.87 16.16 9.6 16.83V19H8C7.45 19 7 19.45 7 20H17C17 19.45 16.55 19 16 19H14.4V16.83C16.13 16.16 17.47 14.75 18.03 13H19C20.66 13 22 11.66 22 10V6C22 4.9 21.1 4 20 4Z"
                fill={theme.colors.success.celebratoryGold}
              />
            </Svg>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with tabs */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>

        {/* Show user rank if not in top list */}
        {userRank && userRank > currentLeaderboard.length && (
          <Text style={styles.userRankText}>
            Your Rank: #{userRank}
          </Text>
        )}

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'week' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('week')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'week' && styles.tabTextActive,
            ]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'allTime' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('allTime')}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'allTime' && styles.tabTextActive,
            ]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Illuminated manuscript header decoration */}
          <View style={styles.manuscriptHeader}>
            <Svg width="100%" height="40" viewBox="0 0 300 40">
              <Path
                d="M10 20 L50 20 M250 20 L290 20"
                stroke={theme.colors.secondary.lightGold}
                strokeWidth="1.5"
              />
              <Circle
                cx="150"
                cy="20"
                r="15"
                stroke={theme.colors.secondary.lightGold}
                strokeWidth="2"
                fill="none"
              />
              <Path
                d="M145 15 L150 25 L155 15"
                stroke={theme.colors.success.celebratoryGold}
                strokeWidth="2"
                fill="none"
              />
            </Svg>
          </View>

          {currentLeaderboard.length > 0 ? (
            currentLeaderboard.map(renderLeaderboardEntry)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No rankings yet.</Text>
              <Text style={styles.emptySubtext}>Start practicing to appear on the leaderboard!</Text>
            </View>
          )}

          {/* Bottom decoration */}
          {currentLeaderboard.length > 0 && (
            <View style={styles.manuscriptFooter}>
              <Svg width="100%" height="30" viewBox="0 0 300 30">
                <Path
                  d="M20 15 Q150 5 280 15"
                  stroke={theme.colors.secondary.lightGold}
                  strokeWidth="1.5"
                  fill="none"
                />
              </Svg>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
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
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.ui.title.fontSize,
    lineHeight: theme.typography.ui.title.lineHeight,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.secondary.lightGold,
  },
  tabText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  tabTextActive: {
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingBottom: theme.spacing.xxl,
  },
  manuscriptHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  manuscriptFooter: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  entryCard: {
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  currentUserCard: {
    backgroundColor: theme.colors.accent.rosyBlush,
    borderColor: theme.colors.accent.burnishedGold,
    borderWidth: 2,
  },
  cornerDecoration: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: theme.colors.success.celebratoryGold,
    borderWidth: 1.5,
  },
  cornerTopLeft: {
    top: 8,
    left: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 8,
    right: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 8,
    left: 8,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 8,
    right: 8,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.oatmeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeTop3: {
    width: 48,
    height: 48,
    borderRadius: 24,
    position: 'relative',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  rankTextTop3: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
  crownIcon: {
    position: 'absolute',
    top: -4,
    right: -2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.warmParchment,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary.mutedStone,
  },
  avatarContainerTop3: {
    borderColor: theme.colors.success.celebratoryGold,
    borderWidth: 3,
  },
  avatar: {
    fontSize: 24,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: theme.typography.ui.subheading.fontWeight,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fonts.ui.default,
  },
  currentUserText: {
    fontWeight: '700',
    color: theme.colors.accent.burnishedGold,
  },
  entryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statBadgeText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  xpText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  userRankText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default LeaderboardScreen;
