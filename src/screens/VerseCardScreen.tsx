import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, VerseText, VerseReference, StarButton } from '../components';
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);

  // Animation values for card flip effect
  const flipAnim = useRef(new Animated.Value(0)).current;
  const pageFlipAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const contextGeneratedFor = useRef(new Set<string>()).current;

  // Load verses on mount
  useEffect(() => {
    loadVerses();
  }, []);

  // Auto-generate context when verse changes OR when verses first load
  useEffect(() => {
    if (verses.length > 0 && verses[currentVerseIndex]) {
      generateContextForCurrentVerse();
    }
    setIsFlipped(false); // Reset flip when changing verses
  }, [currentVerseIndex, verses.length]);

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load 5 random verses for the card deck
      const loadedVerses: Verse[] = [];
      for (let i = 0; i < 5; i++) {
        const verse = await verseService.getRandomVerse('KJV');
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

  const generateContextForCurrentVerse = async () => {
    const currentVerse = verses[currentVerseIndex];
    if (!currentVerse?.id || currentVerse.context || contextGeneratedFor.has(currentVerse.id)) {
      return; // Skip if no verse, context already exists, or already generated
    }

    // Mark as being generated
    contextGeneratedFor.add(currentVerse.id);

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
        });
      } else if (result.error) {
        logger.error('[VerseCardScreen] Failed to generate context:', result.error);
        // Remove from set if failed, so it can be retried
        contextGeneratedFor.delete(currentVerse.id);
      }
    } catch (err) {
      logger.error('[VerseCardScreen] Error generating context:', err);
      // Remove from set if error, so it can be retried
      contextGeneratedFor.delete(currentVerse.id);
    } finally {
      setIsGeneratingContext(false);
    }
  };

  // Get current verse (recalculated on every render to ensure fresh data)
  const currentVerse = verses[currentVerseIndex];

  // Card flip animation effect
  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  // Handle Show/Hide Context button
  const handleToggleContext = () => {
    flipCard();
  };

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
      // Flip back to verse if showing context
      if (isFlipped) {
        flipCard();
      }
      animatePageTurn();
      setTimeout(() => {
        setCurrentVerseIndex(currentVerseIndex + 1);
      }, 200);
    } else {
      navigation.goBack();
    }
  };

  const handlePrevious = () => {
    if (currentVerseIndex > 0) {
      // Flip back to verse if showing context
      if (isFlipped) {
        flipCard();
      }
      animatePageTurn();
      setTimeout(() => {
        setCurrentVerseIndex(currentVerseIndex - 1);
      }, 200);
    }
  };

  // Interpolate card flip rotation
  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

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

        {/* Verse card with flip animation */}
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
            <View style={styles.flipContainer}>
              {/* Front of card - Verse */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardFront,
                  {
                    opacity: frontOpacity,
                    transform: [{ rotateY: frontRotation }],
                  },
                ]}
                pointerEvents={isFlipped ? 'none' : 'auto'}
              >
                <Card variant="parchment" elevated outlined style={styles.verseCard}>
                  <View style={styles.decorativeBorder} />

                  <View style={styles.cardContent}>
                    <VerseText size="large" style={styles.verse} numberOfLines={15}>
                      {currentVerse.text}
                    </VerseText>
                    <View style={styles.referenceRow}>
                      <VerseReference style={styles.reference}>
                        {`${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse_number}`}
                      </VerseReference>
                      <StarButton verseId={currentVerse.id || ''} size={24} />
                    </View>
                  </View>

                  <View style={[styles.decorativeBorder, styles.decorativeBorderBottom]} />
                </Card>
              </Animated.View>

              {/* Back of card - Context */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardBack,
                  {
                    opacity: backOpacity,
                    transform: [{ rotateY: backRotation }],
                  },
                ]}
                pointerEvents={isFlipped ? 'auto' : 'none'}
              >
                <Card variant="parchment" elevated outlined style={styles.verseCard}>
                  <View style={styles.decorativeBorder} />

                  <View style={styles.cardContent}>
                    <Text style={styles.contextLabel}>CONTEXT</Text>
                    <VerseReference style={[styles.reference, styles.contextReference]}>
                      {`${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse_number}`}
                    </VerseReference>

                    {isGeneratingContext ? (
                      <View style={styles.contextLoadingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.secondary.lightGold} />
                        <Text style={styles.contextLoadingText}>
                          Discovering deeper meaning...
                        </Text>
                      </View>
                    ) : currentVerse.context ? (
                      <Text style={styles.contextText} numberOfLines={10} ellipsizeMode="tail">
                        {currentVerse.context}
                      </Text>
                    ) : (
                      <Text style={styles.contextPlaceholder}>
                        Context is being generated for this verse...
                      </Text>
                    )}
                  </View>

                  <View style={[styles.decorativeBorder, styles.decorativeBorderBottom]} />
                </Card>
              </Animated.View>
            </View>
          </Animated.View>
        )}

        {/* Action buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            title={isFlipped ? "Hide Context" : "Show Context"}
            onPress={handleToggleContext}
            variant="gold"
            style={styles.contextButton}
          />

          {currentVerse?.id && (
            <Button
              title="Learn More"
              onPress={() => navigation.navigate('Understand', { verseId: currentVerse.id })}
              variant="secondary"
              style={styles.learnMoreButton}
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
  flipContainer: {
    flex: 1,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    // Front face styling
  },
  cardBack: {
    // Back face styling
  },
  verseCard: {
    flex: 1,
    paddingVertical: theme.spacing.xxl,
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    justifyContent: 'center',
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
  verse: {
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  reference: {
    marginTop: 0,
    textAlign: 'center',
  },
  contextReference: {
    marginTop: 0,
    marginBottom: theme.spacing.lg,
  },
  contextLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.secondary.lightGold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontFamily: theme.typography.fonts.ui.default,
  },
  contextText: {
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'left',
  },
  contextPlaceholder: {
    fontSize: theme.typography.context.fontSize,
    lineHeight: theme.typography.context.lineHeight,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
  },
  contextLoadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
  },
  contextLoadingText: {
    fontSize: theme.typography.context.fontSize,
    color: theme.colors.secondary.lightGold,
    fontFamily: theme.typography.fonts.ui.default,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonsContainer: {
    paddingBottom: theme.spacing.lg,
  },
  contextButton: {
    marginBottom: theme.spacing.md,
  },
  learnMoreButton: {
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
