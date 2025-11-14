console.log('[RootNavigator] Module loading...');

import React from 'react';
console.log('[RootNavigator] React imported');

import { createStackNavigator } from '@react-navigation/stack';
console.log('[RootNavigator] createStackNavigator imported');

import BottomTabNavigator from './BottomTabNavigator';
console.log('[RootNavigator] BottomTabNavigator imported');

import { VerseCardScreen, RecallScreen } from '../screens';
console.log('[RootNavigator] VerseCardScreen and RecallScreen imported');

// Testing with different filenames
import BlanksScreen from '../screens/BlanksScreen';
console.log('[RootNavigator] BlanksScreen imported');

import ChoiceScreen from '../screens/ChoiceScreen';
console.log('[RootNavigator] ChoiceScreen imported');

import { UnderstandScreen } from '../screens/UnderstandScreen';
console.log('[RootNavigator] UnderstandScreen imported');

import PrayScreen from '../screens/PrayScreen';
console.log('[RootNavigator] PrayScreen imported');

import { DownloadsScreen } from '../screens/DownloadsScreen';
console.log('[RootNavigator] DownloadsScreen imported');

import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
console.log('[RootNavigator] NotificationSettingsScreen imported');

import { StreakCalendarScreen, ReviewScreen } from '../screens';
console.log('[RootNavigator] StreakCalendarScreen and ReviewScreen imported');

import { ComingSoonScreen } from '../screens/ComingSoonScreen';
console.log('[RootNavigator] ComingSoonScreen imported');

import { ChapterContextScreen } from '../screens/ChapterContextScreen';
console.log('[RootNavigator] ChapterContextScreen imported');

import { PremiumUpgradeScreen } from '../screens/PremiumUpgradeScreen';
console.log('[RootNavigator] PremiumUpgradeScreen imported');

import { SettingsScreen } from '../screens/SettingsScreen';
console.log('[RootNavigator] SettingsScreen imported');

import { FavoritesScreen } from '../screens/FavoritesScreen';
console.log('[RootNavigator] FavoritesScreen imported');

import { theme } from '../theme';
console.log('[RootNavigator] theme imported');

import { RootStackParamList } from './types';
console.log('[RootNavigator] types imported');

console.log('[RootNavigator] All imports complete');

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background.lightCream,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.primary.mutedStone,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontFamily: theme.typography.fonts.ui.default,
          fontWeight: '600',
          fontSize: theme.typography.ui.heading.fontSize,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Main"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VerseCard"
        component={VerseCardScreen}
        options={{
          title: 'Learn Verse',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Recall"
        component={RecallScreen}
        options={{
          title: 'Practice Verse',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="FillInBlanks"
        component={BlanksScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MultipleChoice"
        component={ChoiceScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Pray"
        component={PrayScreen}
        options={{
          title: 'Prayer Training',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Understand"
        component={UnderstandScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{
          title: 'Offline Downloads',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Daily Reminders',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="StreakCalendar"
        component={StreakCalendarScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Notes"
        component={ComingSoonScreen}
        options={{
          headerShown: false,
        }}
        initialParams={{
          title: 'Study Notes',
          message: 'The Study Notes feature will allow you to create and save personal notes on Bible verses and chapters.',
        }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          title: 'Review Verses',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChapterContext"
        component={ChapterContextScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PremiumUpgrade"
        component={PremiumUpgradeScreen}
        options={{
          title: 'Premium',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
