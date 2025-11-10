import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '../components';
import { theme } from '../theme';
import Svg, { Path } from 'react-native-svg';
import { notificationService, NotificationSettings } from '../services/notificationService';
import { logger } from '../utils/logger';

interface NotificationSettingsScreenProps {
  navigation: any;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    dailyReminderTime: '09:00',
    frequency: 'daily',
    motivationalQuotes: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const loadedSettings = await notificationService.loadSettings();
      setSettings(loadedSettings);

      // Parse time
      const [hours, minutes] = loadedSettings.dailyReminderTime.split(':').map(Number);
      setSelectedHour(hours);
      setSelectedMinute(minutes);

      logger.log('[NotificationSettingsScreen] Settings loaded');
    } catch (error) {
      logger.error('[NotificationSettingsScreen] Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);

      // Build time string
      const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
      const updatedSettings = {
        ...settings,
        dailyReminderTime: timeString,
      };

      // Update schedule
      const success = await notificationService.updateSchedule(updatedSettings);

      if (success) {
        setSettings(updatedSettings);
        Alert.alert('Success', 'Notification settings saved!');
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.'
        );
      }
    } catch (error) {
      logger.error('[NotificationSettingsScreen] Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Alert.alert('Test Sent!', 'Check your notifications in a moment.');
    } catch (error) {
      logger.error('[NotificationSettingsScreen] Error sending test:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const adjustTime = (hourDelta: number, minuteDelta: number) => {
    let newHour = selectedHour + hourDelta;
    let newMinute = selectedMinute + minuteDelta;

    // Handle minute overflow
    if (newMinute >= 60) {
      newMinute = 0;
      newHour += 1;
    } else if (newMinute < 0) {
      newMinute = 45;
      newHour -= 1;
    }

    // Handle hour overflow
    if (newHour >= 24) newHour = 0;
    if (newHour < 0) newHour = 23;

    setSelectedHour(newHour);
    setSelectedMinute(newMinute);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Daily Reminders</Text>
          <Text style={styles.subtitle}>
            Stay consistent with daily notifications
          </Text>
        </View>

        {/* Enable Notifications */}
        <Card variant="parchment" style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                  fill={theme.colors.secondary.lightGold}
                />
              </Svg>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Enable Reminders</Text>
                <Text style={styles.settingDescription}>
                  Get daily notifications to practice verses
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => setSettings({ ...settings, enabled: value })}
              trackColor={{
                false: theme.colors.primary.oatmeal,
                true: theme.colors.success.mutedOlive,
              }}
              thumbColor={settings.enabled ? theme.colors.secondary.lightGold : theme.colors.background.lightCream}
            />
          </View>
        </Card>

        {/* Reminder Time */}
        {settings.enabled && (
          <>
            <Card variant="warm" style={styles.card}>
              <Text style={styles.cardTitle}>Reminder Time</Text>
              <View style={styles.timePicker}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => adjustTime(-1, 0)}
                >
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M7 14L12 9L17 14H7Z"
                      fill={theme.colors.text.primary}
                    />
                  </Svg>
                </TouchableOpacity>

                <Text style={styles.timeDisplay}>
                  {formatTime(selectedHour, selectedMinute)}
                </Text>

                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => adjustTime(1, 0)}
                >
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M7 10L12 15L17 10H7Z"
                      fill={theme.colors.text.primary}
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              <View style={styles.quickTimes}>
                {[
                  { label: 'Morning', hour: 7, minute: 0 },
                  { label: 'Noon', hour: 12, minute: 0 },
                  { label: 'Evening', hour: 18, minute: 0 },
                  { label: 'Night', hour: 21, minute: 0 },
                ].map((time) => (
                  <TouchableOpacity
                    key={time.label}
                    style={[
                      styles.quickTimeButton,
                      selectedHour === time.hour && selectedMinute === time.minute && styles.quickTimeButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedHour(time.hour);
                      setSelectedMinute(time.minute);
                    }}
                  >
                    <Text style={[
                      styles.quickTimeText,
                      selectedHour === time.hour && selectedMinute === time.minute && styles.quickTimeTextActive,
                    ]}>
                      {time.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Frequency */}
            <Card variant="cream" style={styles.card}>
              <Text style={styles.cardTitle}>Frequency</Text>
              <View style={styles.frequencyOptions}>
                {[
                  { value: 'daily' as const, label: 'Every Day', icon: '🌅' },
                  { value: 'weekdays' as const, label: 'Weekdays', icon: '📅' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.frequencyButton,
                      settings.frequency === option.value && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setSettings({ ...settings, frequency: option.value })}
                  >
                    <Text style={styles.frequencyIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.frequencyLabel,
                      settings.frequency === option.value && styles.frequencyLabelActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Motivational Quotes */}
            <Card variant="parchment" style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Svg width="24" height="24" viewBox="0 0 24 24">
                    <Path
                      d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"
                      fill={theme.colors.success.celebratoryGold}
                    />
                  </Svg>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Motivational Messages</Text>
                    <Text style={styles.settingDescription}>
                      Include inspiring messages in notifications
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.motivationalQuotes}
                  onValueChange={(value) => setSettings({ ...settings, motivationalQuotes: value })}
                  trackColor={{
                    false: theme.colors.primary.oatmeal,
                    true: theme.colors.success.mutedOlive,
                  }}
                  thumbColor={settings.motivationalQuotes ? theme.colors.secondary.lightGold : theme.colors.background.lightCream}
                />
              </View>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save Settings'}
            onPress={saveSettings}
            variant="gold"
            disabled={isSaving}
            style={styles.button}
          />
          {settings.enabled && (
            <Button
              title="Send Test Notification"
              onPress={sendTestNotification}
              variant="secondary"
              style={styles.button}
            />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.ui.title.fontSize,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  timeButton: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.sm,
  },
  timeDisplay: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  quickTimes: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickTimeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  quickTimeButtonActive: {
    backgroundColor: theme.colors.secondary.lightGold,
  },
  quickTimeText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  quickTimeTextActive: {
    color: theme.colors.text.onDark,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  frequencyButton: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyButtonActive: {
    borderColor: theme.colors.secondary.lightGold,
    backgroundColor: theme.colors.background.warmParchment,
  },
  frequencyIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  frequencyLabel: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  frequencyLabelActive: {
    color: theme.colors.text.primary,
  },
  buttonContainer: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
  },
});
