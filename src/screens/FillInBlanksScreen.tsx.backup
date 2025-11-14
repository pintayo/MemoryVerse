import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, ActivityIndicator, Modal } from 'react-native';
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
import { practiceService, BlankQuestion, BlankWord } from '../services/practiceService';
import { supabase } from '../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'FillInBlanks'>;

const FillInBlanksScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, profile } = useAuth();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blankQuestion, setBlankQuestion] = useState<BlankQuestion | null>(null);
  const [selectedBlankIndex, setSelectedBlankIndex] = useState<number | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
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

  // Generate blanks when verse changes
  useEffect(() => {
    if (currentVerse) {
      generateBlanksForVerse(currentVerse);
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
      logger.error('[FillInBlanksScreen] Error loading verses:', err);
      setError('Failed to load verses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBlanksForVerse = async (verse: Verse) => {
    try {
      // Get some other verses for generating distractor words
      const otherVerses: Verse[] = [];
      for (let i = 0; i < 20; i++) {
        const otherVerse = await verseService.getRandomVerse('KJV');
        if (otherVerse && otherVerse.id !== verse.id) {
          otherVerses.push(otherVerse);
        }
      }

      const question = practiceService.generateBlanks(verse, otherVerses);
      setBlankQuestion(question);
      setHasAnswered(false);
    } catch (err) {
      logger.error('[FillInBlanksScreen] Error generating blanks:', err);
    }
  };

  const handleBlankPress = (blankIndex: number) => {
    if (hasAnswered) return; // Don't allow changes after checking

    setSelectedBlankIndex(blankIndex);
    setShowOptionsModal(true);
  };

  const handleOptionSelect = (option: string) => {
    if (!blankQuestion || selectedBlankIndex === null) return;

    // Update the blank with user's answer
    const updatedBlanks = [...blankQuestion.blanks];
    updatedBlanks[selectedBlankIndex].userAnswer = option;

    setBlankQuestion({
      ...blankQuestion,
      blanks: updatedBlanks,
    });

    setShowOptionsModal(false);
    setSelectedBlankIndex(null);
  };

  const allBlanksFilled = () => {
    if (!blankQuestion) return false;
    return blankQuestion.blanks.every(blank => blank.userAnswer !== null);
  };

  const handleCheckAnswer = async () => {
    if (!blankQuestion || !currentVerse || !user) return;

    setHasAnswered(true);

    const timeSpent = Math.floor((Date.now() - verseStartTime) / 1000);

    // Check answer
    const result = practiceService.checkBlanksAnswer(blankQuestion.blanks);

    // Show incorrect answers with shake animation
    if (!result.isCorrect) {
      triggerShakeAnimation();
    }

    // Calculate XP
    const xpEarned = practiceService.calculateXP(result.accuracy, 'fill-in-blanks');

    // Record practice session
    try {
      await verseService.recordPracticeSession(user.id, currentVerse.id, {
        session_type: 'fill-in-blanks',
        user_answer: blankQuestion.blanks.map(b => b.userAnswer || '').join(' '),
        is_correct: result.isCorrect,
        accuracy_percentage: result.accuracy,
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
          result.accuracy,
          timeSpent
        );
      }

      // Record result
      setLessonResults(prev => [...prev, {
        verseId: currentVerse.id,
        isCorrect: result.isCorrect,
        xp: xpEarned,
      }]);
    } catch (err) {
      logger.error('[FillInBlanksScreen] Error recording practice:', err);
    }
  };

  const handleNextVerse = () => {
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
      setBlankQuestion(null);
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
      logger.error('[FillInBlanksScreen] Error awarding XP:', err);
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

  const renderBlankText = () => {
    if (!blankQuestion) return null;

    const words = currentVerse.text.split(/\s+/);
    const elements: JSX.Element[] = [];

    let blankCounter = 0;
    words.forEach((word, index) => {
      const blankAtIndex = blankQuestion.blanks.find(b => b.index === index);

      if (blankAtIndex) {
        const isCorrect = hasAnswered && blankAtIndex.userAnswer === blankAtIndex.correctWord;
        const isIncorrect = hasAnswered && blankAtIndex.userAnswer && blankAtIndex.userAnswer !== blankAtIndex.correctWord;

        elements.push(
          <TouchableOpacity
            key={`blank-${index}`}
            onPress={() => handleBlankPress(blankCounter)}
            disabled={hasAnswered}
            style={[
              styles.blankButton,
              blankAtIndex.userAnswer && styles.blankButtonFilled,
              isCorrect && styles.blankButtonCorrect,
              isIncorrect && styles.blankButtonIncorrect,
            ]}
          >
            <Text style={[
              styles.blankText,
              blankAtIndex.userAnswer && styles.blankTextFilled,
              isCorrect && styles.blankTextCorrect,
              isIncorrect && styles.blankTextIncorrect,
            ]}>
              {hasAnswered && !blankAtIndex.userAnswer
                ? blankAtIndex.correctWord
                : blankAtIndex.userAnswer || '_____'}
            </Text>
          </TouchableOpacity>
        );
        blankCounter++;
      } else {
        elements.push(
          <Text key={`word-${index}`} style={styles.verseWord}>
            {word}
          </Text>
        );
      }

      // Add space after each word except the last
      if (index < words.length - 1) {
        elements.push(
          <Text key={`space-${index}`} style={styles.verseWord}> </Text>
        );
      }
    });

    return <View style={styles.verseTextContainer}>{elements}</View>;
  };

  const renderOptionsModal = () => {
    if (!blankQuestion || selectedBlankIndex === null) return null;

    const blank = blankQuestion.blanks[selectedBlankIndex];

    return (
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose the correct word:</Text>
            {blank.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleOptionSelect(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
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

  if (!currentVerse || !blankQuestion) {
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
          <Text style={styles.headerTitle}>Fill in the Blanks</Text>
          <Text style={styles.progressText}>
            {currentVerseIndex + 1} / {verses.length}
          </Text>
        </View>

        {/* Verse Card */}
        <Card variant="warm" elevated style={styles.verseCard}>
          <VerseReference
            book={currentVerse.book}
            chapter={currentVerse.chapter}
            verse={currentVerse.verse_number}
            size="medium"
            style={styles.verseReference}
          />

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            {renderBlankText()}
          </Animated.View>

          {hasAnswered && (
            <View style={styles.resultContainer}>
              {blankQuestion && (() => {
                const result = practiceService.checkBlanksAnswer(blankQuestion.blanks);
                return (
                  <>
                    <Text style={[
                      styles.resultText,
                      result.isCorrect ? styles.resultTextCorrect : styles.resultTextIncorrect,
                    ]}>
                      {result.isCorrect ? '✓ Correct!' : '✗ Try to remember for next time'}
                    </Text>
                    <Text style={styles.accuracyText}>
                      {result.correctCount} / {result.totalCount} correct ({Math.round(result.accuracy)}%)
                    </Text>
                  </>
                );
              })()}
            </View>
          )}
        </Card>

        {/* Instructions */}
        {!hasAnswered && (
          <Card variant="cream" style={styles.instructionsCard}>
            <Text style={styles.instructionsText}>
              Tap on each blank to choose the correct word from the options.
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
              disabled={!allBlanksFilled()}
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

      {/* Options Modal */}
      {renderOptionsModal()}

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
  verseCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  verseReference: {
    marginBottom: theme.spacing.md,
  },
  verseTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  verseWord: {
    fontFamily: theme.typography.fonts.scripture.default,
    fontSize: 18,
    lineHeight: 28,
    color: theme.colors.text.primary,
  },
  blankButton: {
    backgroundColor: theme.colors.background.cream,
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginVertical: 2,
  },
  blankButtonFilled: {
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderStyle: 'solid',
  },
  blankButtonCorrect: {
    backgroundColor: '#e8f5e9',
    borderColor: theme.colors.success.mutedOlive,
  },
  blankButtonIncorrect: {
    backgroundColor: '#ffebee',
    borderColor: theme.colors.feedback.error,
  },
  blankText: {
    fontFamily: theme.typography.fonts.scripture.default,
    fontSize: 18,
    color: theme.colors.text.tertiary,
  },
  blankTextFilled: {
    color: theme.colors.text.primary,
  },
  blankTextCorrect: {
    color: theme.colors.success.mutedOlive,
    fontFamily: theme.typography.fonts.scripture.medium,
  },
  blankTextIncorrect: {
    color: theme.colors.feedback.error,
    textDecorationLine: 'line-through',
  },
  resultContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.cream,
    borderRadius: theme.borderRadius.md,
  },
  resultText: {
    fontFamily: theme.typography.fonts.ui.bold,
    fontSize: theme.typography.ui.h4.fontSize,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  resultTextCorrect: {
    color: theme.colors.success.mutedOlive,
  },
  resultTextIncorrect: {
    color: theme.colors.feedback.error,
  },
  accuracyText: {
    fontFamily: theme.typography.fonts.ui.default,
    fontSize: theme.typography.ui.body.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: theme.typography.fonts.ui.bold,
    fontSize: theme.typography.ui.h4.fontSize,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  optionButton: {
    backgroundColor: theme.colors.background.cream,
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  optionText: {
    fontFamily: theme.typography.fonts.scripture.default,
    fontSize: 18,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});

export default FillInBlanksScreen;
