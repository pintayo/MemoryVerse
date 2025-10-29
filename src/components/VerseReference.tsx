import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { theme } from '../theme';

interface VerseReferenceProps {
  children: React.ReactNode;
  style?: TextStyle;
}

const VerseReference: React.FC<VerseReferenceProps> = ({ children, style }) => {
  return <Text style={[styles.reference, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  reference: {
    fontFamily: theme.typography.fonts.scripture.default,
    fontSize: theme.typography.scripture.reference.fontSize,
    lineHeight: theme.typography.scripture.reference.lineHeight,
    letterSpacing: theme.typography.scripture.reference.letterSpacing,
    fontWeight: theme.typography.scripture.reference.fontWeight,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default VerseReference;
