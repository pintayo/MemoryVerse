import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

interface DailyPrayerScreenProps {
  navigation: any;
}

export const DailyPrayerScreen: React.FC<DailyPrayerScreenProps> = ({ navigation }) => {
  const { profile } = useAuth();
  const isPremiumUser = profile?.is_premium || false;

  const [dayStory, setDayStory] = useState('');
  const [generatedPrayer, setGeneratedPrayer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePrayer = async () => {
    if (!dayStory.trim()) {
      Alert.alert('Tell Us More', 'Please share something about your day first.');
      return;
    }

    if (!isPremiumUser) {
      Alert.alert(
        'Premium Feature',
        'AI-generated daily prayers are a premium feature. Upgrade to access this and more!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => navigation.navigate('PremiumUpgrade'),
          },
        ]
      );
      return;
    }

    try {
      setIsGenerating(true);
      logger.log('[DailyPrayerScreen] Generating prayer from day story');

      // TODO: Implement actual AI prayer generation API call
      // For now, show a coming soon message
      await new Promise(resolve => setTimeout(resolve, 2000));

      setGeneratedPrayer(
        `Heavenly Father,\n\nThank You for this day and all its moments. ${dayStory}\n\nI lift up these experiences to You, trusting in Your perfect plan and timing. Help me to see Your hand in every situation and to grow closer to You through both joys and challenges.\n\nIn Jesus' name I pray, Amen.`
      );
    } catch (error) {
      logger.error('[DailyPrayerScreen] Error generating prayer:', error);
      Alert.alert('Error', 'Failed to generate prayer. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setDayStory('');
    setGeneratedPrayer('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M15 18 L9 12 L15 6"
              stroke={theme.colors.text.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Prayer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Badge */}
        {isPremiumUser && (
          <View style={styles.premiumBadge}>
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"
                fill={theme.colors.secondary.lightGold}
              />
            </Svg>
            <Text style={styles.premiumBadgeText}>Premium Feature</Text>
          </View>
        )}

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Tell About Your Day</Text>
          <Text style={styles.introText}>
            Share what's on your heart today, and we'll help you turn it into a meaningful prayer.
            Include your joys, struggles, gratitude, or concerns.
          </Text>
        </View>

        {/* Input Area */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>How was your day?</Text>
          <TextInput
            style={styles.textArea}
            value={dayStory}
            onChangeText={setDayStory}
            placeholder="Share your thoughts, feelings, and experiences from today..."
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={1000}
            editable={!isGenerating}
          />
          <Text style={styles.charCount}>
            {dayStory.length} / 1000 characters
          </Text>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGeneratePrayer}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator color={theme.colors.text.onDark} style={{ marginRight: 8 }} />
              <Text style={styles.generateButtonText}>Crafting Your Prayer...</Text>
            </>
          ) : (
            <>
              <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <Path
                  d="M9 11.75A1.25 1.25 0 0 0 7.75 13A1.25 1.25 0 0 0 9 14.25A1.25 1.25 0 0 0 10.25 13A1.25 1.25 0 0 0 9 11.75ZM15 11.75A1.25 1.25 0 0 0 13.75 13A1.25 1.25 0 0 0 15 14.25A1.25 1.25 0 0 0 16.25 13A1.25 1.25 0 0 0 15 11.75ZM12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2ZM12 20C7.59 20 4 16.41 4 12C4 11.71 4.02 11.42 4.05 11.14C6.41 10.09 8.28 8.16 9.26 5.77C11.07 8.33 14.05 10 17.42 10C18.2 10 18.95 9.91 19.67 9.74C19.88 10.45 20 11.21 20 12C20 16.41 16.41 20 12 20Z"
                  fill={theme.colors.text.onDark}
                />
              </Svg>
              <Text style={styles.generateButtonText}>Generate Prayer</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generated Prayer */}
        {generatedPrayer && (
          <View style={styles.prayerCard}>
            <View style={styles.prayerHeader}>
              <Text style={styles.prayerTitle}>Your Prayer</Text>
              <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>New Prayer</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.prayerText}>{generatedPrayer}</Text>

            {/* Coming Soon Notice */}
            <View style={styles.comingSoonNotice}>
              <Svg width="16" height="16" viewBox="0 0 24 24">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                  fill={theme.colors.secondary.lightGold}
                />
              </Svg>
              <Text style={styles.comingSoonText}>
                AI-powered prayer generation is coming soon! This is a sample prayer.
              </Text>
            </View>
          </View>
        )}

        {/* Info Box */}
        {!generatedPrayer && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Premium Feature</Text>
            <Text style={styles.infoText}>
              Share your daily experiences and let AI help you express them in prayer form.
              Perfect for:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Processing emotions and experiences</Text>
              <Text style={styles.featureItem}>• Finding words when you're unsure how to pray</Text>
              <Text style={styles.featureItem}>• Deepening your daily devotional practice</Text>
              <Text style={styles.featureItem}>• Journaling your spiritual journey</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.background.warmParchment,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
  },
  introCard: {
    backgroundColor: theme.colors.background.lightCream,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  introText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 22,
  },
  inputCard: {
    backgroundColor: theme.colors.background.cream,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  textArea: {
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    minHeight: 160,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
    marginBottom: theme.spacing.xs,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'right',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondary.lightGold,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
  prayerCard: {
    backgroundColor: theme.colors.background.warmParchment,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  prayerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  resetButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
  },
  prayerText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.scripture.default,
    lineHeight: 26,
    marginBottom: theme.spacing.md,
  },
  comingSoonNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background.lightCream,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  comingSoonText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 16,
  },
  infoBox: {
    backgroundColor: theme.colors.background.lightCream,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  featureList: {
    gap: theme.spacing.xs,
  },
  featureItem: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 20,
  },
});

export default DailyPrayerScreen;
