console.log('[App.tsx] Starting module imports...');

// Try to load Sentry (optional for testing in Expo Go)
let Sentry: any = null;
try {
  Sentry = require('@sentry/react-native');
  console.log('[App.tsx] Sentry loaded');
} catch (error) {
  console.log('[App.tsx] Sentry not available (testing mode)');
}

import { config } from './src/config/env';

// Initialize Sentry if available and DSN is provided
if (Sentry && config.sentry.dsn && config.sentry.enabled) {
  Sentry.init({
    dsn: config.sentry.dsn,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Enable in production only
    enabled: !__DEV__,
    // Capture user context
    beforeSend(event, hint) {
      // Don't send events in development
      if (__DEV__) {
        console.log('[Sentry] Event captured (dev mode, not sent):', event);
        return null;
      }
      return event;
    },
  });
  console.log('[App.tsx] Sentry initialized');
} else {
  console.log('[App.tsx] Sentry not configured (missing DSN or module)');
}

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

import OnboardingScreen from './src/screens/OnboardingScreen';
console.log('[App.tsx] OnboardingScreen loaded');

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

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        setHasCompletedOnboarding(completed === 'true');
      } catch (error) {
        console.error('[AppNavigator] Error checking onboarding:', error);
        setHasCompletedOnboarding(false);
      }
    };

    if (isAuthenticated) {
      checkOnboarding();
    }
  }, [isAuthenticated]);

  // Track app sessions for review prompt
  useEffect(() => {
    const trackSession = async () => {
      if (isAuthenticated && hasCompletedOnboarding) {
        try {
          await appReviewService.incrementSessionCount();
          console.log('[AppNavigator] Session tracked for review prompt');
        } catch (error) {
          console.error('[AppNavigator] Error tracking session:', error);
        }
      }
    };

    trackSession();
  }, [isAuthenticated, hasCompletedOnboarding]);

  // Show loading spinner while checking authentication or onboarding
  if (isLoading || (isAuthenticated && hasCompletedOnboarding === null)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
      </View>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLoginSuccess={() => {}} />}
        </Stack.Screen>
        <Stack.Screen name="Signup">
          {(props) => <SignupScreen {...props} onSignupSuccess={() => {}} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  // Show onboarding for first-time users
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={() => setHasCompletedOnboarding(true)} />;
  }

  // Show main app if authenticated and onboarding completed
  return <RootNavigator />;
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

// Wrap with Sentry's error boundary for better error tracking
export default config.sentry.dsn ? Sentry.wrap(App) : App;
