import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, VerseReference } from '../components';
import { theme } from '../theme';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { verseService } from '../services/verseService';
import { Verse } from '../types/database';
import { logger } from '../utils/logger';
import { generatePrayerGuidance, getFallbackPrayerGuide, PrayerGuide } from '../services/prayerCoachingService';
import { useAuth } from '../contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Pray'>;

type PrayMode = 'verse' | 'daily';

const PrayScreen: React.FC<Props> = ({ navigation, route }) => {
  const { verseId } = route.params;
  const { profile } = useAuth();
  const isPremiumUser = profile?.is_premium || false;

  const [mode, setMode] = useState<PrayMode>('verse');
  const [verse, setVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [prayerGuide, setPrayerGuide] = useState<PrayerGuide | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [useAIGuide, setUseAIGuide] = useState(false);

  // Daily prayer state
  const [dayStory, setDayStory] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [generatedPrayer, setGeneratedPrayer] = useState('');
  const [isGeneratingPrayer, setIsGeneratingPrayer] = useState(false);

  // Animation values
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Load verse on mount
  useEffect(() => {
    loadVerse();
  }, [verseId]);

  const loadVerse = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let loadedVerse: Verse | null;
      if (verseId) {
        loadedVerse = await verseService.getVerseById(verseId);
      } else {
        loadedVerse = await verseService.getRandomVerse('KJV');
      }

      if (loadedVerse) {
        setVerse(loadedVerse);
      } else {
        setError('Verse not found. Please try again.');
      }
    } catch (err) {
      logger.error('[PrayScreen] Error loading verse:', err);
      setError('Failed to load verse. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIPrayerGuide = async () => {
    if (!verse) return;

    try {
      setIsGeneratingGuide(true);
      setUseAIGuide(true);
      setShowGuidance(true);

      logger.log('[PrayScreen] Generating AI prayer guidance...');
      const result = await generatePrayerGuidance(verse);

      if (result.success && result.guide) {
        setPrayerGuide(result.guide);
        logger.log('[PrayScreen] AI prayer guidance generated successfully');
      } else {
        logger.warn('[PrayScreen] AI generation failed, using fallback');
        setPrayerGuide(getFallbackPrayerGuide(verse));
      }
    } catch (err) {
      logger.error('[PrayScreen] Error generating AI prayer guidance:', err);
      setPrayerGuide(getFallbackPrayerGuide(verse));
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setHasRecorded(true);

    // Microphone pulse animation
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

    // Waveform animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    micPulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    micPulseAnim.setValue(1);
    waveAnim.setValue(0);

    if (mode === 'daily') {
      // Simulate voice-to-text transcription
      // TODO: Implement actual voice recognition
      const simulatedTranscript = "I had a wonderful day filled with blessings...";
      setTranscribedText(simulatedTranscript);
      setDayStory(dayStory + (dayStory ? ' ' : '') + simulatedTranscript);
      logger.log('[PrayScreen] Voice transcribed (simulated)');
    }
  };

  const toggleRecording = () => {
    if (mode === 'daily' && !isPremiumUser) {
      Alert.alert(
        'Premium Feature',
        'Voice prayer generation is a premium feature. Upgrade to access this and more!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('PremiumUpgrade') },
        ]
      );
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleGenerateDailyPrayer = async () => {
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
          { text: 'Upgrade', onPress: () => navigation.navigate('PremiumUpgrade') },
        ]
      );
      return;
    }

    try {
      setIsGeneratingPrayer(true);
      logger.log('[PrayScreen] Generating prayer from day story');

      // TODO: Implement actual AI prayer generation API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setGeneratedPrayer(
        `Heavenly Father,\n\nThank You for this day and all its moments. ${dayStory}\n\nI lift up these experiences to You, trusting in Your perfect plan and timing. Help me to see Your hand in every situation and to grow closer to You through both joys and challenges.\n\nIn Jesus' name I pray, Amen.`
      );
    } catch (error) {
      logger.error('[PrayScreen] Error generating prayer:', error);
      Alert.alert('Error', 'Failed to generate prayer. Please try again.');
    } finally {
      setIsGeneratingPrayer(false);
    }
  };

  const handleResetDailyPrayer = () => {
    setDayStory('');
    setTranscribedText('');
    setGeneratedPrayer('');
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.scrollContent, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme.colors.secondary.warmTerracotta} />
          <Text style={styles.loadingText}>Loading verse...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || !verse) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.scrollContent, styles.centerContent]}>
          <Text style={styles.errorText}>{error || 'Verse not found'}</Text>
          <Button
            title="Try Again"
            onPress={loadVerse}
            variant="gold"
            style={styles.retryButton}
          />
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const verseReference = verse ? `${verse.book} ${verse.chapter}:${verse.verse_number}` : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'verse' && styles.modeButtonActive]}
            onPress={() => setMode('verse')}
          >
            <Text style={[styles.modeButtonText, mode === 'verse' && styles.modeButtonTextActive]}>
              Pray with Verse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'daily' && styles.modeButtonActive]}
            onPress={() => setMode('daily')}
          >
            <Text style={[styles.modeButtonText, mode === 'daily' && styles.modeButtonTextActive]}>
              Tell About Your Day
            </Text>
            {isPremiumUser && (
              <Svg width="16" height="16" viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
                <Path
                  d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"
                  fill={theme.colors.secondary.lightGold}
                />
              </Svg>
            )}
          </TouchableOpacity>
        </View>

        {mode === 'verse' ? (
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Prayer Training</Text>
              <Text style={styles.subtitle}>Practice praying this verse aloud</Text>
            </View>

        {/* Verse Card */}
        <Card variant="warm" style={styles.verseCard}>
          <Text style={styles.verseText}>{verse.text}</Text>
          <VerseReference style={styles.reference}>
            {verseReference}
          </VerseReference>
        </Card>

        {/* Prayer Guidance Options */}
        {!showGuidance ? (
          <View style={styles.guidanceOptions}>
            <TouchableOpacity
              onPress={() => {
                setShowGuidance(true);
                setUseAIGuide(false);
              }}
              style={styles.guidanceToggle}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z"
                  fill={theme.colors.secondary.lightGold}
                />
              </Svg>
              <Text style={styles.guidanceToggleText}>Prayer Guide</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={generateAIPrayerGuide}
              style={[styles.guidanceToggle, styles.aiToggle]}
              disabled={isGeneratingGuide}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path
                  d="M9 11.75A1.25 1.25 0 0 0 7.75 13A1.25 1.25 0 0 0 9 14.25A1.25 1.25 0 0 0 10.25 13A1.25 1.25 0 0 0 9 11.75ZM15 11.75A1.25 1.25 0 0 0 13.75 13A1.25 1.25 0 0 0 15 14.25A1.25 1.25 0 0 0 16.25 13A1.25 1.25 0 0 0 15 11.75ZM12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2ZM12 20C7.59 20 4 16.41 4 12C4 11.71 4.02 11.42 4.05 11.14C6.41 10.09 8.28 8.16 9.26 5.77C11.07 8.33 14.05 10 17.42 10C18.2 10 18.95 9.91 19.67 9.74C19.88 10.45 20 11.21 20 12C20 16.41 16.41 20 12 20Z"
                  fill={theme.colors.success.celebratoryGold}
                />
              </Svg>
              <Text style={[styles.guidanceToggleText, styles.aiToggleText]}>
                {isGeneratingGuide ? 'Generating...' : '✨ AI Prayer Coach'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Card variant="parchment" style={styles.guidanceCard}>
            <TouchableOpacity
              onPress={() => setShowGuidance(false)}
              style={styles.guidanceHeader}
            >
              <Text style={styles.guidanceTitle}>
                {useAIGuide ? '✨ AI Prayer Guide' : 'Prayer Guide'}
              </Text>
              <Text style={styles.hideText}>Hide</Text>
            </TouchableOpacity>

            {isGeneratingGuide ? (
              <View style={styles.loadingGuide}>
                <ActivityIndicator size="large" color={theme.colors.success.celebratoryGold} />
                <Text style={styles.loadingGuideText}>
                  Crafting personalized prayer guidance...
                </Text>
              </View>
            ) : useAIGuide && prayerGuide ? (
              <>
                <View style={styles.guidanceSection}>
                  <Text style={styles.guidanceStepTitle}>1. Start with Praise</Text>
                  <Text style={styles.guidanceStepText}>
                    {prayerGuide.praise}
                  </Text>
                </View>

                <View style={styles.guidanceSection}>
                  <Text style={styles.guidanceStepTitle}>2. Reflect on the Verse</Text>
                  <Text style={styles.guidanceStepText}>
                    {prayerGuide.reflection}
                  </Text>
                </View>

                <View style={styles.guidanceSection}>
                  <Text style={styles.guidanceStepTitle}>3. Personal Application</Text>
                  <Text style={styles.guidanceStepText}>
                    {prayerGuide.application}
                  </Text>
                </View>

                <View style={styles.guidanceSection}>
                  <Text style={styles.guidanceStepTitle}>4. Close with Thanks</Text>
                  <Text style={styles.guidanceStepText}>
                    {prayerGuide.closing}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.guidanceSection}>
                  <Text style={styles.guidanceStepTitle}>1. Start with Praise</Text>
                  <Text style={styles.guidanceStepText}>
                    "Father God, I praise You for Your wisdom and love..."
                  </Text>
                </View>

                <View style={styles.guidanceSection}>
                  <Text style={styles.guidanceStepTitle}>2. Reflect on the Verse</Text>
                  <Text style={styles.guidanceStepText}>
                    Share what this verse means to you and how it speaks to your heart.
                  </Text>
                </View>

                <View style={styles.guidanceSection}>
                  <Text style={styles.guidanceStepTitle}>3. Personal Application</Text>
                  <Text style={styles.guidanceStepText}>
                    Ask God to help you live out this truth in your daily life.
                  </Text>
                </View>

                <View style={styles.guidanceSection}>
                  <Text style={styles.guidanceStepTitle}>4. Close with Thanks</Text>
                  <Text style={styles.guidanceStepText}>
                    "Thank You for Your Word and presence. In Jesus' name, Amen."
                  </Text>
                </View>
              </>
            )}
          </Card>
        )}

        {/* Recording Section */}
        <View style={styles.recordingSection}>
          <Text style={styles.recordingPrompt}>
            {!hasRecorded
              ? 'Tap the microphone to start praying'
              : isRecording
                ? 'Recording your prayer...'
                : 'Tap again to practice more'}
          </Text>

          <Animated.View
            style={[
              styles.micButtonContainer,
              {
                transform: [{ scale: micPulseAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.micButtonActive,
              ]}
              onPress={toggleRecording}
              activeOpacity={0.8}
            >
              <Svg width="40" height="40" viewBox="0 0 24 24">
                {isRecording ? (
                  <Path
                    d="M6 6H18V18H6V6Z"
                    fill={theme.colors.text.onDark}
                  />
                ) : (
                  <Path
                    d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.91 11C17.91 14.39 15.2 17.18 11.91 17.49V21H10.91V17.49C7.62 17.18 4.91 14.39 4.91 11H6.91C6.91 13.76 9.15 16 11.91 16C14.67 16 16.91 13.76 16.91 11H17.91Z"
                    fill={theme.colors.text.onDark}
                  />
                )}
              </Svg>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.micLabel}>
            {isRecording ? 'Tap to stop' : 'Tap to record'}
          </Text>

          {/* Waveform visualization */}
          {isRecording && (
            <View style={styles.waveformContainer}>
              {[...Array(15)].map((_, i) => {
                const scaleY = waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, Math.random() * 1.5 + 0.5],
                });
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        transform: [{ scaleY }],
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {hasRecorded && !isRecording && (
          <View style={styles.actionButtons}>
            <Button
              title="Try Another Verse"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.actionButton}
            />
            <Button
              title="Done"
              onPress={() => navigation.navigate('Main')}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        )}
          </>
        ) : (
          <>
            {/* Daily Prayer Mode */}
            <View style={styles.header}>
              <Text style={styles.title}>Tell About Your Day</Text>
              <Text style={styles.subtitle}>Share your thoughts and let's create a prayer together</Text>
            </View>

            {/* Text Input */}
            <Card variant="warm" style={styles.dailyInputCard}>
              <Text style={styles.inputLabel}>How was your day?</Text>
              <TextInput
                style={styles.dailyTextArea}
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
              <Text style={styles.charCount}>
                {dayStory.length} / 1000 characters
              </Text>

              {/* Voice Input Button */}
              <View style={styles.voiceInputSection}>
                <View style={styles.voiceDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or speak</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                  onPress={toggleRecording}
                  activeOpacity={0.8}
                >
                  <Svg width="32" height="32" viewBox="0 0 24 24">
                    {isRecording ? (
                      <Path
                        d="M6 6H18V18H6V6Z"
                        fill={theme.colors.text.onDark}
                      />
                    ) : (
                      <Path
                        d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM12 16C8.69 16 6 13.31 6 10H4C4 14.42 7.58 18 12 18C16.42 18 20 14.42 20 10H18C18 13.31 15.31 16 12 16Z"
                        fill={isRecording ? theme.colors.text.onDark : theme.colors.secondary.warmTerracotta}
                      />
                    )}
                  </Svg>
                  <Text style={[styles.voiceButtonText, isRecording && styles.voiceButtonTextActive]}>
                    {isRecording ? 'Stop Recording' : 'Tap to Speak'}
                  </Text>
                </TouchableOpacity>

                {transcribedText && (
                  <View style={styles.transcriptNotice}>
                    <Text style={styles.transcriptText}>Voice added to your story</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Generate Prayer Button */}
            <Button
              title={isGeneratingPrayer ? 'Crafting Your Prayer...' : 'Generate Prayer'}
              onPress={handleGenerateDailyPrayer}
              variant="gold"
              style={styles.generateButton}
              disabled={isGeneratingPrayer}
            />

            {/* Generated Prayer */}
            {generatedPrayer && (
              <Card variant="parchment" style={styles.generatedPrayerCard}>
                <View style={styles.prayerHeader}>
                  <Text style={styles.prayerTitle}>Your Prayer</Text>
                  <TouchableOpacity onPress={handleResetDailyPrayer}>
                    <Text style={styles.newPrayerText}>New Prayer</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.generatedPrayerText}>{generatedPrayer}</Text>

                {/* Coming Soon Notice */}
                <View style={styles.comingSoonNotice}>
                  <Svg width="14" height="14" viewBox="0 0 24 24">
                    <Path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                      fill={theme.colors.secondary.lightGold}
                    />
                  </Svg>
                  <Text style={styles.comingSoonText}>
                    AI-powered prayer generation coming soon! This is a sample.
                  </Text>
                </View>
              </Card>
            )}

            {/* Info Card */}
            {!generatedPrayer && (
              <Card variant="cream" style={styles.infoCard}>
                <Text style={styles.infoTitle}>How It Works</Text>
                <Text style={styles.infoText}>
                  1. Type or speak about your day{'\n'}
                  2. Share your joys, challenges, or thoughts{'\n'}
                  3. Let AI help turn it into a meaningful prayer{'\n'}
                  4. Use it as inspiration for your own prayers
                </Text>
              </Card>
            )}
          </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.ui.title.fontSize,
    lineHeight: theme.typography.ui.title.lineHeight,
    fontWeight: theme.typography.ui.title.fontWeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  verseCard: {
    marginBottom: theme.spacing.xl,
  },
  verseText: {
    fontFamily: theme.typography.fonts.scripture.default,
    fontSize: theme.typography.scripture.medium.fontSize,
    lineHeight: theme.typography.scripture.medium.lineHeight,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  reference: {
    marginTop: theme.spacing.sm,
  },
  guidanceOptions: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  guidanceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  guidanceToggleText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  aiToggle: {
    backgroundColor: theme.colors.secondary.lightGold,
    ...theme.shadows.md,
  },
  aiToggleText: {
    color: theme.colors.text.onDark,
  },
  guidanceCard: {
    marginBottom: theme.spacing.xl,
  },
  guidanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  guidanceTitle: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  hideText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
  },
  guidanceSection: {
    marginBottom: theme.spacing.lg,
  },
  guidanceStepTitle: {
    fontSize: theme.typography.ui.body.fontSize,
    fontWeight: '600',
    color: theme.colors.secondary.warmTerracotta,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fonts.ui.default,
  },
  guidanceStepText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    lineHeight: theme.typography.ui.bodySmall.lineHeight,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  recordingPrompt: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.fonts.ui.default,
  },
  micButtonContainer: {
    marginBottom: theme.spacing.md,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.secondary.warmTerracotta,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  micButtonActive: {
    backgroundColor: theme.colors.error.main,
    ...theme.shadows.glow.gold,
  },
  micLabel: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
    marginTop: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  waveBar: {
    width: 4,
    height: 40,
    backgroundColor: theme.colors.secondary.warmTerracotta,
    borderRadius: 2,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    marginTop: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.error.main,
    textAlign: 'center',
    fontFamily: theme.typography.fonts.ui.default,
    paddingHorizontal: theme.spacing.xl,
  },
  retryButton: {
    marginTop: theme.spacing.sm,
  },
  loadingGuide: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  loadingGuideText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.lg,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  modeButtonActive: {
    backgroundColor: theme.colors.secondary.lightGold,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  modeButtonTextActive: {
    color: theme.colors.text.onDark,
  },
  dailyInputCard: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    marginBottom: theme.spacing.sm,
  },
  dailyTextArea: {
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
  voiceInputSection: {
    marginTop: theme.spacing.sm,
  },
  voiceDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dividerLine: {
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
    borderColor: theme.colors.secondary.warmTerracotta,
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
  generatedPrayerCard: {
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
  generatedPrayerText: {
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
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    lineHeight: 15,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
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
    lineHeight: 22,
  },
});

export default PrayScreen;
