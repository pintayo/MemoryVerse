import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.colors.text.tertiary}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.ui.bodySmall.fontSize,
    lineHeight: theme.typography.ui.bodySmall.lineHeight,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fonts.ui.default,
  },
  input: {
    backgroundColor: theme.colors.background.offWhiteParchment,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.input.paddingHorizontal,
    paddingVertical: theme.spacing.input.paddingVertical,
    fontSize: theme.typography.ui.body.fontSize,
    lineHeight: theme.typography.ui.body.lineHeight,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.ui.default,
    borderWidth: 1,
    borderColor: theme.colors.primary.mutedStone,
    ...theme.shadows.inner.light,
  },
  inputError: {
    borderColor: theme.colors.error.main,
  },
  errorText: {
    fontSize: theme.typography.ui.caption.fontSize,
    lineHeight: theme.typography.ui.caption.lineHeight,
    color: theme.colors.error.main,
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fonts.ui.default,
  },
});

export default Input;
