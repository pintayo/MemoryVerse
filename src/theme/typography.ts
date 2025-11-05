/**
 * Biblical Typography System
 * Elegant serif fonts for Scripture, soft sans-serif for UI text
 */

console.log('[theme/typography] Loading typography module...');

export const typography = {
  // Font Families
  fonts: {
    // Scripture text - Elegant serif
    scripture: {
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia',
    },
    // Alternative elegant serif
    scriptureAlt: {
      ios: 'Cormorant Garamond',
      android: 'serif',
      default: 'Cormorant Garamond',
    },
    // UI text - Soft, smooth sans-serif
    ui: {
      ios: 'Inter',
      android: 'Roboto',
      default: 'Inter',
    },
    // System fallbacks
    system: {
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    },
  },

  // Scripture Text Styles
  scripture: {
    large: {
      fontSize: 28,
      lineHeight: 40,
      letterSpacing: 0.3,
      fontWeight: '400' as const,
    },
    medium: {
      fontSize: 22,
      lineHeight: 32,
      letterSpacing: 0.25,
      fontWeight: '400' as const,
    },
    small: {
      fontSize: 18,
      lineHeight: 28,
      letterSpacing: 0.2,
      fontWeight: '400' as const,
    },
    reference: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.5,
      fontWeight: '500' as const,
    },
  },

  // UI Text Styles
  ui: {
    title: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 0,
      fontWeight: '600' as const,
    },
    heading: {
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: 0,
      fontWeight: '600' as const,
    },
    subheading: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      fontWeight: '500' as const,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
      fontWeight: '400' as const,
    },
    button: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.5,
      fontWeight: '600' as const,
    },
    buttonLarge: {
      fontSize: 18,
      lineHeight: 28,
      letterSpacing: 0.5,
      fontWeight: '600' as const,
    },
  },

  // Context/Explanation Text
  context: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.15,
    fontWeight: '400' as const,
  },

  // Stats and Numbers
  stats: {
    large: {
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: 0,
      fontWeight: '700' as const,
    },
    medium: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 0,
      fontWeight: '600' as const,
    },
    small: {
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: 0,
      fontWeight: '600' as const,
    },
  },
};

console.log('[theme/typography] typography object created successfully');

export default typography;

console.log('[theme/typography] Typography module loaded successfully!');
