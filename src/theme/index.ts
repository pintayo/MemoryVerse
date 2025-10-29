/**
 * MemoryVerse Design System
 * Biblical-themed design inspired by historical fabrics and ancient manuscripts
 */

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  shadows,

  // Border Radius - Soft, rounded corners
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },

  // Animations - Smooth, soft transitions
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
      celebration: 600,
    },
    easing: {
      standard: 'ease-in-out',
      gentle: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },

  // Transitions
  transition: {
    default: 'all 250ms ease-in-out',
    fast: 'all 150ms ease-in-out',
    slow: 'all 350ms ease-in-out',
  },

  // Icon sizes
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
};

export { colors, typography, spacing, shadows };
export default theme;
