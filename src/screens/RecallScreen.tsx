import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Input, VerseReference } from '../components';
import { theme } from '../theme';
import Svg, { Path, Circle } from 'react-native-svg';

interface RecallScreenProps {
  navigation: any;
}

const RecallScreen: React.FC<RecallScreenProps> = ({ navigation }) => {
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Animation values
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Sample verse data
  const verse = {
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11",
    hint: "For I know the _____ I have for you...",
    blankWords: ["plans", "prosper", "hope", "future"],
  };

  // Microphone recording animation
  const startRecording = () => {
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

    // Simulate recording waveform
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();

    // Auto-stop after 5 seconds (in real app, this would be user-controlled)
    setTimeout(() => {
      stopRecording();
    }, 5000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    micPulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    micPulseAnim.setValue(1);
    waveAnim.setValue(0);
    // In real app, process voice input here
    checkAnswer("For I know the plans I have for you");
  };

  const checkAnswer = (answer: string) => {
    // Simple check - in real app, use fuzzy matching
    const isCorrect = answer.toLowerCase().includes('plans') && answer.toLowerCase().includes('prosper');
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    // Animate feedback
    Animated.sequence([
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isCorrect) {
        // Navigate to next screen or back
        setTimeout(() => navigation.goBack(), 500);
      }
    });
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Recall the Verse</Text>
          <Text style={styles.subtitle}>Type or speak what you remember</Text>
        </View>

        {/* Blurred verse preview */}
        <Card variant="warm" style={styles.versePreviewCard}>
          <Text style={styles.blurredVerse} numberOfLines={3}>
            {verse.text}
          </Text>
          <VerseReference style={styles.reference}>
            {verse.reference}
          </VerseReference>
          {!showHint && (
            <TouchableOpacity onPress={() => setShowHint(true)} style={styles.hintButton}>
              <Text style={styles.hintButtonText}>Show Hint</Text>
            </TouchableOpacity>
          )}
          {showHint && (
            <View style={styles.hintContainer}>
              <Text style={styles.hintLabel}>Hint:</Text>
              <Text style={styles.hintText}>{verse.hint}</Text>
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
              {isRecording ? 'Recording...' : 'Tap to speak'}
            </Text>
          </View>

          {/* Audio waveform (when recording) */}
          {isRecording && (
            <View style={styles.waveformContainer}>
              {[...Array(12)].map((_, i) => {
                const height = waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, Math.random() * 40 + 10],
                });
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height,
                        animationDelay: `${i * 50}ms`,
                      },
                    ]}
                  />
                );
              })}
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

        {/* Submit button */}
        <Button
          title="Check Answer"
          onPress={handleSubmit}
          variant="olive"
          disabled={!userInput.trim() || isRecording}
          style={styles.submitButton}
        />
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
  versePreviewCard: {
    marginBottom: theme.spacing.xl,
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
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  textInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  micSection: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
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
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  waveBar: {
    width: 4,
    backgroundColor: theme.colors.success.celebratoryGold,
    borderRadius: 2,
    opacity: 0.6,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
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
  submitButton: {
    marginTop: theme.spacing.lg,
  },
});

export default RecallScreen;
