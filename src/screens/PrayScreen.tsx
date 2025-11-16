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
import { canUseTalkAboutDay, useTalkAboutDay, getRemainingUsage, getUserSubscriptionTier, FEATURES } from '../services/usageLimitsService';

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
  const { user, profile } = useAuth();
  const isPremiumUser = profile?.is_premium || false;

  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory | 'daily' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [dayStory, setDayStory] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [generatedPrayer, setGeneratedPrayer] = useState('');
  const [isGeneratingPrayer, setIsGeneratingPrayer] = useState(false);
  const [remainingUses, setRemainingUses] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number>(0);

  const micPulseAnim = useRef(new Animated.Value(1)).current;

  // Load remaining usage when selecting 'daily' category
  useEffect(() => {
    if (selectedCategory === 'daily' && user?.id && isPremiumUser) {
      loadRemainingUsage();
    }
  }, [selectedCategory, user?.id, isPremiumUser]);

  const loadRemainingUsage = async () => {
    if (!user?.id) return;

    const tier = getUserSubscriptionTier(isPremiumUser);
    setDailyLimit(tier.dailyLimit);

    const remaining = await getRemainingUsage(user.id, FEATURES.TALK_ABOUT_DAY, tier.dailyLimit);
    setRemainingUses(remaining);
    logger.log('[PrayScreen] Remaining uses loaded:', remaining, 'of', tier.dailyLimit);
  };

  useLayoutEffect(() => {
    if (selectedCategory === 'daily') {
      navigation.setOptions({
        headerTitle: 'Tell About Your Day',
        headerBackVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={handleBackToCategories} style={{ paddingLeft: 16 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        ),
      });
    } else if (selectedCategory) {
      navigation.setOptions({
        headerTitle: prayerOptions.find(o => o.id === selectedCategory)?.title || 'Prayer',
        headerBackVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={handleBackToCategories} style={{ paddingLeft: 16 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        ),
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

    // Check usage limits
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to use this feature.');
      return;
    }

    if (!isPremiumUser) {
      Alert.alert(
        'Premium Feature',
        'This feature requires a premium subscription.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('PremiumUpgrade') },
        ]
      );
      return;
    }

    // Check if user has remaining uses
    if (remainingUses !== null && remainingUses <= 0) {
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${dailyLimit} daily prayers. Your limit resets at midnight!`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsGeneratingPrayer(true);
      logger.log('[PrayScreen] Generating prayer from day story');

      // Increment usage count
      const usageResult = await useTalkAboutDay(user.id, isPremiumUser);

      if (!usageResult.success) {
        Alert.alert('Limit Reached', usageResult.message || 'Unable to generate prayer at this time.');
        setIsGeneratingPrayer(false);
        return;
      }

      // Update remaining uses
      setRemainingUses(usageResult.remaining);
      logger.log('[PrayScreen] Usage incremented. Remaining:', usageResult.remaining);

      // Generate AI-powered prayer
      const result = await generateDailyPrayer(dayStory);

      if (result.success && result.prayer) {
        setGeneratedPrayer(result.prayer);
        logger.log('[PrayScreen] Prayer generated successfully');

        // Show remaining uses
        if (usageResult.remaining === 0) {
          Alert.alert(
            'Prayer Generated',
            `Your prayer is ready! This was your last prayer for today. Your limit resets at midnight.`,
            [{ text: 'OK' }]
          );
        } else if (usageResult.remaining <= 2) {
          Alert.alert(
            'Prayer Generated',
            `Your prayer is ready! You have ${usageResult.remaining} prayer${usageResult.remaining === 1 ? '' : 's'} remaining today.`,
            [{ text: 'OK' }]
          );
        }
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

          {isPremiumUser && remainingUses !== null && (
            <View style={styles.usageLimitBadge}>
              <Ionicons name="heart" size={16} color={
                remainingUses === 0 ? theme.colors.error.main :
                remainingUses <= 2 ? theme.colors.secondary.warmTerracotta :
                theme.colors.success.mutedOlive
              } />
              <Text style={[styles.usageLimitText, remainingUses === 0 && styles.usageLimitTextZero]}>
                {remainingUses === 0
                  ? 'No prayers remaining today (resets at midnight)'
                  : `${remainingUses} of ${dailyLimit} prayers remaining today`}
              </Text>
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
    // Category-specific prayers
    const selectedOption = prayerOptions.find(o => o.id === selectedCategory);

    // Get category-specific prayer
    const getCategoryPrayer = (category: PrayerCategory): string => {
      const prayers = {
        morning: `Heavenly Father,

Thank You for the gift of this new day. As the morning light breaks, I come before You with a grateful heart.

Guide my steps today. Help me to walk in Your ways, to speak words of kindness, and to act with love in all I do.

Fill me with Your strength and wisdom for the challenges ahead. May Your presence be my comfort and Your Word be my guide.

In Jesus' name I pray, Amen.`,

        evening: `Dear Lord,

As this day comes to a close, I thank You for Your faithfulness and Your constant presence with me.

I reflect on the moments of today - the joys, the challenges, and the lessons learned. Thank You for walking beside me through it all.

As I prepare for rest, grant me peaceful sleep. Renew my strength for tomorrow and help me to wake with a heart ready to serve You.

In Jesus' name, Amen.`,

        mealtime: `Gracious God,

We thank You for this food before us, for the hands that prepared it, and for Your provision in our lives.

Bless this meal to nourish our bodies, and bless this time together. May we always remember those who have less and inspire us to share generously.

We are grateful for Your abundance and Your loving care.

In Jesus' name, Amen.`,

        bedtime: `Loving Father,

As I lay down to sleep, I place myself in Your caring hands. Thank You for being with me throughout this day.

Watch over me through the night. Grant me restful sleep and peaceful dreams. Calm any worries and renew my spirit.

May I wake tomorrow refreshed and ready to serve You with joy.

In Jesus' name I pray, Amen.`,

        gratitude: `Dear God,

My heart overflows with gratitude for Your countless blessings. Thank You for Your love that never fails and Your mercy that is new every morning.

Thank You for my family, my friends, my health, and the simple joys of life. Thank You for the challenges that help me grow and the victories that remind me of Your goodness.

Help me to live each day with a thankful heart, never taking Your blessings for granted.

In Jesus' name, Amen.`,

        comfort: `Compassionate Father,

In this difficult time, I come to You seeking comfort and peace. You are close to the brokenhearted and save those who are crushed in spirit.

Wrap Your loving arms around me. Heal my hurts, calm my fears, and restore my hope. Remind me that You are always with me, even in the darkest valleys.

Give me strength for today and hope for tomorrow. Help me to trust in Your perfect plan, even when I don't understand.

In Jesus' name I pray, Amen.`,

        guidance: `Wise and Loving God,

I come before You seeking Your guidance and direction. I don't always know the right path to take, but I trust that You do.

Illuminate my way with Your wisdom. Open doors that should be opened and close those that should remain shut. Give me discernment to make decisions that honor You.

Help me to listen for Your voice and to follow where You lead. May Your will be done in my life.

In Jesus' name, Amen.`,

        forgiveness: `Merciful Father,

I come before You acknowledging my sins and mistakes. I have fallen short of Your glory and strayed from Your path.

I ask for Your forgiveness. Cleanse me from all unrighteousness and create in me a clean heart. Help me to forgive others as You have forgiven me.

Thank You for Your grace that covers my sins and Your love that never gives up on me. Help me to walk in Your ways and to live a life that honors You.

In Jesus' name I pray, Amen.`,
      };

      return prayers[category];
    };

    const categoryPrayer = getCategoryPrayer(selectedCategory);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.categoryPrayerContainer}>
            <View style={[styles.categoryIconLarge, { backgroundColor: selectedOption?.color + '20' }]}>
              <Ionicons
                name={selectedOption?.icon as any}
                size={48}
                color={selectedOption?.color}
              />
            </View>

            <Text style={styles.categoryPrayerTitle}>{selectedOption?.title}</Text>
            <Text style={styles.categoryPrayerSubtitle}>{selectedOption?.subtitle}</Text>

            <Card variant="parchment" style={styles.prayerCard}>
              <Text style={styles.prayerText}>{categoryPrayer}</Text>
            </Card>

            <Text style={styles.prayerInstructions}>
              Read this prayer aloud or silently, making it your own. Let it guide your conversation with God.
            </Text>
          </View>
        </ScrollView>
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
  usageLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.background.lightCream,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary.oatmeal,
  },
  usageLimitText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  usageLimitTextZero: {
    color: theme.colors.error.main,
    fontWeight: '600',
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
  categoryPrayerContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
  },
  categoryIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryPrayerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  categoryPrayerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  prayerInstructions: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
});

export default PrayScreen;
