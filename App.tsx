console.log('[App.tsx] =============== Starting module imports ===============');

import { ENABLE_NATIVE_MODULES } from './src/config/nativeModules';

console.log('[App.tsx] ENABLE_NATIVE_MODULES imported:', ENABLE_NATIVE_MODULES);
console.log('[App.tsx] ENABLE_NATIVE_MODULES type:', typeof ENABLE_NATIVE_MODULES);

import { config } from './src/config/env';

console.log('[App.tsx] config imported');

// Try to load Sentry (only in production builds, not Expo Go)
let Sentry: any = null;

console.log('[App.tsx] About to check ENABLE_NATIVE_MODULES...');
console.log('[App.tsx] ENABLE_NATIVE_MODULES value:', ENABLE_NATIVE_MODULES);

if (ENABLE_NATIVE_MODULES) {
  console.log('[App.tsx] NATIVE MODULES ENABLED - Will try to load Sentry');
  try {
    console.log('[App.tsx] Attempting to require @sentry/react-native...');
    Sentry = require('@sentry/react-native');
    console.log('[App.tsx] Sentry module loaded successfully');

    // Initialize Sentry if DSN is provided
    if (config.sentry.dsn && config.sentry.enabled) {
      console.log('[App.tsx] Sentry DSN found, attempting to initialize...');
      try {
        Sentry.init({
          dsn: config.sentry.dsn,
          tracesSampleRate: __DEV__ ? 1.0 : 0.2,
          enabled: !__DEV__,
          beforeSend(event, hint) {
            if (__DEV__) {
              console.log('[Sentry] Event captured (dev mode, not sent):', event);
              return null;
            }
            return event;
          },
        });
        console.log('[App.tsx] Sentry initialized successfully');
      } catch (error) {
        console.log('[App.tsx] Sentry init failed:', error);
        Sentry = null;
      }
    } else {
      console.log('[App.tsx] No Sentry DSN configured or not enabled');
    }
  } catch (error) {
    console.log('[App.tsx] Sentry require failed:', error);
  }
} else {
  console.log('[App.tsx] ⚠️  NATIVE MODULES DISABLED (Expo Go mode) - Sentry will NOT be loaded');
}

console.log('[App.tsx] Sentry loading complete. Sentry is:', Sentry === null ? 'NULL' : 'LOADED');

import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
console.log('[App.tsx] React Native imports loaded');

import { NavigationContainer } from '@react-navigation/native';
console.log('[App.tsx] NavigationContainer loaded');

import { SafeAreaProvider } from 'react-native-safe-area-context';
console.log('[App.tsx] SafeAreaProvider loaded');

import { GestureHandlerRootView } from 'react-native-gesture-handler';
console.log('[App.tsx] GestureHandlerRootView loaded');

import { createStackNavigator } from '@react-navigation/stack';
console.log('[App.tsx] createStackNavigator loaded');

import AsyncStorage from '@react-native-async-storage/async-storage';
console.log('[App.tsx] AsyncStorage loaded');

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
console.log('[App.tsx] AuthContext loaded');

import RootNavigator from './src/navigation/RootNavigator';
console.log('[App.tsx] RootNavigator loaded');

import LoginScreen from './src/screens/LoginScreen';
console.log('[App.tsx] LoginScreen loaded');

import SignupScreen from './src/screens/SignupScreen';
console.log('[App.tsx] SignupScreen loaded');

import { ErrorBoundary } from './src/components';
console.log('[App.tsx] ErrorBoundary loaded');

import { theme } from './src/theme';
console.log('[App.tsx] theme loaded');

import { appReviewService } from './src/services/appReviewService';
console.log('[App.tsx] appReviewService loaded');

console.log('[App.tsx] ALL IMPORTS COMPLETE!');

console.log('[App.tsx] Setting up global error handlers...');

// Global error handlers to catch module-level errors
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('[Global Error Handler] CAUGHT ERROR!');
  console.error('[Global Error] isFatal:', isFatal);
  console.error('[Global Error] Name:', error.name);
  console.error('[Global Error] Message:', error.message);
  console.error('[Global Error] Stack:', error.stack);
});

console.log('[App.tsx] Global error handler set up successfully');

// Catch unhandled promise rejections
const originalHandler = global.Promise.prototype.catch;
global.Promise.prototype.catch = function (onRejected) {
  return originalHandler.call(this, (error) => {
    console.error('[Unhandled Promise Rejection]', error);
    if (onRejected) return onRejected(error);
    throw error;
  });
};

console.log('[App.tsx] Promise rejection handler set up');

const Stack = createStackNavigator();

console.log('[App.tsx] About to define AppNavigator...');

const AppNavigator = () => {
  console.log('[AppNavigator] Component rendering...');
  const { isAuthenticated, isLoading } = useAuth();
  console.log('[AppNavigator] useAuth called, isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // Track app sessions for review prompt
  useEffect(() => {
    const trackSession = async () => {
      if (isAuthenticated) {
        try {
          await appReviewService.incrementSessionCount();
          console.log('[AppNavigator] Session tracked for review prompt');
        } catch (error) {
          console.error('[AppNavigator] Error tracking session:', error);
        }
      }
    };

    trackSession();
  }, [isAuthenticated]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
      </View>
    );
  }

  // Allow both authenticated and guest users to access main app
  // Guest users will see sign-up prompts when trying to use certain features
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Main app available to both authenticated and guest users */}
      <Stack.Screen name="Main" component={RootNavigator} />

      {/* Auth screens accessible from within the app */}
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLoginSuccess={() => props.navigation.navigate('Main')} />}
      </Stack.Screen>
      <Stack.Screen name="Signup">
        {(props) => <SignupScreen {...props} onSignupSuccess={() => props.navigation.navigate('Main')} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

console.log('[App.tsx] About to define App component...');

const App = () => {
  console.log('[App] Root component rendering...');
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <NavigationContainer>
              <StatusBar
                barStyle="dark-content"
                backgroundColor={theme.colors.background.offWhiteParchment}
              />
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

console.log('[App.tsx] App component defined successfully');

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
});

// Wrap with Sentry's error boundary for better error tracking (only if Sentry is loaded)
export default (ENABLE_NATIVE_MODULES && Sentry && config.sentry.dsn) ? Sentry.wrap(App) : App;
