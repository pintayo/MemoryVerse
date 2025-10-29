import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'parchment' | 'cream' | 'warm';
  elevated?: boolean;
  outlined?: boolean;
  style?: ViewStyle;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'parchment',
  elevated = true,
  outlined = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.card,
        styles[`card_${variant}`],
        elevated && styles.elevated,
        outlined && styles.outlined,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.card.padding,
  },

  // Variants
  card_parchment: {
    backgroundColor: theme.colors.background.offWhiteParchment,
  },
  card_cream: {
    backgroundColor: theme.colors.background.lightCream,
  },
  card_warm: {
    backgroundColor: theme.colors.background.warmParchment,
  },

  // Elevation
  elevated: {
    ...theme.shadows.md,
  },

  // Outlined
  outlined: {
    borderWidth: 1.5,
    borderColor: theme.colors.secondary.lightGold,
  },
});

export default Card;
