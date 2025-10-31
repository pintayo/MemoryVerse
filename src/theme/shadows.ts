/**
 * Shadow System
 * Subtle shadows and gentle glows for depth without being flat or skeuomorphic
 */

console.log('[theme/shadows] Loading shadows module...');

export const shadows = {
  // Subtle elevation shadows
  sm: {
    shadowColor: '#695541',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  md: {
    shadowColor: '#695541',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  lg: {
    shadowColor: '#695541',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  // Gentle glows for interactive elements
  glow: {
    gold: {
      shadowColor: '#D4AF6A',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    olive: {
      shadowColor: '#8B956D',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
  },

  // Inner shadows for inputs
  inner: {
    light: {
      shadowColor: '#695541',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 0,
    },
  },
};

console.log('[theme/shadows] shadows object created successfully');

export default shadows;

console.log('[theme/shadows] Shadows module loaded successfully!');
