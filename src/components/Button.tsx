import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'gold' | 'olive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    disabled && styles.button_disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.text_disabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'secondary' ? theme.colors.text.primary : theme.colors.text.onDark}
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },

  // Variants
  button_primary: {
    backgroundColor: theme.colors.secondary.softClay,
  },
  button_secondary: {
    backgroundColor: theme.colors.primary.oatmeal,
  },
  button_gold: {
    backgroundColor: theme.colors.secondary.lightGold,
  },
  button_olive: {
    backgroundColor: theme.colors.success.mutedOlive,
  },
  button_disabled: {
    backgroundColor: theme.colors.interactive.disabled,
    opacity: 0.5,
  },

  // Sizes
  button_small: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button_medium: {
    paddingHorizontal: theme.spacing.button.paddingHorizontal,
    paddingVertical: theme.spacing.button.paddingVertical,
  },
  button_large: {
    paddingHorizontal: 32,
    paddingVertical: 18,
  },

  // Text styles
  text: {
    fontFamily: theme.typography.fonts.ui.default,
    fontWeight: '600',
  },
  text_primary: {
    color: theme.colors.text.primary,
  },
  text_secondary: {
    color: theme.colors.text.primary,
  },
  text_gold: {
    color: theme.colors.text.primary,
  },
  text_olive: {
    color: theme.colors.text.onDark,
  },
  text_disabled: {
    color: theme.colors.text.tertiary,
  },
  text_small: {
    fontSize: 14,
    lineHeight: 20,
  },
  text_medium: {
    fontSize: theme.typography.ui.button.fontSize,
    lineHeight: theme.typography.ui.button.lineHeight,
  },
  text_large: {
    fontSize: theme.typography.ui.buttonLarge.fontSize,
    lineHeight: theme.typography.ui.buttonLarge.lineHeight,
  },
});

export default Button;
