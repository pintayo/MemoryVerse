import React from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import { ErrorBoundary } from './src/components';
import { theme } from './src/theme';

// Global error handlers to catch module-level errors
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('[Global Error Handler]', { isFatal, error });
  console.error('[Global Error] Name:', error.name);
  console.error('[Global Error] Message:', error.message);
  console.error('[Global Error] Stack:', error.stack);
});

// Catch unhandled promise rejections
const originalHandler = global.Promise.prototype.catch;
global.Promise.prototype.catch = function (onRejected) {
  return originalHandler.call(this, (error) => {
    console.error('[Unhandled Promise Rejection]', error);
    if (onRejected) return onRejected(error);
    throw error;
  });
};

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

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

const App = () => {
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
});

export default App;
