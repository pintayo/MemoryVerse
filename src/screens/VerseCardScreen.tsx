import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, VerseText, VerseReference } from '../components';
import { theme } from '../theme';
import { verseService } from '../services/verseService';
import { Verse } from '../types/database';
import { getOrGenerateContext } from '../services/contextGenerator';
import { logger } from '../utils/logger';

interface VerseCardScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const VerseCardScreen: React.FC<VerseCardScreenProps> = ({ navigation }) => {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [showContext, setShowContext] = useState(false);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);

  // Animation values for page turn effect
  const pageFlipAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load verses on mount
  useEffect(() => {
    loadVerses();
  }, []);

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load 5 random verses for the card deck
      const loadedVerses: Verse[] = [];
      for (let i = 0; i < 5; i++) {
        const verse = await verseService.getRandomVerse('NIV');
        if (verse) {
          loadedVerses.push(verse);
        }
      }

      if (loadedVerses.length > 0) {
        setVerses(loadedVerses);
      } else {
        setError('No verses found. Please import Bible data.');
      }
    } catch (err) {
      logger.error('[VerseCardScreen] Error loading verses:', err);
      setError('Failed to load verses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current verse (recalculated on every render to ensure fresh data)
  const currentVerse = verses[currentVerseIndex];

  // Page turn animation effect
  const animatePageTurn = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(pageFlipAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pageFlipAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleNext = () => {
    if (currentVerseIndex < verses.length - 1) {
      animatePageTurn();
      setTimeout(() => {
        setCurrentVerseIndex(currentVerseIndex + 1);
        setShowContext(false);
      }, 200);
    } else {
      navigation.goBack();
    }
  };

  const handlePrevious = () => {
    if (currentVerseIndex > 0) {
      animatePageTurn();
      setTimeout(() => {
        setCurrentVerseIndex(currentVerseIndex - 1);
        setShowContext(false);
      }, 200);
    }
  };

  const toggleContext = async () => {
    const newShowContext = !showContext;
    setShowContext(newShowContext);

    // If showing context and no context exists, generate it automatically
    if (newShowContext && currentVerse && currentVerse.id && !currentVerse.context) {
      try {
        setIsGeneratingContext(true);
        logger.log('[VerseCardScreen] Auto-generating context for verse:', currentVerse.id);

        const result = await getOrGenerateContext(currentVerse.id);

        if (result.context) {
          // Update the verse in the verses array with the new context
          const updatedVerses = verses.map((v, idx) =>
            idx === currentVerseIndex
              ? { ...v, context: result.context, context_generated_by_ai: true }
              : v
          );
          setVerses(updatedVerses);
          logger.log('[VerseCardScreen] Context updated:', {
            verseId: currentVerse.id,
            contextPreview: result.context.substring(0, 50) + '...',
            updatedVerse: updatedVerses[currentVerseIndex]
          });
        } else if (result.error) {
          logger.error('[VerseCardScreen] Failed to generate context:', result.error);
          // Don't show error to user - they'll just see the placeholder
        }
      } catch (err) {
        logger.error('[VerseCardScreen] Error generating context:', err);
        // Silent fail - user experience isn't disrupted
      } finally {
        setIsGeneratingContext(false);
      }
    }
  };

  // Interpolate page flip rotation
  const pageRotation = pageFlipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-8deg'],
  });

  const pageTranslateX = pageFlipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading verses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || verses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, styles.centerContent]}>
          <Text style={styles.errorText}>{error || 'No verses available'}</Text>
          <Button
            title="Try Again"
            onPress={loadVerses}
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {verses.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentVerseIndex && styles.progressDotActive,
                index < currentVerseIndex && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Verse card with page turn animation */}
        {currentVerse && (
          <Animated.View
            style={[
              styles.cardContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { perspective: 1000 },
                  { rotateY: pageRotation },
                  { translateX: pageTranslateX },
                ],
              },
            ]}
          >
            <Card variant="parchment" elevated outlined style={styles.verseCard}>
              {/* Decorative top border */}
              <View style={styles.decorativeBorder} />

              {/* Scrollable verse content */}
              <ScrollView
                style={styles.verseScrollView}
                contentContainerStyle={styles.verseScrollContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
              >
                {/* Verse text */}
                <View style={styles.verseContainer}>
                  <VerseText size="large" style={styles.verse}>
                    {currentVerse.text}
                  </VerseText>
                  <VerseReference style={styles.reference}>
                    {`${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse_number}`}
                  </VerseReference>
                </View>

                {/* Context section */}
                {(() => {
                  const hasContext = verses[currentVerseIndex]?.context;

                  if (!showContext) {
                    return null;
                  }

                  if (hasContext) {
                    return (
                      <View style={styles.contextContainer}>
                        <View style={styles.contextDivider} />
                        <Text style={styles.contextLabel}>Context</Text>
                        <Text style={styles.contextText}>
                          {hasContext}
                        </Text>
                      </View>
                    );
                  }

                  if (isGeneratingContext) {
                    return (
                      <View style={styles.contextContainer}>
                        <View style={styles.contextDivider} />
                        <Text style={styles.contextLabel}>Context</Text>
                        <View style={styles.contextLoadingContainer}>
                          <ActivityIndicator size="small" color={theme.colors.secondary.lightGold} />
                          <Text style={styles.contextLoadingText}>
                            Discovering deeper meaning in God's Word...
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View style={styles.contextContainer}>
                      <View style={styles.contextDivider} />
                      <Text style={styles.contextLabel}>Context</Text>
                      <Text style={styles.contextPlaceholder}>
                        Tap "Show Context" to explore the deeper meaning and spiritual insights of this verse.
                      </Text>
                    </View>
                  );
                })()}
              </ScrollView>

              {/* Decorative bottom border */}
              <View style={[styles.decorativeBorder, styles.decorativeBorderBottom]} />
            </Card>
          </Animated.View>
        )}

        {/* Action buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            title={showContext ? "Hide Context" : "Show Context"}
            onPress={toggleContext}
            variant="gold"
            style={styles.contextButton}
          />

          {currentVerse?.id && (
            <Button
              title="Learn More"
              onPress={() => navigation.navigate('Understand', { verseId: currentVerse.id })}
              variant="secondary"
              style={styles.contextButton}
            />
          )}

          <View style={styles.navigationButtons}>
            {currentVerseIndex > 0 && (
              <Button
                title="Previous"
                onPress={handlePrevious}
                variant="secondary"
                style={styles.navButton}
              />
            )}
            <Button
              title={currentVerseIndex < verses.length - 1 ? "Next" : "Done"}
              onPress={handleNext}
              variant="olive"
              style={[styles.navButton, { flex: 1 }]}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingTop: theme.spacing.lg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary.oatmeal,
  },
  progressDotActive: {
    backgroundColor: theme.colors.secondary.lightGold,
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: theme.colors.success.mutedOlive,
  },
  cardContainer: {
    flex: 1,
    marginBottom: theme.spacing.xl,
  },
  verseCard: {
    // Removed flex: 1 to allow Card to grow with content and enable scrolling
    paddingVertical: theme.spacing.xxl,
    minHeight: 400, // Ensure minimum height for verse display
  },
  verseScrollView: {
    flex: 1,
  },
  verseScrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxxl,
  },
  decorativeBorder: {
    height: 2,
    backgroundColor: theme.colors.secondary.lightGold,
    marginHorizontal: theme.spacing.xl,
    opacity: 0.3,
  },
  decorativeBorderBottom: {
    marginTop: theme.spacing.md,
  },
  verseContainer: {
    paddingVertical: theme.spacing.lg,
  },
  verse: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  reference: {
    marginTop: theme.spacing.md,
  },
  contextContainer: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  contextDivider: {
    height: 1,
    backgroundColor: theme.colors.primary.mutedStone,
    marginBottom: theme.spacing.md,
    opacity: 0.3,
  },
  contextLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.secondary.lightGold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fonts.ui.default,
  },
  contextText: {
    fontSize: theme.typography.context.fontSize,
    lineHeight: theme.typography.context.lineHeight,
    letterSpacing: theme.typography.context.letterSpacing,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  contextPlaceholder: {
    fontSize: theme.typography.context.fontSize,
    lineHeight: theme.typography.context.lineHeight,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    fontFamily: theme.typography.fonts.ui.default,
  },
  contextLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  contextLoadingText: {
    fontSize: theme.typography.context.fontSize,
    lineHeight: theme.typography.context.lineHeight,
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    paddingBottom: theme.spacing.lg,
  },
  contextButton: {
    marginBottom: theme.spacing.md,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  navButton: {
    flex: 1,
  },
});

export default VerseCardScreen;
