/**
 * Native Modules Configuration
 * Controls whether native modules are loaded based on environment
 *
 * In Expo Go: Native modules are disabled (incompatible)
 * In EAS Build: Native modules are enabled
 */

import Constants from 'expo-constants';

/**
 * Check if we're running in Expo Go
 * Expo Go has appOwnership of 'expo', while standalone builds have 'standalone'
 */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Global flag to enable/disable native modules
 * Set to false in Expo Go, true in production builds
 */
export const ENABLE_NATIVE_MODULES = !isExpoGo;

// Log the mode for debugging
console.log(`[NativeModules] Running in ${isExpoGo ? 'Expo Go' : 'Production Build'} mode`);
console.log(`[NativeModules] Native modules ${ENABLE_NATIVE_MODULES ? 'ENABLED' : 'DISABLED'}`);
