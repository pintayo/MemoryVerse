import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Input, VerseReference, LessonCompleteModal } from '../components';
import { theme } from '../theme';
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { verseService } from '../services/verseService';
import { profileService } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { Verse } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { practiceConfig } from '../config/practiceConfig';
import { speechRecognitionService } from '../services/speechRecognitionService';
import { spacedRepetitionService } from '../services/spacedRepetitionService';
import { streakService } from '../services/streakService';
import { appReviewService } from '../services/appReviewService';
import { Audio } from 'expo-av';

type Props = NativeStackScreenProps<RootStackParamList, 'Recall'>;

const RecallScreen: React.FC<Props> = ({ navigation, route }) => {
  const { verseId } = route.params;
  const { user, profile } = useAuth();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
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
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [partialSpeechText, setPartialSpeechText] = useState<string>('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [verseStartTime, setVerseStartTime] = useState<number>(Date.now());

  // Animation values
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const waveHeightAnim = useRef(new Animated.Value(20)).current; // Fixed: Use numeric value instead of animated height

  // Load verses on mount
  useEffect(() => {
    loadVerses();
  }, [verseId]);

  // Cleanup speech recognition and audio on unmount
  useEffect(() => {
    return () => {
      speechRecognitionService.destroy();
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [sound, recording]);

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load verses for the lesson (always load multiple for practice)
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
      logger.error('[RecallScreen] Error loading verses:', err);
      setError('Failed to load verses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Microphone recording animation
  const startRecording = async () => {
    try {
      // Clear any previous errors and partial text
      setSpeechError(null);
      setPartialSpeechText('');
      setRecordingUri(null);

      // Request audio permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setSpeechError('Audio permission not granted');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start animations
      setIsRecording(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animate wave height (using numeric value, not height style)
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveHeightAnim, {
            toValue: 40,
            duration: 400,
            useNativeDriver: false, // Height cannot use native driver
          }),
          Animated.timing(waveHeightAnim, {
            toValue: 20,
            duration: 400,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Start audio recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);

      // Start speech recognition
      const success = await speechRecognitionService.startListening(
        (result) => {
          // Handle speech results
          logger.log('[RecallScreen] Speech result:', result.text, 'isFinal:', result.isFinal);

          if (result.isFinal) {
            // Final result - update input but DON'T stop automatically
            setUserInput(result.text);
            setPartialSpeechText('');
          } else {
            // Partial result - show in UI
            setPartialSpeechText(result.text);
          }
        },
        (error) => {
          // Handle speech errors
          logger.error('[RecallScreen] Speech error:', error);
          setSpeechError(error);
        }
      );

      // If failed to start speech recognition, still continue with audio
      if (!success) {
        logger.warn('[RecallScreen] Speech recognition failed to start, continuing with audio only');
      }
    } catch (error) {
      logger.error('[RecallScreen] Error starting recording:', error);
      setSpeechError('Failed to start recording');
      setIsRecording(false);
      micPulseAnim.stopAnimation();
      waveHeightAnim.stopAnimation();
      micPulseAnim.setValue(1);
      waveHeightAnim.setValue(20);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      micPulseAnim.stopAnimation();
      waveHeightAnim.stopAnimation();
      micPulseAnim.setValue(1);
      waveHeightAnim.setValue(20);

      // Stop speech recognition
      await speechRecognitionService.stopListening();

      // Stop and save audio recording
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordingUri(uri);
        setRecording(null);
        logger.log('[RecallScreen] Recording stopped, saved to:', uri);
      }

      // Clear partial text
      setPartialSpeechText('');
    } catch (error) {
      logger.error('[RecallScreen] Error stopping recording:', error);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Load and play the recording
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      // Set up playback status update
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      logger.log('[RecallScreen] Playing recording');
    } catch (error) {
      logger.error('[RecallScreen] Error playing recording:', error);
      setSpeechError('Failed to play recording');
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setRecordingUri(null);
    setUserInput('');
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
  };

  const checkAnswer = async (answer: string) => {
    const verse = verses[currentVerseIndex];
    if (!verse || !user?.id) return;

    // Mark as answered
    setHasAnswered(true);

    // Use verseService to check answer accuracy
    const result = verseService.checkAnswer(verse.text, answer);
    setFeedback(result.isCorrect ? 'correct' : 'incorrect');

    // Calculate XP based on accuracy
    let xpEarned = 0;
    if (result.isCorrect) {
      if (result.accuracy >= 100) xpEarned = practiceConfig.xp.perfect;
      else if (result.accuracy >= 80) xpEarned = practiceConfig.xp.good;
      else if (result.accuracy >= 60) xpEarned = practiceConfig.xp.okay;
      else xpEarned = practiceConfig.xp.poor;
    }

    // Save result for end summary
    setLessonResults(prev => [...prev, {
      verseId: verse.id!,
      isCorrect: result.isCorrect,
      xp: xpEarned,
    }]);

    // Record practice session (but don't block on errors)
    try {
      await verseService.recordPracticeSession(user.id, verse.id, {
        session_type: 'recall',
        user_answer: answer,
        is_correct: result.isCorrect,
        accuracy_percentage: result.accuracy,
        hints_used: hintsUsed,
        xp_earned: xpEarned,
      });

      // Record review for spaced repetition system
      const timeSpentSeconds = Math.floor((Date.now() - verseStartTime) / 1000);
      const accuracyScore = result.accuracy / 100; // Convert to 0-1 scale

      // Get or create user_verse_progress entry
      const { data: existingProgress } = await supabase
        .from('user_verse_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('verse_id', verse.id)
        .maybeSingle();

      if (existingProgress?.id) {
        // Update existing progress with spaced repetition
        await spacedRepetitionService.recordReview(
          existingProgress.id,
          accuracyScore,
          timeSpentSeconds
        );
      } else {
        // Create new progress entry
        const { data: newProgress } = await supabase
          .from('user_verse_progress')
          .insert({
            user_id: user.id,
            verse_id: verse.id,
            status: 'learning',
            accuracy_score: accuracyScore,
            attempts: 1,
            last_practiced_at: new Date().toISOString(),
            next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          })
          .select('id')
          .single();

        if (newProgress?.id) {
          await spacedRepetitionService.recordReview(
            newProgress.id,
            accuracyScore,
            timeSpentSeconds
          );
        }
      }

      // Record daily practice for streak tracking
      await streakService.recordPractice(user.id);

      // Update profile streak
      await profileService.recordDailyPractice(user.id);

    } catch (error: any) {
      // Log but don't block - duplicate key errors are OK (means we already have progress for this verse)
      if (error?.code !== '23505') {
        logger.error('[RecallScreen] Error recording practice session:', error);
      }
    }

    // Animate feedback
    Animated.sequence([
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNextVerse = () => {
    if (currentVerseIndex < verses.length - 1) {
      // Move to next verse
      setCurrentVerseIndex(currentVerseIndex + 1);
      setUserInput('');
      setFeedback(null);
      setShowHint(false);
      setShowAnswer(false);
      setHintsUsed(0);
      setHasAnswered(false);
      setSpeechError(null);
      setPartialSpeechText('');
      setRecordingUri(null);
      setIsPlaying(false);
      setVerseStartTime(Date.now()); // Reset timer for next verse
      feedbackAnim.setValue(0);

      // Cleanup audio
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
    } else {
      // Show lesson summary
      showLessonSummary();
    }
  };

  const showLessonSummary = async () => {
    const totalXP = lessonResults.reduce((sum, r) => sum + r.xp, 0);
    const correctCount = lessonResults.filter(r => r.isCorrect).length;

    // Get current profile and award XP
    let currentXP = 0;
    let currentLevel = 1;
    let xpForNextLevel = 100;

    if (user?.id) {
      try {
        // Award total XP first
        if (totalXP > 0) {
          await profileService.addXP(user.id, totalXP);
        }

        // Then fetch updated profile to get correct values
        const profile = await profileService.getProfile(user.id);
        if (profile) {
          const totalXPEarned = profile.total_xp || 0;
          currentLevel = profile.level || 1;

          // Calculate XP within current level
          const xpForCurrentLevel = (currentLevel - 1) * (currentLevel - 1) * 100;
          const xpForNext = currentLevel * currentLevel * 100;

          currentXP = totalXPEarned - xpForCurrentLevel; // XP within current level
          xpForNextLevel = xpForNext - xpForCurrentLevel; // XP needed for this level
        }
      } catch (error) {
        logger.error('[RecallScreen] Error awarding XP:', error);
      }
    }

    // Show completion modal
    setLessonSummary({
      totalXP,
      correctCount,
      currentXP,
      currentLevel,
      xpForNextLevel,
    });
    setShowCompleteModal(true);

    // Check if we should prompt for app review after successful practice
    if (correctCount > 0 && profile) {
      try {
        // Get achievement count (estimate based on badges earned)
        const achievementsUnlocked =
          (profile.current_streak || 0) >= 3 ? 1 : 0 + // Consistent learner
          (profile.verses_memorized || 0) >= 10 ? 1 : 0 + // Memory builder
          (profile.current_streak || 0) >= 1 ? 1 : 0; // First steps

        await appReviewService.checkAndPromptAfterPositiveEvent(
          profile.verses_memorized || 0,
          profile.current_streak || 0,
          achievementsUnlocked
        );
      } catch (error) {
        logger.error('[RecallScreen] Error checking review prompt:', error);
      }
    }
  };

  const handleModalClose = () => {
    setShowCompleteModal(false);
    navigation.goBack();
  };

  const handleSubmit = () => {
    checkAnswer(userInput);
  };

  const toggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleRecordAgain = () => {
    deleteRecording();
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.scrollContent, styles.centerContent]}>
          <ActivityIndicator size="large" color={theme.colors.secondary.lightGold} />
          <Text style={styles.loadingText}>Loading verse...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || verses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.scrollContent, styles.centerContent]}>
          <Text style={styles.errorText}>{error || 'No verses found'}</Text>
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

  const verse = verses[currentVerseIndex];
  const verseReference = `${verse.book} ${verse.chapter}:${verse.verse_number}`;
  const hintText = verse.text.substring(0, Math.min(30, verse.text.length)) + '...';
  const progress = `${currentVerseIndex + 1}/${verses.length}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Practice the Verse</Text>
          <Text style={styles.subtitle}>Type or speak what you remember</Text>
          <View style={styles.progressIndicator}>
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        </View>

        {/* Blurred verse preview */}
        <Card variant="warm" style={styles.versePreviewCard}>
          <Text style={[
            showAnswer || feedback === 'incorrect' ? styles.revealedVerse : styles.blurredVerse
          ]} numberOfLines={5}>
            {showAnswer || feedback === 'incorrect' ? verse.text : '******************************************'}
          </Text>
          <VerseReference style={styles.reference}>
            {verseReference}
          </VerseReference>
          {!showHint && !showAnswer && (
            <TouchableOpacity
              onPress={() => {
                setShowHint(true);
                setHintsUsed(hintsUsed + 1);
              }}
              style={styles.hintButton}
            >
              <Text style={styles.hintButtonText}>Show Hint</Text>
            </TouchableOpacity>
          )}
          {showHint && !showAnswer && (
            <View style={styles.hintContainer}>
              <Text style={styles.hintLabel}>Hint:</Text>
              <Text style={styles.hintText}>{hintText}</Text>
            </View>
          )}
        </Card>

        {/* Input section */}
        <View style={styles.inputSection}>
          <Input
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Type the verse here..."
            multiline
            numberOfLines={4}
            style={styles.textInput}
            containerStyle={styles.inputContainer}
          />

          {/* Microphone button */}
          <View style={styles.micSection}>
            <Text style={styles.orText}>or</Text>
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
                onPress={toggleMic}
                activeOpacity={0.8}
              >
                <Svg width="32" height="32" viewBox="0 0 24 24">
                  <Path
                    d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17.91 11C17.91 14.39 15.2 17.18 11.91 17.49V21H10.91V17.49C7.62 17.18 4.91 14.39 4.91 11H6.91C6.91 13.76 9.15 16 11.91 16C14.67 16 16.91 13.76 16.91 11H17.91Z"
                    fill={isRecording ? theme.colors.text.onDark : theme.colors.text.primary}
                  />
                </Svg>
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.micLabel}>
              {isRecording
                ? partialSpeechText
                  ? `"${partialSpeechText}"`
                  : 'Listening...'
                : 'Tap to speak'}
            </Text>
          </View>

          {/* Speech error message */}
          {speechError && (
            <View style={styles.speechErrorContainer}>
              <Svg width="20" height="20" viewBox="0 0 24 24">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                  fill={theme.colors.error.main}
                />
              </Svg>
              <Text style={styles.speechErrorText}>{speechError}</Text>
            </View>
          )}

          {/* Audio waveform (when recording) */}
          {isRecording && (
            <View style={styles.waveformContainer}>
              {[...Array(12)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: waveHeightAnim,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Playback controls (when recording exists) */}
          {recordingUri && !isRecording && (
            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={styles.playbackButton}
                onPress={isPlaying ? stopPlayback : playRecording}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24">
                  {isPlaying ? (
                    <Path
                      d="M6 6H10V18H6V6ZM14 6H18V18H14V6Z"
                      fill={theme.colors.secondary.lightGold}
                    />
                  ) : (
                    <Path
                      d="M8 5V19L19 12L8 5Z"
                      fill={theme.colors.secondary.lightGold}
                    />
                  )}
                </Svg>
                <Text style={styles.playbackButtonText}>
                  {isPlaying ? 'Stop Playback' : 'Play Recording'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleRecordAgain}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24">
                  <Path
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                    fill={theme.colors.error.main}
                  />
                </Svg>
                <Text style={styles.deleteButtonText}>Re-record</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Feedback */}
        {feedback && (
          <Animated.View
            style={[
              styles.feedbackContainer,
              feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect,
              {
                opacity: feedbackAnim,
                transform: [
                  {
                    translateY: feedbackAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24">
              {feedback === 'correct' ? (
                <Path
                  d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                  fill={theme.colors.success.mutedOlive}
                />
              ) : (
                <Path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                  fill={theme.colors.error.main}
                />
              )}
            </Svg>
            <Text
              style={[
                styles.feedbackText,
                feedback === 'correct' ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect,
              ]}
            >
              {feedback === 'correct'
                ? 'Excellent! You remembered it!'
                : "Not quite. Try again or check the hint."}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Fixed action buttons at bottom */}
      <View style={styles.buttonRow}>
        {!hasAnswered && !showAnswer && (
          <>
            <Button
              title="Give Answer"
              onPress={() => {
                setShowAnswer(true);
                setHasAnswered(true);
                // Record as gave up - no XP
                setLessonResults(prev => [...prev, {
                  verseId: verse.id!,
                  isCorrect: false,
                  xp: practiceConfig.xp.gaveUp,
                }]);
              }}
              variant="secondary"
              style={styles.giveAnswerButton}
            />
            <Button
              title="Check Answer"
              onPress={handleSubmit}
              variant="olive"
              disabled={!userInput.trim() || isRecording}
              style={styles.submitButton}
            />
          </>
        )}
        {hasAnswered && (
          <Button
            title={currentVerseIndex < verses.length - 1 ? "Next Verse" : "Finish Lesson"}
            onPress={handleNextVerse}
            variant="gold"
            style={styles.nextButton}
          />
        )}
      </View>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingTop: theme.spacing.lg,
    paddingBottom: 100, // Extra padding for fixed button row
  },
  header: {
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
  },
  progressIndicator: {
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.secondary.lightGold,
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  versePreviewCard: {
    marginBottom: theme.spacing.lg,
  },
  blurredVerse: {
    fontFamily: theme.typography.fonts.scripture.default,
    fontSize: theme.typography.scripture.medium.fontSize,
    lineHeight: theme.typography.scripture.medium.lineHeight,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    opacity: 0.3,
    marginBottom: theme.spacing.md,
  },
  revealedVerse: {
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
  hintButton: {
    marginTop: theme.spacing.md,
    alignSelf: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.secondary.lightGold,
  },
  hintButtonText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  hintContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.md,
  },
  hintLabel: {
    fontSize: theme.typography.ui.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.secondary.lightGold,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fonts.ui.default,
  },
  hintText: {
    fontFamily: theme.typography.fonts.scripture.default,
    fontSize: theme.typography.scripture.small.fontSize,
    color: theme.colors.text.secondary,
  },
  inputSection: {
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  micSection: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  orText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fonts.ui.default,
  },
  micButtonContainer: {
    marginBottom: theme.spacing.sm,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.secondary.lightGold,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  micButtonActive: {
    backgroundColor: theme.colors.success.mutedOlive,
    ...theme.shadows.glow.gold,
  },
  micLabel: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  speechErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.error.light,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.lg,
  },
  speechErrorText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    color: theme.colors.error.main,
    fontFamily: theme.typography.fonts.ui.default,
    flex: 1,
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  waveBar: {
    width: 4,
    backgroundColor: theme.colors.success.celebratoryGold,
    borderRadius: 2,
    opacity: 0.6,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.lightCream,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.secondary.lightGold,
  },
  playbackButtonText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.error.light,
    borderRadius: theme.borderRadius.md,
  },
  deleteButtonText: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    fontWeight: '600',
    color: theme.colors.error.main,
    fontFamily: theme.typography.fonts.ui.default,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  feedbackCorrect: {
    backgroundColor: theme.colors.success.mutedOlive,
  },
  feedbackIncorrect: {
    backgroundColor: theme.colors.error.light,
  },
  feedbackText: {
    flex: 1,
    fontSize: theme.typography.ui.body.fontSize,
    fontFamily: theme.typography.fonts.ui.default,
  },
  feedbackTextCorrect: {
    color: theme.colors.text.onDark,
  },
  feedbackTextIncorrect: {
    color: theme.colors.text.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary.oatmeal,
  },
  giveAnswerButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  nextButton: {
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
});

export default RecallScreen;
