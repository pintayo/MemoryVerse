import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface ChapterContextProps {
  book: string;
  chapter: number;
  verseNumber: number;
}

const ChapterContext: React.FC<ChapterContextProps> = ({ book, chapter, verseNumber }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="book-outline" size={14} color={theme.colors.secondary.lightGold} />
      <Text style={styles.text}>
        {book}, Chapter {chapter}, Verse {verseNumber}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.warmParchment,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '500',
  },
});

export default ChapterContext;
