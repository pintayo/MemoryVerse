console.log('[BottomTabNavigator] Module loading...');

import React from 'react';
console.log('[BottomTabNavigator] React imported');

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
console.log('[BottomTabNavigator] createBottomTabNavigator imported');

import { HomeScreen, ProfileScreen, BibleScreen, StoryModeScreen } from '../screens';
console.log('[BottomTabNavigator] Screens imported');

import { theme } from '../theme';
console.log('[BottomTabNavigator] theme imported');

import Svg, { Path } from 'react-native-svg';
console.log('[BottomTabNavigator] SVG imported');

import { BottomTabParamList } from './types';
console.log('[BottomTabNavigator] types imported');

console.log('[BottomTabNavigator] All imports complete');

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background.lightCream,
          borderTopColor: theme.colors.primary.mutedStone,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.secondary.lightGold,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: theme.typography.fonts.ui.default,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path
                d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
                fill={color}
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Bible"
        component={BibleScreen}
        options={{
          tabBarIcon: ({ color, size}) => (
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path
                d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5l-1-.75L9 9V4zm9 16H6V4h1v9l3-2.25L13 13V4h5v16z"
                fill={color}
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Story"
        component={StoryModeScreen}
        options={{
          tabBarLabel: 'Story',
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path
                d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15l3.5-4.5 2.5 3.01L14.5 9l4.5 6H5z"
                fill={color}
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                fill={color}
              />
            </Svg>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
