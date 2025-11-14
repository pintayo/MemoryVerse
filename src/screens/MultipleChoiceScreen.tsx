import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, VerseReference, LessonCompleteModal } from '../components';
import { theme } from '../theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { verseService } from '../services/verseService';
import { profileService } from '../services/profileService';
import { Verse } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { practiceConfig } from '../config/practiceConfig';
import { spacedRepetitionService } from '../services/spacedRepetitionService';
import { streakService } from '../services/streakService';
import { appReviewService } from '../services/appReviewService';
import { practiceService, MultipleChoiceQuestion } from '../services/practiceService';
import { supabase } from '../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'MultipleChoice'>;

const MultipleChoiceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, profile } = useAuth();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<MultipleChoiceQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lessonResults, setLessonResults] = useState<Array<{verseId: string, isCorrect: boolean, xp: number}>>([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [lessonSummary, setLessonSummary] = useState<{
    totalXP: number;
    correctCount: number;
    currentXP: number;
    currentLevel: number;
    xpForNextLevel: number;
  } | null>(null);
  const [verseStartTime, setVerseStartTime] = useState<number>(Date.now());

  // Animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const currentVerse = verses[currentVerseIndex];

  // Load verses on mount
  useEffect(() => {
    loadVerses();
  }, []);

  // Generate question when verse changes
  useEffect(() => {
    if (currentVerse) {
      generateQuestionForVerse(currentVerse);
      setVerseStartTime(Date.now());
    }
  }, [currentVerse]);

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedVerses: Verse[] = [];

      // Load multiple random verses for practice lesson
      for (let i = 0; i < practiceConfig.versesPerLesson; i++) {
        const verse = await verseService.getRandomVerse('KJV');
        if (verse) loadedVerses.push(verse);
      }

      if (loadedVerses.length > 0) {
        setVerses(loadedVerses);
      } else {
        setError('No verses found. Please import Bible data.');
      }
    } catch (err) {
      logger.error('[MultipleChoiceScreen] Error loading verses:', err);
      setError('Failed to load verses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestionForVerse = async (verse: Verse) => {
    try {
      // Get other verses for generating wrong options
      const otherVerses: Verse[] = [];
      for (let i = 0; i < 30; i++) {
        const otherVerse = await verseService.getRandomVerse('KJV');
        if (otherVerse && otherVerse.id !== verse.id) {
          otherVerses.push(otherVerse);
        }
      }

      const mcQuestion = practiceService.generateMultipleChoice(verse, otherVerses);
      setQuestion(mcQuestion);
      setSelectedOption(null);
      setHasAnswered(false);
    } catch (err) {
      logger.error('[MultipleChoiceScreen] Error generating question:', err);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (hasAnswered) return;
    setSelectedOption(optionIndex);
  };

  const handleCheckAnswer = async () => {
    if (!question || !currentVerse || !user || selectedOption === null) return;

    setHasAnswered(true);

    const timeSpent = Math.floor((Date.now() - verseStartTime) / 1000);
    const isCorrect = selectedOption === question.correctIndex;
    const accuracy = isCorrect ? 100 : 0;

    // Shake if incorrect
    if (!isCorrect) {
      triggerShakeAnimation();
    }

    // Calculate XP
    const xpEarned = practiceService.calculateXP(accuracy, 'multiple-choice');

    // Record practice session
    try {
      await verseService.recordPracticeSession(user.id, currentVerse.id, {
        session_type: 'multiple-choice',
        user_answer: question.options[selectedOption],
        is_correct: isCorrect,
        accuracy_percentage: accuracy,
        time_spent_seconds: timeSpent,
        hints_used: 0,
        xp_earned: xpEarned,
      });

      // Update spaced repetition
      const progressResult = await supabase
        .from('user_verse_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('verse_id', currentVerse.id)
        .single();

      if (progressResult.data) {
        await spacedRepetitionService.recordReview(
          progressResult.data.id,
          accuracy,
          timeSpent
        );
      }

      // Record result
      setLessonResults(prev => [...prev, {
        verseId: currentVerse.id,
        isCorrect,
        xp: xpEarned,
      }]);
    } catch (err) {
      logger.error('[MultipleChoiceScreen] Error recording practice:', err);
    }
  };

  const handleNextVerse = () => {
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
      setQuestion(null);
    } else {
      // Lesson complete
      showLessonSummary();
    }
  };

  const showLessonSummary = async () => {
    if (!user || !profile) return;

    const totalXP = lessonResults.reduce((sum, r) => sum + r.xp, 0);
    const correctCount = lessonResults.filter(r => r.isCorrect).length;

    // Award XP
    try {
      await profileService.addXP(user.id, totalXP);

      // Update streak
      await streakService.updateStreak(user.id);

      // Refresh profile to get updated values
      const updatedProfile = await profileService.getProfile(user.id);

      if (updatedProfile) {
        setLessonSummary({
          totalXP,
          correctCount,
          currentXP: updatedProfile.xp,
          currentLevel: updatedProfile.level,
          xpForNextLevel: updatedProfile.xp_for_next_level,
        });
        setShowCompleteModal(true);

        // Request app review if conditions met
        appReviewService.requestReviewIfAppropriate();
      }
    } catch (err) {
      logger.error('[MultipleChoiceScreen] Error awarding XP:', err);
    }
  };

  const handleModalClose = () => {
    setShowCompleteModal(false);
    navigation.goBack();
  };

  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.mutedGold} />
          <Text style={styles.loadingText}>Loading verses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={loadVerses} variant="olive" />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentVerse || !question) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary.mutedGold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Multiple Choice</Text>
          <Text style={styles.progressText}>
            {currentVerseIndex + 1} / {verses.length}
          </Text>
        </View>

        {/* Question Card */}
        <Card variant="warm" elevated style={styles.questionCard}>
          <VerseReference style={styles.verseReference}>
            {`${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse_number}`}
          </VerseReference>

          <View style={styles.promptContainer}>
            <Text style={styles.promptLabel}>This verse begins with:</Text>
            <Text style={styles.promptText}>"{question.startingText}..."</Text>
          </View>

          <Text style={styles.questionText}>Choose the correct verse:</Text>
        </Card>

        {/* Options */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = index === question.correctIndex;
            const showAsCorrect = hasAnswered && isCorrect;
            const showAsIncorrect = hasAnswered && isSelected && !isCorrect;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleOptionSelect(index)}
                disabled={hasAnswered}
                style={[
                  styles.optionCard,
                  isSelected && !hasAnswered && styles.optionCardSelected,
                  showAsCorrect && styles.optionCardCorrect,
                  showAsIncorrect && styles.optionCardIncorrect,
                ]}
              >
                <View style={styles.optionHeader}>
                  <Text style={[
                    styles.optionLabel,
                    isSelected && !hasAnswered && styles.optionLabelSelected,
                    showAsCorrect && styles.optionLabelCorrect,
                    showAsIncorrect && styles.optionLabelIncorrect,
                  ]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  {showAsCorrect && <Text style={styles.checkmark}>✓</Text>}
                  {showAsIncorrect && <Text style={styles.crossmark}>✗</Text>}
                </View>
                <Text style={[
                  styles.optionText,
                  showAsCorrect && styles.optionTextCorrect,
                  showAsIncorrect && styles.optionTextIncorrect,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Result Message */}
        {hasAnswered && (
          <Card variant="cream" style={styles.resultCard}>
            <Text style={[
              styles.resultText,
              selectedOption === question.correctIndex ? styles.resultTextCorrect : styles.resultTextIncorrect,
            ]}>
              {selectedOption === question.correctIndex
                ? '🎉 Correct! Well done!'
                : '💡 Keep practicing! You\'ll remember it next time.'}
            </Text>
          </Card>
        )}

        {/* Instructions */}
        {!hasAnswered && (
          <Card variant="cream" style={styles.instructionsCard}>
            <Text style={styles.instructionsText}>
              Select the answer that matches the verse reference above.
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!hasAnswered ? (
            <Button
              title="Check Answer"
              onPress={handleCheckAnswer}
              variant="olive"
              size="large"
              disabled={selectedOption === null}
            />
          ) : (
            <Button
              title={currentVerseIndex < verses.length - 1 ? "Next Verse →" : "Complete Lesson"}
              onPress={handleNextVerse}
              variant="olive"
              size="large"
            />
          )}
        </View>
      </ScrollView>

      {/* Lesson Complete Modal */}
      {lessonSummary && (
        <LessonCompleteModal
          visible={showCompleteModal}
          correctCount={lessonSummary.correctCount}
          totalVerses={verses.length}
          xpEarned={lessonSummary.totalXP}
          currentXP={lessonSummary.currentXP}
          currentLevel={lessonSummary.currentLevel}
          xpForNextLevel={lessonSummary.xpForNextLevel}
          onClose={handleModalClose}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  scrollContent: {
    padding: theme.spacing.screen.horizontal,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fonts.ui.default,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.screen.horizontal,
  },
  errorText: {
    fontFamily: theme.typography.fonts.ui.default,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.feedback.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  backButtonText: {
    fontFamily: theme.typography.fonts.ui.medium,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.secondary.mutedGold,
  },
  headerTitle: {
    fontFamily: theme.typography.fonts.ui.bold,
    fontSize: theme.typography.ui.h3.fontSize,
    color: theme.colors.text.primary,
  },
  progressText: {
    fontFamily: theme.typography.fonts.ui.medium,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
  },
  questionCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  verseReference: {
    marginBottom: theme.spacing.lg,
  },
  promptContainer: {
    backgroundColor: theme.colors.background.cream,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  promptLabel: {
    fontFamily: theme.typography.fonts.ui.medium,
    fontSize: theme.typography.ui.small.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  promptText: {
    fontFamily: theme.typography.fonts.scripture.medium,
    fontSize: 18,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
  },
  questionText: {
    fontFamily: theme.typography.fonts.ui.bold,
    fontSize: theme.typography.ui.h4.fontSize,
    color: theme.colors.text.primary,
  },
  optionCard: {
    backgroundColor: theme.colors.background.cream,
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  optionCardSelected: {
    borderColor: theme.colors.secondary.mutedGold,
    backgroundColor: '#fef9f0',
  },
  optionCardCorrect: {
    borderColor: theme.colors.success.mutedOlive,
    backgroundColor: '#e8f5e9',
  },
  optionCardIncorrect: {
    borderColor: theme.colors.feedback.error,
    backgroundColor: '#ffebee',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  optionLabel: {
    fontFamily: theme.typography.fonts.ui.bold,
    fontSize: 16,
    color: theme.colors.text.secondary,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.offWhiteParchment,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: theme.spacing.sm,
  },
  optionLabelSelected: {
    backgroundColor: theme.colors.secondary.mutedGold,
    color: '#fff',
  },
  optionLabelCorrect: {
    backgroundColor: theme.colors.success.mutedOlive,
    color: '#fff',
  },
  optionLabelIncorrect: {
    backgroundColor: theme.colors.feedback.error,
    color: '#fff',
  },
  checkmark: {
    fontSize: 20,
    color: theme.colors.success.mutedOlive,
    fontWeight: 'bold',
  },
  crossmark: {
    fontSize: 20,
    color: theme.colors.feedback.error,
    fontWeight: 'bold',
  },
  optionText: {
    fontFamily: theme.typography.fonts.scripture.default,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  optionTextCorrect: {
    color: theme.colors.success.mutedOlive,
  },
  optionTextIncorrect: {
    color: theme.colors.text.secondary,
  },
  resultCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  resultText: {
    fontFamily: theme.typography.fonts.ui.bold,
    fontSize: theme.typography.ui.h4.fontSize,
    textAlign: 'center',
  },
  resultTextCorrect: {
    color: theme.colors.success.mutedOlive,
  },
  resultTextIncorrect: {
    color: theme.colors.feedback.error,
  },
  instructionsCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  instructionsText: {
    fontFamily: theme.typography.fonts.ui.default,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
  },
});

export default MultipleChoiceScreen;
