import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '../components';
import { theme } from '../theme';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { achievementService } from '../services/achievementService';
import { profileService } from '../services/profileService';
import { Achievement } from '../types/database';
import { logger } from '../utils/logger';

interface ProfileScreenProps {
  navigation: any;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
  icon: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState(profile?.full_name || '');
  const [editedAvatar, setEditedAvatar] = useState(profile?.avatar_url || '😊');

  // Update edited values when profile changes
  useEffect(() => {
    if (profile) {
      setEditedName(profile.full_name || '');
      setEditedAvatar(profile.avatar_url || '😊');
    }
  }, [profile]);

  // Load achievements on mount
  useEffect(() => {
    loadAchievements();
  }, [user?.id]);

  const loadAchievements = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await achievementService.getUserAchievements(user.id);
      if (result.data) {
        setAchievements(result.data);
      }
    } catch (error) {
      logger.error('[ProfileScreen] Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
            } catch (error) {
              logger.error('[ProfileScreen] Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setEditedName(profile?.full_name || '');
    setEditedAvatar(profile?.avatar_url || '😊');
    setIsEditMode(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please try again.');
      return;
    }

    if (!editedName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      await profileService.updateProfile(user.id, {
        full_name: editedName.trim(),
        avatar_url: editedAvatar,
      });

      // Refresh profile from AuthContext
      if (refreshProfile) {
        await refreshProfile();
      }

      setIsEditMode(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      logger.error('[ProfileScreen] Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Common emoji avatars for selection
  const avatarOptions = ['😊', '😃', '🙂', '😇', '🤗', '😎', '🥰', '🙏', '✨', '🌟', '⭐', '💫'];

  // Calculate user stats from profile
  const totalStreak = profile?.current_streak || 0;
  const longestStreak = profile?.longest_streak || 0;
  const totalXP = profile?.total_xp || 0;
  const versesLearned = profile?.verses_memorized || 0;
  const level = Math.floor(totalXP / 200) + 1; // 200 XP per level
  const nextLevelXP = level * 200;
  const progressPercentage = ((totalXP % 200) / 200) * 100;

  // Map database achievements to badge format
  const earnedBadgeTypes = new Set(achievements.map(a => a.badge_type));

  const badges: Badge[] = [
    {
      id: 'streak',
      name: achievements.find(a => a.badge_type === 'streak')?.name || 'First Steps',
      description: achievements.find(a => a.badge_type === 'streak')?.description || 'Complete your first day',
      earned: earnedBadgeTypes.has('streak'),
      earnedDate: achievements.find(a => a.badge_type === 'streak')?.earned_at
        ? formatDate(new Date(achievements.find(a => a.badge_type === 'streak')!.earned_at!))
        : undefined,
      icon: 'flame',
    },
    {
      id: 'verses',
      name: achievements.find(a => a.badge_type === 'verses')?.name || 'Memory Builder',
      description: achievements.find(a => a.badge_type === 'verses')?.description || 'Memorize 10 verses',
      earned: earnedBadgeTypes.has('verses'),
      earnedDate: achievements.find(a => a.badge_type === 'verses')?.earned_at
        ? formatDate(new Date(achievements.find(a => a.badge_type === 'verses')!.earned_at!))
        : undefined,
      icon: 'book',
    },
    {
      id: 'practice',
      name: achievements.find(a => a.badge_type === 'practice')?.name || 'Consistent Learner',
      description: achievements.find(a => a.badge_type === 'practice')?.description || 'Practice 3 days in a row',
      earned: earnedBadgeTypes.has('practice'),
      earnedDate: achievements.find(a => a.badge_type === 'practice')?.earned_at
        ? formatDate(new Date(achievements.find(a => a.badge_type === 'practice')!.earned_at!))
        : undefined,
      icon: 'star',
    },
    {
      id: 'month-streak',
      name: 'Devoted Month',
      description: '30-day streak',
      earned: totalStreak >= 30,
      icon: 'calendar',
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Study before 7 AM, 5 times',
      earned: false, // TODO: Track early morning practices
      icon: 'sunrise',
    },
    {
      id: 'century',
      name: 'Century Club',
      description: 'Memorize 100 verses',
      earned: versesLearned >= 100,
      icon: 'trophy',
    },
  ];

  // Helper function to format dates
  function formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  const renderBadge = (badge: Badge) => {
    return (
      <TouchableOpacity
        key={badge.id}
        style={[
          styles.badgeContainer,
          !badge.earned && styles.badgeContainerLocked,
        ]}
        activeOpacity={0.8}
      >
        {/* Ornate frame */}
        <Svg width="80" height="80" viewBox="0 0 80 80">
          <Defs>
            <LinearGradient id={`badgeGradient-${badge.id}`} x1="0" y1="0" x2="1" y2="1">
              <Stop
                offset="0"
                stopColor={badge.earned ? theme.colors.success.celebratoryGold : theme.colors.primary.mutedStone}
              />
              <Stop
                offset="1"
                stopColor={badge.earned ? theme.colors.secondary.lightGold : theme.colors.primary.oatmeal}
              />
            </LinearGradient>
          </Defs>

          {/* Outer ornate frame */}
          <Circle
            cx="40"
            cy="40"
            r="36"
            fill={`url(#badgeGradient-${badge.id})`}
            opacity={badge.earned ? 1 : 0.3}
          />
          <Circle
            cx="40"
            cy="40"
            r="36"
            stroke={badge.earned ? theme.colors.success.celebratoryGold : theme.colors.primary.mutedStone}
            strokeWidth="2"
            fill="none"
            opacity={badge.earned ? 1 : 0.3}
          />

          {/* Inner circle */}
          <Circle
            cx="40"
            cy="40"
            r="28"
            fill={theme.colors.background.lightCream}
            opacity={badge.earned ? 1 : 0.3}
          />

          {/* Badge icon */}
          {renderBadgeIcon(badge.icon, badge.earned)}
        </Svg>

        <Text style={[
          styles.badgeName,
          !badge.earned && styles.badgeNameLocked,
        ]}>
          {badge.name}
        </Text>
        {badge.earned && badge.earnedDate && (
          <Text style={styles.badgeDate}>{badge.earnedDate}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderBadgeIcon = (icon: string, earned: boolean) => {
    const color = earned ? theme.colors.success.celebratoryGold : theme.colors.primary.mutedStone;

    switch (icon) {
      case 'book':
        return (
          <Path
            d="M30 35C30 32 32 30 35 30H50V20H35C31 20 28 23 28 27V53C28 57 31 60 35 60H50V58H35C33 58 32 57 32 55C32 53 33 52 35 52H50V52"
            fill={color}
          />
        );
      case 'flame':
        return (
          <Path
            d="M40 26 C40 26 34 33 34 38 C34 42 36 45 40 45 C44 45 46 42 46 38 C46 33 40 26 40 26 Z"
            fill={color}
          />
        );
      case 'star':
        return (
          <Path
            d="M40 28 L42 36 L50 36 L44 41 L46 50 L40 45 L34 50 L36 41 L30 36 L38 36 Z"
            fill={color}
          />
        );
      case 'trophy':
        return (
          <Path
            d="M50 28H46V26C46 24 44 22 42 22H38C36 22 34 24 34 26V28H30C28 28 26 30 26 32V36C26 38 28 40 30 40H31C32 42 34 44 36 45V48H34C33 48 32 49 32 50H48C48 49 47 48 46 48H44V45C46 44 48 42 49 40H50C52 40 54 38 54 36V32C54 30 52 28 50 28Z"
            fill={color}
          />
        );
      case 'sunrise':
        return (
          <>
            <Circle cx="40" cy="42" r="6" fill={color} />
            <Path d="M40 30 L40 34 M40 50 L40 54 M28 42 L32 42 M48 42 L52 42 M31 33 L34 36 M46 36 L49 33" stroke={color} strokeWidth="2" />
          </>
        );
      case 'calendar':
        return (
          <Rect x="30" y="28" width="20" height="24" rx="2" stroke={color} strokeWidth="2" fill="none" />
        );
      default:
        return null;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <Card variant="cream" elevated outlined style={styles.profileCard}>
          {isEditMode ? (
            /* Edit Mode */
            <View style={styles.profileHeader}>
              <Text style={styles.editSectionTitle}>Edit Profile</Text>

              {/* Avatar Selection */}
              <Text style={styles.editLabel}>Select Avatar</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.avatarScroll}
                contentContainerStyle={styles.avatarScrollContent}
              >
                {avatarOptions.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.avatarOption,
                      editedAvatar === emoji && styles.avatarOptionSelected,
                    ]}
                    onPress={() => setEditedAvatar(emoji)}
                  >
                    <Text style={styles.avatarOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Name Input */}
              <Text style={styles.editLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.text.tertiary}
                maxLength={50}
              />
            </View>
          ) : (
            /* View Mode */
            <View style={styles.profileHeader}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{profile?.avatar_url || '😊'}</Text>
              </View>
              <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Level {level}</Text>
              </View>
            </View>
          )}

          {/* XP Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Experience</Text>
              <Text style={styles.progressValue}>
                {totalXP} / {nextLevelXP} XP
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              {/* Ornate progress markers */}
              <View style={[styles.progressMarker, { left: '25%' }]} />
              <View style={[styles.progressMarker, { left: '50%' }]} />
              <View style={[styles.progressMarker, { left: '75%' }]} />
            </View>
          </View>
        </Card>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <Card variant="parchment" style={styles.statCard}>
            <Svg width="32" height="32" viewBox="0 0 24 24">
              <Path
                d="M12 0 C12 0 6 7 6 12 C6 16 8 19 12 19 C16 19 18 16 18 12 C18 7 12 0 12 0 Z"
                fill={theme.colors.secondary.warmTerracotta}
              />
            </Svg>
            <Text style={styles.statValue}>{totalStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>

          <Card variant="parchment" style={styles.statCard}>
            <Svg width="32" height="32" viewBox="0 0 24 24">
              <Path
                d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM19 11H9V9H19V11ZM15 15H9V13H15V15ZM19 7H9V5H19V7Z"
                fill={theme.colors.success.mutedOlive}
              />
            </Svg>
            <Text style={styles.statValue}>{versesLearned}</Text>
            <Text style={styles.statLabel}>Verses</Text>
          </Card>

          <Card variant="parchment" style={styles.statCard}>
            <Svg width="32" height="32" viewBox="0 0 24 24">
              <Path
                d="M12 2L15 9L22 9L16 14L18 22L12 17L6 22L8 14L2 9L9 9Z"
                fill={theme.colors.success.celebratoryGold}
              />
            </Svg>
            <Text style={styles.statValue}>{achievements.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </Card>

          <Card variant="parchment" style={styles.statCard}>
            <Svg width="32" height="32" viewBox="0 0 24 24">
              <Path
                d="M20 4H17V3C17 1.9 16.1 1 15 1H9C7.9 1 7 1.9 7 3V4H4C2.9 4 2 4.9 2 6V10C2 11.66 3.34 13 5 13H5.97C6.53 14.75 7.87 16.16 9.6 16.83V19H8C7.45 19 7 19.45 7 20H17C17 19.45 16.55 19 16 19H14.4V16.83C16.13 16.16 17.47 14.75 18.03 13H19C20.66 13 22 11.66 22 10V6C22 4.9 21.1 4 20 4Z"
                fill={theme.colors.secondary.lightGold}
              />
            </Svg>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </Card>
        </View>

        {/* Badges section */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgesGrid}>
            {badges.map(renderBadge)}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          {isEditMode ? (
            <>
              <Button
                title={isSaving ? "Saving..." : "Save Changes"}
                onPress={handleSaveProfile}
                variant="gold"
                style={styles.actionButton}
                disabled={isSaving}
              />
              <Button
                title="Cancel"
                onPress={handleCancelEdit}
                variant="secondary"
                style={styles.actionButton}
                disabled={isSaving}
              />
            </>
          ) : (
            <>
              <Button
                title="🔔 Daily Reminders"
                onPress={() => navigation.navigate('NotificationSettings')}
                variant="gold"
                style={styles.actionButton}
              />
              <Button
                title="📥 Offline Downloads"
                onPress={() => navigation.navigate('Downloads')}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="Edit Profile"
                onPress={handleEditProfile}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title={isSigningOut ? "Signing Out..." : "Sign Out"}
                onPress={handleSignOut}
                variant="primary"
                style={styles.actionButton}
                disabled={isSigningOut}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background.warmParchment,
    borderWidth: 3,
    borderColor: theme.colors.secondary.lightGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarLargeText: {
    fontSize: 40,
  },
  userName: {
    fontSize: theme.typography.ui.title.fontSize,
    lineHeight: theme.typography.ui.title.lineHeight,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.success.celebratoryGold,
    borderRadius: theme.borderRadius.full,
  },
  levelText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '700',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  progressValue: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '700',
    color: theme.colors.success.celebratoryGold,
    fontFamily: theme.typography.fonts.ui.default,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.primary.oatmeal,
    borderRadius: theme.borderRadius.sm,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success.mutedOlive,
    borderRadius: theme.borderRadius.sm,
  },
  progressMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.secondary.lightGold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  statValue: {
    fontSize: theme.typography.stats.medium.fontSize,
    lineHeight: theme.typography.stats.medium.lineHeight,
    fontWeight: theme.typography.stats.medium.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  badgesSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.ui.heading.fontSize,
    lineHeight: theme.typography.ui.heading.lineHeight,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.lg,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  badgeContainer: {
    width: '30%',
    alignItems: 'center',
  },
  badgeContainerLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.fonts.ui.default,
  },
  badgeNameLocked: {
    color: theme.colors.text.tertiary,
  },
  badgeDate: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fonts.ui.default,
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
  buttonContainer: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    width: '100%',
  },
  editSectionTitle: {
    fontSize: theme.typography.ui.heading.fontSize,
    lineHeight: theme.typography.ui.heading.lineHeight,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  editLabel: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  avatarScroll: {
    marginBottom: theme.spacing.md,
  },
  avatarScrollContent: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.background.lightCream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: theme.colors.secondary.lightGold,
    backgroundColor: theme.colors.background.warmParchment,
  },
  avatarOptionText: {
    fontSize: 28,
  },
  textInput: {
    height: 48,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
    marginBottom: theme.spacing.sm,
  },
});

export default ProfileScreen;
