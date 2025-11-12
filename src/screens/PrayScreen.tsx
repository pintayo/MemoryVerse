import React, { useState, useRef, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../components';
import { theme } from '../theme';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../utils/logger';
import { generateDailyPrayer, getFallbackDailyPrayer } from '../services/dailyPrayerService';

type Props = NativeStackScreenProps<RootStackParamList, 'Pray'>;

type PrayerCategory = 'morning' | 'evening' | 'mealtime' | 'bedtime' | 'gratitude' | 'comfort' | 'guidance' | 'forgiveness';

interface PrayerOption {
  id: PrayerCategory | 'daily';
  title: string;
  subtitle: string;
  icon: any;
  isPremium?: boolean;
  color: string;
}

const prayerOptions: PrayerOption[] = [
  { id: 'morning', title: 'Morning Prayer', subtitle: 'Start your day with God', icon: 'sunny', color: theme.colors.success.celebratoryGold },
  { id: 'evening', title: 'Evening Prayer', subtitle: 'End your day in reflection', icon: 'moon', color: theme.colors.primary.mutedStone },
  { id: 'mealtime', title: 'Mealtime Prayer', subtitle: 'Give thanks for your food', icon: 'restaurant', color: theme.colors.secondary.warmTerracotta },
  { id: 'bedtime', title: 'Bedtime Prayer', subtitle: 'Rest in His peace', icon: 'bed', color: theme.colors.primary.darkCharcoal },
  { id: 'gratitude', title: 'Gratitude Prayer', subtitle: 'Count your blessings', icon: 'heart', color: theme.colors.secondary.lightGold },
  { id: 'comfort', title: 'Prayer for Comfort', subtitle: 'Find peace in difficult times', icon: 'shield-checkmark', color: theme.colors.accent.burnishedGold },
  { id: 'guidance', title: 'Prayer for Guidance', subtitle: 'Seek His direction', icon: 'compass', color: theme.colors.primary.mutedStone },
  { id: 'forgiveness', title: 'Prayer for Forgiveness', subtitle: 'Ask for mercy and grace', icon: 'hand-right', color: theme.colors.secondary.warmTerracotta },
];

const PrayScreen: React.FC<Props> = ({ navigation }) => {
  const { profile } = useAuth();
  const isPremiumUser = profile?.is_premium || false;

  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory | 'daily' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [dayStory, setDayStory] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [generatedPrayer, setGeneratedPrayer] = useState('');
  const [isGeneratingPrayer, setIsGeneratingPrayer] = useState(false);

  const micPulseAnim = useRef(new Animated.Value(1)).current;

  useLayoutEffect(() => {
    if (selectedCategory === 'daily') {
      navigation.setOptions({
        headerTitle: 'Tell About Your Day',
        headerBackVisible: true,
      });
    } else if (selectedCategory) {
      navigation.setOptions({
        headerTitle: prayerOptions.find(o => o.id === selectedCategory)?.title || 'Prayer',
        headerBackVisible: true,
      });
    } else {
      navigation.setOptions({
        headerTitle: 'Prayer Training',
        headerBackVisible: true,
      });
    }
  }, [selectedCategory, navigation]);

  const handleCategorySelect = (category: PrayerCategory | 'daily') => {
    if (category === 'daily') {
      if (!isPremiumUser) {
        Alert.alert(
          'Premium Feature',
          'Tell About Your Day prayer generation is a premium feature. Upgrade to access this and more!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => navigation.navigate('PremiumUpgrade') },
          ]
        );
        return;
      }
    }
    setSelectedCategory(category);
  };

  const startRecording = () => {
    setIsRecording(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(micPulseAnim, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(micPulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    micPulseAnim.stopAnimation();
    micPulseAnim.setValue(1);

    // Simulate voice-to-text
    const simulatedTranscript = "I had a wonderful day filled with blessings...";
    setTranscribedText(simulatedTranscript);
    setDayStory(dayStory + (dayStory ? ' ' : '') + simulatedTranscript);
    logger.log('[PrayScreen] Voice transcribed (simulated)');
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleGeneratePrayer = async () => {
    if (!dayStory.trim()) {
      Alert.alert('Tell Us More', 'Please share something about your day first.');
      return;
    }

    try {
      setIsGeneratingPrayer(true);
      logger.log('[PrayScreen] Generating prayer from day story');

      // Generate AI-powered prayer
      const result = await generateDailyPrayer(dayStory);

      if (result.success && result.prayer) {
        setGeneratedPrayer(result.prayer);
        logger.log('[PrayScreen] Prayer generated successfully');
      } else {
        // Use fallback prayer if AI fails
        logger.warn('[PrayScreen] AI generation failed, using fallback:', result.error);
        const fallbackPrayer = getFallbackDailyPrayer(dayStory);
        setGeneratedPrayer(fallbackPrayer);

        // Optionally notify user that we used a fallback
        Alert.alert(
          'Prayer Generated',
          'We created a prayer for you. AI enhancement is temporarily unavailable.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error('[PrayScreen] Error generating prayer:', error);

      // Use fallback prayer on error
      const fallbackPrayer = getFallbackDailyPrayer(dayStory);
      setGeneratedPrayer(fallbackPrayer);

      Alert.alert(
        'Prayer Created',
        'We created a prayer for you. AI services are temporarily unavailable.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingPrayer(false);
    }
  };

  const handleResetPrayer = () => {
    setDayStory('');
    setTranscribedText('');
    setGeneratedPrayer('');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setDayStory('');
    setTranscribedText('');
    setGeneratedPrayer('');
  };

  if (selectedCategory === 'daily') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {isPremiumUser && (
            <View style={styles.premiumBadge}>
              <Svg width="16" height="16" viewBox="0 0 24 24">
                <Path
                  d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"
                  fill={theme.colors.secondary.lightGold}
                />
              </Svg>
              <Text style={styles.premiumBadgeText}>Premium Feature</Text>
            </View>
          )}

          <Card variant="warm" style={styles.inputCard}>
            <Text style={styles.inputLabel}>How was your day?</Text>
            <TextInput
              style={styles.textArea}
              value={dayStory}
              onChangeText={setDayStory}
              placeholder="Share your thoughts, feelings, joys, struggles, or gratitude..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
              editable={!isGeneratingPrayer}
            />
            <Text style={styles.charCount}>{dayStory.length} / 1000 characters</Text>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or speak</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={toggleRecording}
            >
              <Ionicons
                name={isRecording ? "stop-circle" : "mic"}
                size={28}
                color={isRecording ? theme.colors.text.onDark : theme.colors.secondary.warmTerracotta}
              />
              <Text style={[styles.voiceButtonText, isRecording && styles.voiceButtonTextActive]}>
                {isRecording ? 'Stop Recording' : 'Tap to Speak'}
              </Text>
            </TouchableOpacity>

            {transcribedText && (
              <View style={styles.transcriptNotice}>
                <Text style={styles.transcriptText}>✓ Voice added to your story</Text>
              </View>
            )}
          </Card>

          <Button
            title={isGeneratingPrayer ? 'Crafting Your Prayer...' : 'Generate Prayer'}
            onPress={handleGeneratePrayer}
            variant="gold"
            style={styles.generateButton}
            disabled={isGeneratingPrayer}
          />

          {generatedPrayer && (
            <Card variant="parchment" style={styles.prayerCard}>
              <View style={styles.prayerHeader}>
                <Text style={styles.prayerTitle}>Your Prayer</Text>
                <TouchableOpacity onPress={handleResetPrayer}>
                  <Text style={styles.newPrayerText}>New Prayer</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.prayerText}>{generatedPrayer}</Text>
              <View style={styles.aiGeneratedNotice}>
                <Ionicons name="sparkles" size={14} color={theme.colors.secondary.lightGold} />
                <Text style={styles.aiGeneratedText}>
                  Crafted with AI just for you ✨
                </Text>
              </View>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (selectedCategory) {
    // Coming soon for other categories
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.comingSoonContainer}>
          <Ionicons name="time" size={64} color={theme.colors.secondary.lightGold} />
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonDescription}>
            Guided prayers for different occasions are being developed. Check back soon!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Tell About Your Day - Premium Feature at Top */}
        <TouchableOpacity
          style={styles.premiumFeatureCard}
          onPress={() => handleCategorySelect('daily')}
          activeOpacity={0.8}
        >
          <View style={styles.premiumFeatureHeader}>
            <View style={styles.premiumIconContainer}>
              <Svg width="28" height="28" viewBox="0 0 24 24">
                <Path
                  d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"
                  fill={theme.colors.secondary.lightGold}
                />
              </Svg>
            </View>
            <View style={styles.premiumFeatureTextContainer}>
              <Text style={styles.premiumFeatureTitle}>Tell About Your Day</Text>
              <Text style={styles.premiumFeatureSubtitle}>AI-powered personal prayer just for you</Text>
            </View>
            {isPremiumUser ? (
              <View style={styles.premiumAccessBadge}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success.celebratoryGold} />
              </View>
            ) : (
              <View style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>UPGRADE</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.colors.text.onDark} />
              </View>
            )}
          </View>
          {!isPremiumUser && (
            <View style={styles.premiumFeatureFooter}>
              <Text style={styles.premiumFeatureFooterText}>
                Share your day and receive a personalized prayer crafted with AI
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.sectionTitle}>Prayer Categories</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.categoriesGrid}>
          {prayerOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.categoryCard}
              onPress={() => handleCategorySelect(option.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon as any} size={28} color={option.color} />
              </View>
              <Text style={styles.categoryTitle}>{option.title}</Text>
              <Text style={styles.categorySubtitle}>{option.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  inlineBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  inlineBackButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.xs,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  inlineBackText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '500',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  premiumFeatureCard: {
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.secondary.lightGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  premiumFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary.lightGold + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumFeatureTextContainer: {
    flex: 1,
  },
  premiumFeatureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: 2,
  },
  premiumFeatureSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 16,
  },
  premiumAccessBadge: {
    padding: theme.spacing.xs,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.lightGold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  upgradeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
  premiumFeatureFooter: {
    backgroundColor: theme.colors.secondary.lightGold + '12',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary.lightGold + '25',
  },
  premiumFeatureFooterText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.primary.mutedStone + '40',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '47.5%',
    backgroundColor: theme.colors.background.lightCream,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary.mutedStone + '60',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  categorySubtitle: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 15,
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
    gap: 6,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
  },
  premiumLabel: {
    backgroundColor: theme.colors.secondary.lightGold,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  premiumLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
  upgradeLabel: {
    backgroundColor: theme.colors.secondary.warmTerracotta,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  upgradeLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
  },
  inputCard: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  textArea: {
    backgroundColor: theme.colors.background.cream,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    minHeight: 140,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
    marginBottom: theme.spacing.xs,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.primary.mutedStone,
  },
  dividerText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
    marginHorizontal: theme.spacing.sm,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.lightCream,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.secondary.warmTerracotta,
    gap: theme.spacing.sm,
  },
  voiceButtonActive: {
    backgroundColor: theme.colors.secondary.warmTerracotta,
  },
  voiceButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.secondary.warmTerracotta,
    fontFamily: theme.typography.fonts.ui.default,
  },
  voiceButtonTextActive: {
    color: theme.colors.text.onDark,
  },
  transcriptNotice: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.success.celebratoryGold + '20',
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  transcriptText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  generateButton: {
    marginBottom: theme.spacing.lg,
  },
  prayerCard: {
    marginBottom: theme.spacing.lg,
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
  newPrayerText: {
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
  aiGeneratedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.lightGold + '15',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.secondary.lightGold + '30',
  },
  aiGeneratedText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  comingSoonDescription: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  backToCategoriesButton: {
    marginTop: theme.spacing.md,
  },
});

export default PrayScreen;
