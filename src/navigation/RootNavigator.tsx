console.log('[RootNavigator] Module loading...');

import React from 'react';
console.log('[RootNavigator] React imported');

import { createStackNavigator } from '@react-navigation/stack';
console.log('[RootNavigator] createStackNavigator imported');

import BottomTabNavigator from './BottomTabNavigator';
console.log('[RootNavigator] BottomTabNavigator imported');

import { VerseCardScreen, RecallScreen } from '../screens';
console.log('[RootNavigator] VerseCardScreen and RecallScreen imported');

import { UnderstandScreen } from '../screens/UnderstandScreen';
console.log('[RootNavigator] UnderstandScreen imported');

import PrayScreen from '../screens/PrayScreen';
console.log('[RootNavigator] PrayScreen imported');

import { DownloadsScreen } from '../screens/DownloadsScreen';
console.log('[RootNavigator] DownloadsScreen imported');

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
    </Stack.Navigator>
  );
};

export default RootNavigator;
