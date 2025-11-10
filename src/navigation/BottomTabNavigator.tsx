console.log('[BottomTabNavigator] Module loading...');

import React from 'react';
console.log('[BottomTabNavigator] React imported');

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
console.log('[BottomTabNavigator] createBottomTabNavigator imported');

import { HomeScreen, LeaderboardScreen, ProfileScreen } from '../screens';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import SearchScreen from '../screens/SearchScreen';
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
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path
                d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                fill={color}
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill={color}
              />
            </Svg>
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path
                d="M20 4H17V3C17 1.9 16.1 1 15 1H9C7.9 1 7 1.9 7 3V4H4C2.9 4 2 4.9 2 6V10C2 11.66 3.34 13 5 13H5.97C6.53 14.75 7.87 16.16 9.6 16.83V19H8C7.45 19 7 19.45 7 20H17C17 19.45 16.55 19 16 19H14.4V16.83C16.13 16.16 17.47 14.75 18.03 13H19C20.66 13 22 11.66 22 10V6C22 4.9 21.1 4 20 4Z"
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
