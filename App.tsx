console.log('[App.tsx] Starting module imports...');

import React from 'react';
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

  // Show loading spinner while checking authentication
  if (isLoading) {
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

  // Show main app if authenticated
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

export default App;
