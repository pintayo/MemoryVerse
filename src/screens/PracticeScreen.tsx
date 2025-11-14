import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button, Card } from '../components';
import { theme } from '../theme';
import { verseService } from '../services/verseService';
import { practiceService, PracticeMode, BlankQuestion, MultipleChoiceQuestion } from '../services/practiceService';
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
}

const PracticeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, profile } = useAuth();

  const [versesWithModes, setVersesWithModes] = useState<VerseWithMode[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedMCIndex, setSelectedMCIndex] = useState<number | null>(null);

  useEffect(() => {
    loadVerses();
  }, []);

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedVerses: Verse[] = [];

      for (let i = 0; i < practiceConfig.versesPerLesson; i++) {
        const verse = await verseService.getRandomVerse('KJV');
        if (verse) loadedVerses.push(verse);
      }

      if (loadedVerses.length > 0) {
        // Assign a random mode to each verse and generate questions
        const userLevel = profile?.level || 1;

        // Load extra verses for generating wrong answers in multiple choice
        const extraVerses: Verse[] = [];
        for (let i = 0; i < 30; i++) {
          const verse = await verseService.getRandomVerse('KJV');
          if (verse) extraVerses.push(verse);
        }

        const withModes: VerseWithMode[] = loadedVerses.map(verse => {
          const mode = practiceService.selectModeForUser(userLevel);
          const item: VerseWithMode = { verse, mode };

          if (mode === 'fill-in-blanks') {
            item.blankQuestion = practiceService.generateBlanks(verse, extraVerses);
          } else if (mode === 'multiple-choice') {
            item.mcQuestion = practiceService.generateMultipleChoice(verse, extraVerses);
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
  };

  const handleCheckAnswer = () => {
    setHasAnswered(true);
  };

  const handleNext = () => {
    if (currentIndex < versesWithModes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHasAnswered(false);
      setSelectedMCIndex(null);
    } else {
      // Practice complete
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.secondary.mutedGold} />
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

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.reference}>
          {verse.book} {verse.chapter}:{verse.verse_number}
        </Text>
        <Text style={styles.instructionText}>
          Tap the blanks to fill in the missing words
        </Text>

        <Card variant="warm" style={styles.verseCard}>
          <Text style={styles.verseText}>{blankQuestion.displayText}</Text>
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
        <Text style={styles.reference}>{mcQuestion.verseReference}</Text>
        <Text style={styles.instructionText}>
          Which verse starts with this text?
        </Text>

        <Card variant="warm" style={styles.promptCard}>
          <Text style={styles.promptText}>"{mcQuestion.startingText}..."</Text>
        </Card>

        {mcQuestion.options.map((option, index) => {
          const isSelected = selectedMCIndex === index;
          const isCorrectOption = index === mcQuestion.correctIndex;
          const showCorrect = hasAnswered && isCorrectOption;
          const showWrong = hasAnswered && isSelected && !isCorrectOption;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.mcOption,
                isSelected && !hasAnswered && styles.mcOptionSelected,
                showCorrect && styles.mcOptionCorrect,
                showWrong && styles.mcOptionWrong,
              ]}
              onPress={() => handleMCSelect(index)}
              disabled={hasAnswered}
            >
              <Text style={[
                styles.mcOptionText,
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

        {!hasAnswered && selectedMCIndex !== null && (
          <Button title="Check Answer" onPress={handleCheckAnswer} variant="olive" />
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
    fontFamily: theme.typography.fonts.ui.bold,
    color: theme.colors.text.secondary,
  },
  modeLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontFamily: theme.typography.fonts.ui.medium,
    color: theme.colors.secondary.mutedGold,
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
    fontFamily: theme.typography.fonts.ui.bold,
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
    fontFamily: theme.typography.fonts.ui.medium,
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
    borderColor: theme.colors.secondary.mutedGold,
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
    fontFamily: theme.typography.fonts.ui.bold,
  },
  optionTextAnswered: {
    color: theme.colors.text.onDark,
    fontFamily: theme.typography.fonts.ui.bold,
  },
  promptCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  promptText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.scripture.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mcOption: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.lightCream,
    borderWidth: 2,
    borderColor: theme.colors.primary.mutedStone,
    marginBottom: theme.spacing.md,
  },
  mcOptionSelected: {
    borderColor: theme.colors.secondary.mutedGold,
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
  mcOptionText: {
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.scripture.default,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  mcOptionTextAnswered: {
    fontFamily: theme.typography.fonts.ui.bold,
  },
  resultCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  resultTextCorrect: {
    fontSize: theme.typography.ui.h4.fontSize,
    fontFamily: theme.typography.fonts.ui.bold,
    color: theme.colors.success.mutedOlive,
    textAlign: 'center',
  },
  resultTextIncorrect: {
    fontSize: theme.typography.ui.h4.fontSize,
    fontFamily: theme.typography.fonts.ui.bold,
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
});

export default PracticeScreen;
