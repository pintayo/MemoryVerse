import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, ActivityIndicator } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Pray'>;

const PrayScreen: React.FC<Props> = ({ navigation, route }) => {
  const { verseId } = route.params;

  const [verse, setVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [prayerGuide, setPrayerGuide] = useState<PrayerGuide | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [useAIGuide, setUseAIGuide] = useState(false);

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
    // In real app, process and save recording here
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
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

  const verseReference = `${verse.book} ${verse.chapter}:${verse.verse_number}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
});

export default PrayScreen;
