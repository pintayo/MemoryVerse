import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button, Card } from '../components';
import { theme } from '../theme';
import { verseService } from '../services/verseService';
import { practiceService, PracticeMode, BlankQuestion, MultipleChoiceQuestion } from '../services/practiceService';
import { profileService } from '../services/profileService';
import { Verse } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { practiceConfig } from '../config/practiceConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Practice'>;

interface VerseWithMode {
  verse: Verse;
  mode: PracticeMode;
  blankQuestion?: BlankQuestion;
  mcQuestion?: MultipleChoiceQuestion;
  wasCorrect?: boolean; // Track if user answered correctly
}

const PracticeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, profile } = useAuth();

  const [versesWithModes, setVersesWithModes] = useState<VerseWithMode[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedMCIndex, setSelectedMCIndex] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionResults, setSessionResults] = useState<{
    totalXP: number;
    accuracy: number;
    correctCount: number;
    totalCount: number;
  } | null>(null);

  useEffect(() => {
    loadVerses();
  }, []);

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all verses in parallel for better performance
      const numPracticeVerses = practiceConfig.versesPerLesson;
      const numExtraVerses = 30;

      const [practiceVersePromises, extraVersePromises] = [
        Array(numPracticeVerses).fill(null).map(() => verseService.getRandomVerse('KJV')),
        Array(numExtraVerses).fill(null).map(() => verseService.getRandomVerse('KJV'))
      ];

      const [practiceVerses, extraVerses] = await Promise.all([
        Promise.all(practiceVersePromises),
        Promise.all(extraVersePromises)
      ]);

      const loadedVerses = practiceVerses.filter((v): v is Verse => v !== null);
      const loadedExtraVerses = extraVerses.filter((v): v is Verse => v !== null);

      if (loadedVerses.length > 0) {
        // Assign a random mode to each verse and generate questions
        const userLevel = profile?.level || 1;

        const withModes: VerseWithMode[] = loadedVerses.map(verse => {
          const mode = practiceService.selectModeForUser(userLevel);
          const item: VerseWithMode = { verse, mode };

          if (mode === 'fill-in-blanks') {
            item.blankQuestion = practiceService.generateBlanks(verse, loadedExtraVerses);
          } else if (mode === 'multiple-choice') {
            item.mcQuestion = practiceService.generateMultipleChoice(verse, loadedExtraVerses);
          }

          return item;
        });

        setVersesWithModes(withModes);
      } else {
        setError('No verses found.');
      }
    } catch (err) {
      logger.error('[PracticeScreen] Error loading verses:', err);
      setError('Failed to load verses.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlankSelect = (blankIndex: number, word: string) => {
    if (hasAnswered) return;

    const current = versesWithModes[currentIndex];
    if (!current.blankQuestion) return;

    const updatedBlanks = [...current.blankQuestion.blanks];
    updatedBlanks[blankIndex].userAnswer = word;

    const updatedQuestion = { ...current.blankQuestion, blanks: updatedBlanks };
    const updated = [...versesWithModes];
    updated[currentIndex] = { ...current, blankQuestion: updatedQuestion };
    setVersesWithModes(updated);
  };

  const handleMCSelect = (index: number) => {
    if (hasAnswered) return;
    setSelectedMCIndex(index);

    // Auto-check answer for MC (immediate feedback)
    const current = versesWithModes[currentIndex];
    if (current.mode === 'multiple-choice' && current.mcQuestion) {
      current.wasCorrect = index === current.mcQuestion.correctIndex;
      setHasAnswered(true);
    }
  };

  const handleCheckAnswer = () => {
    const current = versesWithModes[currentIndex];

    // Mark if the answer was correct
    if (current.mode === 'fill-in-blanks' && current.blankQuestion) {
      const result = practiceService.checkBlanksAnswer(current.blankQuestion.blanks);
      current.wasCorrect = result.isCorrect;
    } else if (current.mode === 'multiple-choice' && current.mcQuestion) {
      current.wasCorrect = selectedMCIndex === current.mcQuestion.correctIndex;
    }

    setHasAnswered(true);
  };

  const handleNext = async () => {
    if (currentIndex < versesWithModes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHasAnswered(false);
      setSelectedMCIndex(null);
    } else {
      // Calculate session results and award XP
      await calculateSessionResults();
      setIsComplete(true);
    }
  };

  const calculateSessionResults = async () => {
    let totalCorrect = 0;
    let totalQuestions = 0;
    let totalXP = 0;

    versesWithModes.forEach(({ mode, blankQuestion, wasCorrect }) => {
      if (mode === 'fill-in-blanks' && blankQuestion) {
        const result = practiceService.checkBlanksAnswer(blankQuestion.blanks);
        totalCorrect += result.correctCount;
        totalQuestions += result.totalCount;
        totalXP += practiceService.calculateXP(result.accuracy, mode);
      } else if (mode === 'multiple-choice') {
        totalQuestions += 1;
        if (wasCorrect) {
          totalCorrect += 1;
          totalXP += practiceService.calculateXP(100, mode);
        } else {
          totalXP += practiceService.calculateXP(0, mode);
        }
      } else if (mode === 'recall') {
        // Recall mode - assume full credit (no validation yet)
        totalQuestions += 1;
        totalCorrect += 1;
        totalXP += practiceService.calculateXP(100, mode);
      }
    });

    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    setSessionResults({
      totalXP,
      accuracy,
      correctCount: totalCorrect,
      totalCount: totalQuestions,
    });

    // Award XP to user's profile
    if (user && totalXP > 0) {
      try {
        await profileService.addXP(user.id, totalXP);
        logger.info('[PracticeScreen] Successfully awarded XP:', totalXP);
      } catch (err) {
        logger.error('[PracticeScreen] Error awarding XP:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading verses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={loadVerses} variant="olive" />
        </View>
      </SafeAreaView>
    );
  }

  if (versesWithModes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No verses available</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} variant="olive" />
        </View>
      </SafeAreaView>
    );
  }

  // Show completion screen
  if (isComplete && sessionResults) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>Practice Complete!</Text>

          <Card variant="warm" style={styles.resultsCard}>
            <Text style={styles.xpText}>+{sessionResults.totalXP} XP</Text>
            <Text style={styles.accuracyText}>
              {Math.round(sessionResults.accuracy)}% Accuracy
            </Text>
            <Text style={styles.statsText}>
              {sessionResults.correctCount} / {sessionResults.totalCount} correct
            </Text>
          </Card>

          <Button
            title="Continue"
            onPress={() => navigation.goBack()}
            variant="olive"
          />
        </View>
      </SafeAreaView>
    );
  }

  const currentVerseWithMode = versesWithModes[currentIndex];
  const { verse, mode, blankQuestion, mcQuestion } = currentVerseWithMode;

  const renderRecallMode = () => (
    <View style={styles.center}>
      <Text style={styles.reference}>
        {verse.book} {verse.chapter}:{verse.verse_number}
      </Text>
      <Text style={styles.instructionText}>
        Recall this verse from memory
      </Text>
      <Card variant="warm" style={styles.verseCard}>
        <Text style={styles.verseText}>{verse.text}</Text>
      </Card>
      <Text style={styles.recallHint}>
        (Traditional recall mode - memorize and recite)
      </Text>
    </View>
  );

  const renderFillInBlanksMode = () => {
    if (!blankQuestion) return null;

    const allAnswered = blankQuestion.blanks.every(b => b.userAnswer !== null);
    const result = hasAnswered ? practiceService.checkBlanksAnswer(blankQuestion.blanks) : null;

    // Create filled-in verse text after answering
    const getDisplayText = () => {
      if (!hasAnswered) {
        return blankQuestion.displayText;
      }

      // Replace each blank with the correct word
      let filledText = blankQuestion.displayText;
      blankQuestion.blanks.forEach(blank => {
        filledText = filledText.replace('_____', blank.correctWord);
      });
      return filledText;
    };

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.reference}>
          {verse.book} {verse.chapter}:{verse.verse_number}
        </Text>
        <Text style={styles.instructionText}>
          {hasAnswered ? 'Complete verse:' : 'Tap the blanks to fill in the missing words'}
        </Text>

        <Card variant="warm" style={styles.verseCard}>
          <Text style={styles.verseText}>{getDisplayText()}</Text>
        </Card>

        {blankQuestion.blanks.map((blank, index) => (
          <View key={index} style={styles.blankContainer}>
            <Text style={styles.blankLabel}>Blank {index + 1}:</Text>
            <View style={styles.optionsRow}>
              {blank.options.map((option, optIndex) => {
                const isSelected = blank.userAnswer === option;
                const isCorrect = hasAnswered && option === blank.correctWord;
                const isWrong = hasAnswered && isSelected && option !== blank.correctWord;

                return (
                  <TouchableOpacity
                    key={optIndex}
                    style={[
                      styles.optionButton,
                      isSelected && !hasAnswered && styles.optionSelected,
                      isCorrect && styles.optionCorrect,
                      isWrong && styles.optionWrong,
                    ]}
                    onPress={() => handleBlankSelect(index, option)}
                    disabled={hasAnswered}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && !hasAnswered && styles.optionTextSelected,
                      (isCorrect || isWrong) && styles.optionTextAnswered,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {hasAnswered && result && (
          <Card variant="cream" style={styles.resultCard}>
            <Text style={result.isCorrect ? styles.resultTextCorrect : styles.resultTextIncorrect}>
              {result.isCorrect ? '✓ Perfect!' : `${result.correctCount}/${result.totalCount} correct`}
            </Text>
          </Card>
        )}

        {!hasAnswered && allAnswered && (
          <Button title="Check Answer" onPress={handleCheckAnswer} variant="olive" />
        )}
      </ScrollView>
    );
  };

  const renderMultipleChoiceMode = () => {
    if (!mcQuestion) return null;

    const isCorrect = hasAnswered && selectedMCIndex === mcQuestion.correctIndex;

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.instructionText}>
          Which verse is this?
        </Text>

        <Card variant="warm" style={styles.verseCard}>
          <Text style={styles.verseText}>{mcQuestion.verseText}</Text>
        </Card>

        <Text style={styles.mcPrompt}>Select the correct reference:</Text>

        {mcQuestion.options.map((option, index) => {
          const isSelected = selectedMCIndex === index;
          const isCorrectOption = index === mcQuestion.correctIndex;
          const showCorrect = hasAnswered && isCorrectOption;
          const showWrong = hasAnswered && isSelected && !isCorrectOption;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.mcReferenceOption,
                isSelected && !hasAnswered && styles.mcOptionSelected,
                showCorrect && styles.mcOptionCorrect,
                showWrong && styles.mcOptionWrong,
              ]}
              onPress={() => handleMCSelect(index)}
              disabled={hasAnswered}
            >
              <Text style={[
                styles.mcReferenceText,
                (showCorrect || showWrong) && styles.mcOptionTextAnswered,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}

        {hasAnswered && (
          <Card variant="cream" style={styles.resultCard}>
            <Text style={isCorrect ? styles.resultTextCorrect : styles.resultTextIncorrect}>
              {isCorrect ? '✓ Correct!' : '✗ Try again next time'}
            </Text>
          </Card>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {versesWithModes.length}
          </Text>
          <Text style={styles.modeLabel}>
            {mode === 'recall' ? 'Recall' : mode === 'fill-in-blanks' ? 'Fill Blanks' : 'Multiple Choice'}
          </Text>
        </View>

        {/* Mode-specific content */}
        {mode === 'recall' && renderRecallMode()}
        {mode === 'fill-in-blanks' && renderFillInBlanksMode()}
        {mode === 'multiple-choice' && renderMultipleChoiceMode()}

        {/* Next button */}
        {(hasAnswered || mode === 'recall') && (
          <View style={styles.actions}>
            <Button
              title={currentIndex < versesWithModes.length - 1 ? "Next Verse →" : "Complete"}
              onPress={handleNext}
              variant="olive"
            />
          </View>
        )}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.screen.horizontal,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary.mutedStone,
  },
  progressText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
    color: theme.colors.text.secondary,
  },
  modeLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '500' as const,
    color: theme.colors.secondary.lightGold,
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.screen.horizontal,
  },
  reference: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  verseCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  verseText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.scripture.default,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
  },
  recallHint: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  blankContainer: {
    marginBottom: theme.spacing.lg,
  },
  blankLabel: {
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.lightCream,
    borderWidth: 2,
    borderColor: theme.colors.primary.mutedStone,
  },
  optionSelected: {
    borderColor: theme.colors.secondary.lightGold,
    backgroundColor: theme.colors.secondary.lightGold,
  },
  optionCorrect: {
    borderColor: theme.colors.success.mutedOlive,
    backgroundColor: theme.colors.success.mutedOlive,
  },
  optionWrong: {
    borderColor: theme.colors.error.main,
    backgroundColor: theme.colors.error.main,
  },
  optionText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.primary,
  },
  optionTextSelected: {
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
  },
  optionTextAnswered: {
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
  },
  mcPrompt: {
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '500' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  mcReferenceOption: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.lightCream,
    borderWidth: 2,
    borderColor: theme.colors.primary.mutedStone,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  mcOptionSelected: {
    borderColor: theme.colors.secondary.lightGold,
    backgroundColor: theme.colors.secondary.lightGold,
  },
  mcOptionCorrect: {
    borderColor: theme.colors.success.mutedOlive,
    backgroundColor: '#e8f5e9',
  },
  mcOptionWrong: {
    borderColor: theme.colors.error.main,
    backgroundColor: '#ffebee',
  },
  mcReferenceText: {
    fontSize: theme.typography.ui.subheading.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
  },
  mcOptionTextAnswered: {
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
  },
  resultCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  resultTextCorrect: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
    color: theme.colors.success.mutedOlive,
    textAlign: 'center',
  },
  resultTextIncorrect: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
    color: theme.colors.error.main,
    textAlign: 'center',
  },
  actions: {
    padding: theme.spacing.screen.horizontal,
    paddingBottom: theme.spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.error.main,
    marginBottom: 20,
    textAlign: 'center',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.screen.horizontal,
  },
  completionTitle: {
    fontSize: theme.typography.ui.title.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  resultsCard: {
    width: '100%',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  xpText: {
    fontSize: 48,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '700' as const,
    color: theme.colors.secondary.lightGold,
    marginBottom: theme.spacing.md,
  },
  accuracyText: {
    fontSize: theme.typography.ui.heading.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  statsText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
    color: theme.colors.text.secondary,
  },
});

export default PracticeScreen;
