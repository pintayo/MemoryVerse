/**
 * Story Mode Screen
 * Coming soon placeholder for interactive Bible stories feature
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { logger } from '../utils/logger';

export const StoryModeScreen = () => {
  const handleNotifyMe = () => {
    Alert.alert(
      "Thanks for Your Interest! 🙏",
      "We'll notify you when Story Mode launches. Season 1 coming in 4-6 weeks!",
      [{ text: "Awesome!", style: "default" }]
    );
    logger.log('[StoryModeScreen] User interested in Story Mode notifications');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handleNotifyMe}
        activeOpacity={0.95}
      >
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
              style={styles.notifyButton}
              onPress={handleNotifyMe}
              activeOpacity={0.8}
            >
              <Text style={styles.notifyButtonText}>Notify Me When It Launches</Text>
            </TouchableOpacity>

            <Text style={styles.launchInfo}>Launching in 4-6 weeks</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
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
