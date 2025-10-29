import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, VerseText, VerseReference } from '../components';
import { theme } from '../theme';

interface VerseCardScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const VerseCardScreen: React.FC<VerseCardScreenProps> = ({ navigation }) => {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [showContext, setShowContext] = useState(false);

  // Animation values for page turn effect
  const pageFlipAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Sample verses data
  const verses = [
    {
      text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      reference: "Proverbs 3:5-6",
      context: "This passage reminds us to rely on God's wisdom rather than our limited human understanding. When we acknowledge Him in all our decisions, He promises to guide our way.",
    },
    {
      text: "I can do all things through Christ who strengthens me.",
      reference: "Philippians 4:13",
      context: "Paul wrote these words while imprisoned, reminding us that true strength comes from Christ, enabling us to face any circumstance with His power.",
    },
    {
      text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      reference: "John 3:16",
      context: "The most famous verse in Scripture, summarizing the entire gospel message: God's love, Jesus' sacrifice, and the gift of eternal life through faith.",
    },
  ];

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

  const toggleContext = () => {
    setShowContext(!showContext);
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

            {/* Verse text */}
            <View style={styles.verseContainer}>
              <VerseText size="large" style={styles.verse}>
                {currentVerse.text}
              </VerseText>
              <VerseReference style={styles.reference}>
                {currentVerse.reference}
              </VerseReference>
            </View>

            {/* Context section */}
            {showContext && (
              <View style={styles.contextContainer}>
                <View style={styles.contextDivider} />
                <Text style={styles.contextLabel}>Context</Text>
                <Text style={styles.contextText}>{currentVerse.context}</Text>
              </View>
            )}

            {/* Decorative bottom border */}
            <View style={[styles.decorativeBorder, styles.decorativeBorderBottom]} />
          </Card>
        </Animated.View>

        {/* Action buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            title={showContext ? "Hide Context" : "Show Context"}
            onPress={toggleContext}
            variant="gold"
            style={styles.contextButton}
          />

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
    flex: 1,
    paddingVertical: theme.spacing.xxl,
    justifyContent: 'center',
  },
  decorativeBorder: {
    height: 2,
    backgroundColor: theme.colors.secondary.lightGold,
    marginHorizontal: theme.spacing.xl,
    opacity: 0.3,
  },
  decorativeBorderBottom: {
    marginTop: theme.spacing.xl,
  },
  verseContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
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
