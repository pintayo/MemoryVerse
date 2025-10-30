import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import { VerseCardScreen, RecallScreen } from '../screens';
import { UnderstandScreen } from '../screens/UnderstandScreen';
import PrayScreen from '../screens/PrayScreen';
import { theme } from '../theme';
import { RootStackParamList } from './types';

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
    </Stack.Navigator>
  );
};

export default RootNavigator;
