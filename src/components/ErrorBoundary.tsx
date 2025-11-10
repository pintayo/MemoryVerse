import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { theme } from '../theme';
import { logger } from '../utils/logger';
import { analyticsService } from '../services/analyticsService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[ErrorBoundary] Caught error:', error);
    logger.error('[ErrorBoundary] Error info:', errorInfo);

    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Log to Analytics
    analyticsService.logError(
      error.message || 'Unknown error',
      error.stack,
      'ErrorBoundary'
    );

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>⚠️ Something Went Wrong</Text>

            <Text style={styles.message}>
              The app encountered an error. This is usually due to:
            </Text>

            <View style={styles.list}>
              <Text style={styles.listItem}>• Missing Supabase configuration</Text>
              <Text style={styles.listItem}>• Database connection issues</Text>
              <Text style={styles.listItem}>• Cache/build issues</Text>
            </View>

            {this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}

            <Text style={styles.instructions}>
              Try these steps:
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>1. Check your .env file has valid Supabase keys</Text>
              <Text style={styles.listItem}>2. Stop Expo and run: npx expo start --clear</Text>
              <Text style={styles.listItem}>3. If still failing, run: ./nuclear-reset.sh</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  content: {
    padding: theme.spacing.xl,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  list: {
    marginBottom: theme.spacing.lg,
    paddingLeft: theme.spacing.md,
  },
  listItem: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: theme.colors.error.light,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.error.main,
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error.main,
    fontFamily: 'monospace',
  },
  instructions: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  button: {
    backgroundColor: theme.colors.secondary.lightGold,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.onDark,
    textAlign: 'center',
  },
});

export default ErrorBoundary;
