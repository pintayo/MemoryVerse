import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const { user, profile, signOut, refreshProfile, isGuest } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState(profile?.full_name || '');
  const [selectedTranslation, setSelectedTranslation] = useState<string>('KJV');
  const [showTranslationModal, setShowTranslationModal] = useState(false);

  // Check premium status from profile
  const isPremiumUser = profile?.is_premium || false;

  // Translation options
  const freeTranslations = [
    { id: 'KJV', name: 'King James Version', subtitle: 'Classic, poetic, 1611' },
    { id: 'WEB', name: 'World English Bible', subtitle: 'Modern, accurate' },
    { id: 'BBE', name: 'Bible in Basic English', subtitle: 'Simple, clear' },
  ];

  const premiumTranslations = [
    { id: 'ASV', name: 'American Standard', subtitle: 'Revised, literal, 1901' },
    { id: 'YLT', name: "Young's Literal", subtitle: 'Word-for-word translation' },
    { id: 'DBY', name: "Darby Bible", subtitle: 'Formal equivalence, 1890' },
    { id: 'WBT', name: "Webster's Bible", subtitle: 'American English, 1833' },
  ];

  // Update edited values when profile changes
  useEffect(() => {
    if (profile) {
      setEditedName(profile.full_name || '');
    }
  }, [profile]);

  // Load achievements on mount
  useEffect(() => {
    loadAchievements();
  }, [user?.id]);

  // Load translation preference
  useEffect(() => {
    const loadTranslation = async () => {
      try {
        const saved = await AsyncStorage.getItem('preferred_translation');
        if (saved) {
          setSelectedTranslation(saved);
        }
      } catch (error) {
        logger.error('[ProfileScreen] Failed to load translation:', error);
      }
    };
    loadTranslation();
  }, []);

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

  const handleTranslationPress = async (translationId: string, isPremium: boolean) => {
    if (isPremium && !isPremiumUser) {
      Alert.alert(
        'Premium Translation',
        'This translation is only available for premium members. Upgrade to unlock all translations!',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedTranslation(translationId);
    try {
      await AsyncStorage.setItem('preferred_translation', translationId);
      logger.log(`[ProfileScreen] Translation changed to ${translationId}`);
      setShowTranslationModal(false);
      Alert.alert('Success', `Bible translation changed to ${translationId}`);
    } catch (error) {
      logger.error('[ProfileScreen] Failed to save translation:', error);
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

  // Helper function to get user initials
  const getUserInitials = (name: string): string => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

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

  // Guest UI - Show nice sign-up prompt
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.guestScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.guestHeader}>
            <View style={styles.guestAvatar}>
              <Text style={styles.guestAvatarText}>👤</Text>
            </View>
            <Text style={styles.guestTitle}>You're Browsing as Guest</Text>
            <Text style={styles.guestSubtitle}>
              Sign up to track your progress, earn achievements, and sync across devices!
            </Text>
          </View>

          <View style={styles.guestActions}>
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

          <Card variant="cream" style={styles.guestBenefitsCard}>
            <Text style={styles.guestBenefitsTitle}>Benefits of Signing Up:</Text>
            <View style={styles.guestBenefitsList}>
              <View style={styles.guestBenefitItem}>
                <Text style={styles.guestBenefitIcon}>📜</Text>
                <View style={styles.guestBenefitTextContainer}>
                  <Text style={styles.guestBenefitName}>Track Your Progress</Text>
                  <Text style={styles.guestBenefitDescription}>
                    See detailed stats, accuracy over time, and learning curves
                  </Text>
                </View>
              </View>

              <View style={styles.guestBenefitItem}>
                <Text style={styles.guestBenefitIcon}>🔥</Text>
                <View style={styles.guestBenefitTextContainer}>
                  <Text style={styles.guestBenefitName}>Build Daily Streaks</Text>
                  <Text style={styles.guestBenefitDescription}>
                    Stay motivated with streak tracking and freeze features
                  </Text>
                </View>
              </View>

              <View style={styles.guestBenefitItem}>
                <Text style={styles.guestBenefitIcon}>📖</Text>
                <View style={styles.guestBenefitTextContainer}>
                  <Text style={styles.guestBenefitName}>Save Favorite Verses</Text>
                  <Text style={styles.guestBenefitDescription}>
                    Create collections and organize your favorite verses
                  </Text>
                </View>
              </View>

              <View style={styles.guestBenefitItem}>
                <Text style={styles.guestBenefitIcon}>✝️</Text>
                <View style={styles.guestBenefitTextContainer}>
                  <Text style={styles.guestBenefitName}>Unlock Achievements</Text>
                  <Text style={styles.guestBenefitDescription}>
                    Earn badges and reach milestones as you learn
                  </Text>
                </View>
              </View>

              <View style={styles.guestBenefitItem}>
                <Text style={styles.guestBenefitIcon}>☁️</Text>
                <View style={styles.guestBenefitTextContainer}>
                  <Text style={styles.guestBenefitName}>Sync Across Devices</Text>
                  <Text style={styles.guestBenefitDescription}>
                    Access your progress on phone, tablet, and web
                  </Text>
                </View>
              </View>

              <View style={styles.guestBenefitItem}>
                <Text style={styles.guestBenefitIcon}>📖</Text>
                <View style={styles.guestBenefitTextContainer}>
                  <Text style={styles.guestBenefitName}>Add Study Notes</Text>
                  <Text style={styles.guestBenefitDescription}>
                    Save personal reflections and insights on verses
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          <View style={styles.guestFooter}>
            <Text style={styles.guestFooterText}>
              It's completely free to get started!
            </Text>
          </View>
        </ScrollView>
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

              {/* Avatar Display */}
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarInitials}>{getUserInitials(editedName || 'User')}</Text>
              </View>

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
                <Text style={styles.avatarInitials}>{getUserInitials(profile?.full_name || 'User')}</Text>
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
              {/* Premium Upgrade/Manage Button */}
              <Button
                title={isPremiumUser ? "Manage Premium" : "Upgrade to Premium"}
                onPress={() => navigation.navigate('PremiumUpgrade')}
                variant={isPremiumUser ? "secondary" : "gold"}
                style={styles.actionButton}
              />
              <Button
                title="Study Notes"
                onPress={() => navigation.navigate('Notes')}
                variant="gold"
                style={styles.actionButton}
              />
              <Button
                title="View Streak Calendar"
                onPress={() => navigation.navigate('StreakCalendar')}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="Daily Reminders"
                onPress={() => navigation.navigate('NotificationSettings')}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="Offline Downloads"
                onPress={() => navigation.navigate('Downloads')}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title={`Bible Translation (${selectedTranslation})`}
                onPress={() => setShowTranslationModal(true)}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="Settings"
                onPress={() => navigation.navigate('Settings')}
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

      {/* Translation Selector Modal */}
      <Modal
        visible={showTranslationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTranslationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bible Translation</Text>
              <TouchableOpacity
                onPress={() => setShowTranslationModal(false)}
                style={styles.modalCloseButton}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Path
                    d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                    fill={theme.colors.text.primary}
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Free Translations */}
              <Text style={styles.translationSectionTitle}>Popular Translations (Free)</Text>
              {freeTranslations.map((trans) => (
                <TouchableOpacity
                  key={trans.id}
                  style={[
                    styles.translationOption,
                    selectedTranslation === trans.id && styles.translationOptionSelected
                  ]}
                  onPress={() => handleTranslationPress(trans.id, false)}
                  activeOpacity={0.7}
                >
                  <View style={styles.translationRadio}>
                    {selectedTranslation === trans.id && (
                      <View style={styles.translationRadioInner} />
                    )}
                  </View>
                  <View style={styles.translationInfo}>
                    <Text style={styles.translationName}>{trans.name}</Text>
                    <Text style={styles.translationSubtitle}>{trans.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Premium Translations */}
              <View style={styles.premiumDivider}>
                <View style={styles.premiumDividerLine} />
                <View style={styles.premiumBadge}>
                  <Svg width="12" height="12" viewBox="0 0 12 12">
                    <Path
                      d="M6 1 L7.5 4.5 L11 5 L8.5 7.5 L9 11 L6 9 L3 11 L3.5 7.5 L1 5 L4.5 4.5 Z"
                      fill={theme.colors.success.celebratoryGold}
                    />
                  </Svg>
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
                <View style={styles.premiumDividerLine} />
              </View>

              {premiumTranslations.map((trans) => (
                <TouchableOpacity
                  key={trans.id}
                  style={[
                    styles.translationOption,
                    isPremiumUser && selectedTranslation === trans.id && styles.translationOptionSelected,
                    !isPremiumUser && styles.translationOptionLocked
                  ]}
                  onPress={() => handleTranslationPress(trans.id, true)}
                  activeOpacity={0.7}
                >
                  {isPremiumUser ? (
                    <>
                      <View style={styles.translationRadio}>
                        {selectedTranslation === trans.id && (
                          <View style={styles.translationRadioInner} />
                        )}
                      </View>
                      <View style={styles.translationInfo}>
                        <Text style={styles.translationName}>{trans.name}</Text>
                        <Text style={styles.translationSubtitle}>{trans.subtitle}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Svg width="16" height="16" viewBox="0 0 16 16">
                        <Path
                          d="M12 7 L12 5 C12 2.8 10.2 1 8 1 C5.8 1 4 2.8 4 5 L4 7 L3 7 L3 15 L13 15 L13 7 Z M6 5 C6 3.9 6.9 3 8 3 C9.1 3 10 3.9 10 5 L10 7 L6 7 Z"
                          fill={theme.colors.text.tertiary}
                        />
                      </Svg>
                      <Text style={styles.translationNameLocked}>{trans.name}</Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}

              {!isPremiumUser && (
                <Text style={styles.premiumTeaseText}>
                  🔓 Unlock 4 more translations with Premium
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
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
  // Guest UI Styles
  guestScrollContent: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.screen.horizontal,
  },
  guestHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  guestAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary.oatmeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  guestAvatarText: {
    fontSize: 48,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  guestSubtitle: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  guestActions: {
    width: '100%',
    marginBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  guestSignUpButton: {
    backgroundColor: theme.colors.secondary.lightGold,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  guestSignUpButtonText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  guestLoginButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  guestLoginButtonText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  guestBenefitsCard: {
    marginBottom: theme.spacing.xl,
  },
  guestBenefitsTitle: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: theme.typography.ui.heading.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.lg,
  },
  guestBenefitsList: {
    gap: theme.spacing.lg,
  },
  guestBenefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guestBenefitIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  guestBenefitTextContainer: {
    flex: 1,
  },
  guestBenefitName: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  guestBenefitDescription: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 20,
  },
  guestFooter: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  guestFooterText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
  },
  // Translation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '80%',
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    flexGrow: 1,
  },
  translationSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  translationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.warmParchment,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  translationOptionSelected: {
    borderColor: theme.colors.secondary.lightGold,
    backgroundColor: theme.colors.background.lightCream,
  },
  translationOptionLocked: {
    opacity: 0.6,
  },
  translationRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary.mutedStone,
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translationRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.secondary.lightGold,
  },
  translationInfo: {
    flex: 1,
  },
  translationName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
  },
  translationSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  translationNameLocked: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  premiumDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  premiumDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.primary.mutedStone,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.success.celebratoryGold,
    fontFamily: theme.typography.fonts.ui.default,
    letterSpacing: 0.5,
  },
  premiumTeaseText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontStyle: 'italic',
  },
});

export default ProfileScreen;
