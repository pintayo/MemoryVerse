/**
 * Spacing System
 * Generous breathing space for clarity and reverence
 */

console.log('[theme/spacing] Loading spacing module...');

export const spacing = {
  // Base spacing unit (8px)
  unit: 8,

  // Spacing scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Component-specific spacing
  screen: {
    horizontal: 24,
    vertical: 32,
    top: 16,
    bottom: 24,
  },

  card: {
    padding: 20,
    margin: 16,
    gap: 12,
  },

  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },

  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Safe areas
  safeArea: {
    top: 12,
    bottom: 24,
    horizontal: 16,
  },
};

console.log('[theme/spacing] spacing object created successfully');

export default spacing;

console.log('[theme/spacing] Spacing module loaded successfully!');
