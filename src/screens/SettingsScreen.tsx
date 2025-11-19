/**
 * Settings Screen
 *
 * Comprehensive settings and preferences hub
 * Organized into sections: Account, Notifications, Preferences, Data, About
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { analyticsService } from '../services/analyticsService';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  badge?: string;
  destructive?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  toggle = false,
  toggleValue = false,
  onToggle,
  badge,
  destructive = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !toggle}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingIconContainer}>{icon}</View>
      <View style={styles.settingContent}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {toggle && onToggle && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{
              false: theme.colors.primary.mutedStone,
              true: theme.colors.accent.burnishedGold,
            }}
            thumbColor="white"
          />
        )}
        {!toggle && showArrow && onPress && (
          <Svg width="20" height="20" viewBox="0 0 24 24" style={styles.arrow}>
            <Path
              d="M8 5 L16 12 L8 19"
              stroke={theme.colors.text.tertiary}
              strokeWidth="2"
              fill="none"
            />
          </Svg>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return <Text style={styles.sectionHeader}>{title}</Text>;
};

export const SettingsScreen = () => {
  const { profile, signOut } = useAuth();
  const navigation = useNavigation();

  // Feature flags
  const canUseCustomThemes = useFeatureFlag('customThemes');
  const canExportData = useFeatureFlag('exportData');
  const canUseHaptics = useFeatureFlag('hapticFeedback');

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('KJV');
  const [showTranslationModal, setShowTranslationModal] = useState(false);

  const isPremiumUser = profile?.is_premium || false;

  // Translation options
  const freeTranslations = [
    { id: 'KJV', name: 'King James Version', subtitle: 'Classic, poetic' },
    { id: 'NIV', name: 'New International', subtitle: 'Modern, readable' },
    { id: 'WEB', name: 'World English Bible', subtitle: 'Accurate, clear' },
  ];

  const premiumTranslations = [
    { id: 'ESV', name: 'English Standard', subtitle: 'Literal, scholarly' },
    { id: 'NLT', name: 'New Living Translation', subtitle: 'Easy to understand' },
    { id: 'NASB', name: 'New American Standard', subtitle: 'Most literal' },
    { id: 'YLT', name: "Young's Literal", subtitle: 'Word-for-word' },
  ];

  // Load translation preference on mount
  useEffect(() => {
    const loadTranslation = async () => {
      try {
        const saved = await AsyncStorage.getItem('preferred_translation');
        if (saved) {
          setSelectedTranslation(saved);
        }
      } catch (error) {
        console.error('Failed to load translation preference:', error);
      }
    };
    loadTranslation();
  }, []);

  // Track screen view
  useEffect(() => {
    analyticsService.logSettingsViewed();
  }, []);

  // Track setting changes
  const handleSettingChange = (settingName: string, value: boolean) => {
    analyticsService.logSettingChanged(settingName, value);
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
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming Soon', 'Account deletion will be available soon.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    if (!canExportData) {
      Alert.alert('Coming Soon', 'Data export will be available soon.');
      return;
    }
    // TODO: Implement data export
    Alert.alert('Export Data', 'Your data will be exported as a PDF.');
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Your account data will remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              // Clear specific cache keys, not auth
              await AsyncStorage.removeItem('cached_verses');
              await AsyncStorage.removeItem('cached_leaderboard');
              Alert.alert('Success', 'Cache cleared successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email us at support@memoryverse.app for help.',
      [
        { text: 'OK' },
        { text: 'Copy Email', onPress: () => {
          // TODO: Copy to clipboard
          Alert.alert('Copied', 'Email copied to clipboard');
        }},
      ]
    );
  };

  const handleTranslationSelect = async (translationId: string) => {
    setSelectedTranslation(translationId);
    await AsyncStorage.setItem('preferred_translation', translationId);
    analyticsService.logSettingChanged('translation', translationId);
    setShowTranslationModal(false);
    Alert.alert(
      'Translation Updated',
      `Bible translation changed to ${translationId}. Restart the app for changes to take full effect.`
    );
  };

  const handleTranslationPress = (translationId: string, isPremium: boolean) => {
    if (isPremium && !isPremiumUser) {
      Alert.alert(
        'Premium Translation',
        `${translationId} is available with Premium. Upgrade to unlock all translations.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('PremiumUpgrade') },
        ]
      );
      return;
    }
    handleTranslationSelect(translationId);
  };

  const getTranslationDisplayName = () => {
    const all = [...freeTranslations, ...premiumTranslations];
    const found = all.find(t => t.id === selectedTranslation);
    return found ? found.name : selectedTranslation;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.section}>
          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Profile"
            subtitle={profile?.full_name || 'Edit your profile'}
            onPress={() => {
              // Navigate to Profile tab
              navigation.navigate('Main', { screen: 'Profile' });
            }}
          />

          {!isPremiumUser && (
            <SettingItem
              icon={
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Path
                    d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"
                    fill={theme.colors.accent.burnishedGold}
                  />
                </Svg>
              }
              title="Upgrade to Premium"
              subtitle="Unlock all features"
              onPress={() => navigation.navigate('PremiumUpgrade')}
            />
          )}

          {isPremiumUser && (
            <SettingItem
              icon={
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Path
                    d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"
                    fill={theme.colors.accent.burnishedGold}
                  />
                </Svg>
              }
              title="Premium Membership"
              subtitle="Manage subscription"
              badge="Active"
              onPress={() => navigation.navigate('PremiumUpgrade')}
            />
          )}
        </View>

        {/* Notifications Section */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.section}>
          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Daily Reminders"
            subtitle="Customize your practice reminders"
            onPress={() => navigation.navigate('NotificationSettings')}
          />

          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Push Notifications"
            subtitle="Enable push notifications"
            toggle
            toggleValue={notificationsEnabled}
            onToggle={setNotificationsEnabled}
          />
        </View>

        {/* Preferences Section */}
        <SectionHeader title="PREFERENCES" />
        <View style={styles.section}>
          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2ZM9 4H11V9L10 8.25L9 9V4ZM18 20H6V4H7V13L10 10.75L13 13V4H18V20Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Bible Translation"
            subtitle={getTranslationDisplayName()}
            onPress={() => setShowTranslationModal(true)}
          />

          {canUseCustomThemes && (
            <SettingItem
              icon={
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Path
                    d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM12 19V5C15.87 5 19 8.13 19 12C19 15.87 15.87 19 12 19Z"
                    fill={theme.colors.text.secondary}
                  />
                </Svg>
              }
              title="Dark Mode"
              subtitle="Switch to dark theme"
              badge={isPremiumUser ? undefined : "Premium"}
              toggle={isPremiumUser}
              toggleValue={darkModeEnabled}
              onToggle={setDarkModeEnabled}
              onPress={!isPremiumUser ? () => navigation.navigate('PremiumUpgrade') : undefined}
            />
          )}

          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M3 9V15C3 16.1 3.9 17 5 17H7V3H5C3.9 3 3 3.9 3 5V9ZM21 9H19V3C19 1.9 18.1 1 17 1H7C5.9 1 5 1.9 5 3V21C5 22.1 5.9 23 7 23H17C18.1 23 19 22.1 19 21H21C22.1 21 23 20.1 23 19V11C23 9.9 22.1 9 21 9Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Sound Effects"
            subtitle="Enable audio feedback"
            toggle
            toggleValue={soundEnabled}
            onToggle={setSoundEnabled}
          />

          {canUseHaptics && (
            <SettingItem
              icon={
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  <Path
                    d="M7 2V22H9V2H7ZM11 8V16H13V8H11ZM3 10V14H5V10H3ZM19 8V16H21V8H19ZM15 4V20H17V4H15Z"
                    fill={theme.colors.text.secondary}
                  />
                </Svg>
              }
              title="Haptic Feedback"
              subtitle="Vibration on interactions"
              toggle
              toggleValue={hapticEnabled}
              onToggle={setHapticEnabled}
            />
          )}
        </View>

        {/* Data & Privacy Section */}
        <SectionHeader title="DATA & PRIVACY" />
        <View style={styles.section}>
          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Export Data"
            subtitle="Download your data as PDF/CSV"
            onPress={handleExportData}
            badge={canExportData ? undefined : "Coming Soon"}
          />

          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Clear Cache"
            subtitle="Free up storage space"
            onPress={handleClearCache}
          />

          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={() => {
              Alert.alert('Coming Soon', 'Privacy policy will be available soon.');
            }}
          />

          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM8 9H16V19H8V9ZM15.5 4L14.5 3H9.5L8.5 4H5V6H19V4H15.5Z"
                  fill={theme.colors.error.softRed}
                />
              </Svg>
            }
            title="Delete Account"
            subtitle="Permanently delete your data"
            onPress={handleDeleteAccount}
            destructive
            showArrow={false}
          />
        </View>

        {/* About Section */}
        <SectionHeader title="ABOUT" />
        <View style={styles.section}>
          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Version"
            subtitle={`${Application.nativeApplicationVersion || '1.0.0'} (${Application.nativeBuildVersion || '1'})`}
            showArrow={false}
          />

          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Terms of Service"
            subtitle="Legal agreements"
            onPress={() => {
              Alert.alert('Coming Soon', 'Terms of service will be available soon.');
            }}
          />

          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M11 18H13V16H11V18ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10H10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 12 11 11.75 11 15H13C13 12.75 16 12.5 16 10C16 7.79 14.21 6 12 6Z"
                  fill={theme.colors.text.secondary}
                />
              </Svg>
            }
            title="Help & Support"
            subtitle="Get help or contact us"
            onPress={handleContactSupport}
          />

          <SettingItem
            icon={
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                  fill={theme.colors.success.green}
                />
              </Svg>
            }
            title="Rate MemoryVerse"
            subtitle="Help us improve with your feedback"
            onPress={() => {
              Alert.alert('Thank You!', 'App store review prompts will be available soon.');
            }}
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          Made for Bible memorization
        </Text>
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
    paddingBottom: theme.spacing.xxl,
  },
  sectionHeader: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.lightCream,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.lightCream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  destructiveText: {
    color: theme.colors.error.softRed,
  },
  arrow: {
    marginLeft: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.accent.burnishedGold,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  badgeText: {
    fontSize: theme.typography.ui.caption.fontSize,
    color: 'white',
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '700',
  },
  signOutButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error.softRed,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontWeight: '600',
    color: theme.colors.error.softRed,
    fontFamily: theme.typography.fonts.ui.default,
  },
  footer: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
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
    maxHeight: '80%',
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.oatmeal,
  },
  modalTitle: {
    fontSize: theme.typography.ui.title.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  translationSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  translationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  translationOptionSelected: {
    borderColor: theme.colors.secondary.lightGold,
    backgroundColor: theme.colors.background.warmParchment,
  },
  translationOptionLocked: {
    opacity: 0.6,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  translationRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
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
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
  },
  translationSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  translationNameLocked: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    marginLeft: theme.spacing.sm,
  },
  premiumDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  premiumDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.primary.oatmeal,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.sm,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.success.celebratoryGold,
    fontFamily: theme.typography.fonts.ui.default,
  },
  premiumTeaseText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
