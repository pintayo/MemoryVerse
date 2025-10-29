import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { theme } from '../theme';

interface VerseTextProps {
  children: React.ReactNode;
  size?: 'large' | 'medium' | 'small';
  style?: TextStyle;
}

const VerseText: React.FC<VerseTextProps> = ({
  children,
  size = 'medium',
  style,
}) => {
  return (
    <Text style={[styles.verse, styles[`verse_${size}`], style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  verse: {
    fontFamily: theme.typography.fonts.scripture.default,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  verse_large: {
    fontSize: theme.typography.scripture.large.fontSize,
    lineHeight: theme.typography.scripture.large.lineHeight,
    letterSpacing: theme.typography.scripture.large.letterSpacing,
  },
  verse_medium: {
    fontSize: theme.typography.scripture.medium.fontSize,
    lineHeight: theme.typography.scripture.medium.lineHeight,
    letterSpacing: theme.typography.scripture.medium.letterSpacing,
  },
  verse_small: {
    fontSize: theme.typography.scripture.small.fontSize,
    lineHeight: theme.typography.scripture.small.lineHeight,
    letterSpacing: theme.typography.scripture.small.letterSpacing,
  },
});

export default VerseText;
