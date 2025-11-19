/**
 * Story Mode Screen
 * Coming soon placeholder for interactive Bible stories feature
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { logger } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const StoryModeScreen = () => {
  const { user, profile } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if user is already registered for notifications
  useEffect(() => {
    checkRegistrationStatus();
  }, [user?.id]);

  const checkRegistrationStatus = async () => {
    if (!user?.id) {
      setIsChecking(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('story_mode_notifications')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setIsRegistered(true);
      }
    } catch (error) {
      logger.error('[StoryModeScreen] Error checking registration:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleNotifyMe = async () => {
    if (!user?.id) {
      Alert.alert(
        "Sign In Required",
        "Please sign in or create an account to get notified when Story Mode launches!",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    if (isRegistered) {
      Alert.alert(
        "Already Registered! ✓",
        "You're already on the list! We'll notify you when Story Mode launches.",
        [{ text: "Awesome!", style: "default" }]
      );
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('story_mode_notifications')
        .insert({
          user_id: user.id,
          email: profile?.email || user.email,
          notified: false,
        });

      if (error) throw error;

      setIsRegistered(true);

      Alert.alert(
        "Thanks for Your Interest! 🙏",
        "You're now on the list! We'll notify you when Story Mode launches. Season 1 coming in 4-6 weeks!",
        [{ text: "Awesome!", style: "default" }]
      );

      logger.log('[StoryModeScreen] User registered for Story Mode notifications');
    } catch (error: any) {
      logger.error('[StoryModeScreen] Error registering notification:', error);

      // Check if it's a duplicate key error (user already registered)
      if (error.code === '23505') {
        setIsRegistered(true);
        Alert.alert(
          "Already Registered! ✓",
          "You're already on the list! We'll notify you when Story Mode launches.",
          [{ text: "Awesome!", style: "default" }]
        );
      } else {
        Alert.alert(
          "Oops!",
          "Something went wrong. Please try again later.",
          [{ text: "OK", style: "default" }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.imageContainer}>
        {/* Full screen image with overlay */}
        <ImageBackground
          source={require('../../assets/images/story-mode-preview.png')}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          {/* Dark overlay for better text readability */}
          <View style={styles.overlay}>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>COMING SOON</Text>
            </View>

            <Text style={styles.title}>Story Mode</Text>
            <Text style={styles.subtitle}>Season 1: The Life of Jesus</Text>

            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>📖</Text>
                <Text style={styles.featureText}>Interactive Stories</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🎨</Text>
                <Text style={styles.featureText}>Beautiful Animations</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>❓</Text>
                <Text style={styles.featureText}>Engaging Quizzes</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🎬</Text>
                <Text style={styles.featureText}>Weekly Episodes</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.notifyButton, (isLoading || isChecking) && styles.notifyButtonDisabled]}
              onPress={handleNotifyMe}
              activeOpacity={0.8}
              disabled={isLoading || isChecking}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.notifyButtonText}>
                  {isRegistered ? "✓ You're on the List!" : "Notify Me When It Launches"}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.launchInfo}>Launching in 4-6 weeks</Text>
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary.darkCharcoal,
  },
  imageContainer: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.success.celebratoryGold,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xl,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1.5,
    fontFamily: theme.typography.fonts.ui.default,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: 'white',
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.success.celebratoryGold,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: theme.spacing.xxl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: theme.typography.fonts.ui.default,
  },
  notifyButton: {
    backgroundColor: theme.colors.accent.burnishedGold,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyButtonDisabled: {
    opacity: 0.6,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: theme.typography.fonts.ui.default,
  },
  launchInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
  },
});

export default StoryModeScreen;
