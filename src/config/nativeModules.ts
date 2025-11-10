/**
 * Native Modules Configuration
 * Controls whether native modules are loaded based on environment
 *
 * In Expo Go: Native modules are disabled (incompatible)
 * In EAS Build: Native modules are enabled
 */

console.log('[NativeModules] ========== LOADING nativeModules.ts ==========');

import Constants from 'expo-constants';

console.log('[NativeModules] Constants imported');
console.log('[NativeModules] Constants.appOwnership:', Constants.appOwnership);
console.log('[NativeModules] Constants.executionEnvironment:', Constants.executionEnvironment);

/**
 * Check if we're running in Expo Go
 * Expo Go has appOwnership of 'expo', while standalone builds have 'standalone'
 * If appOwnership is null/undefined, we're likely in Expo Go during development
 */
const isExpoGo = Constants.appOwnership === 'expo' ||
                  Constants.appOwnership === null ||
                  Constants.executionEnvironment === 'storeClient';

console.log('[NativeModules] isExpoGo calculated as:', isExpoGo);

/**
 * Global flag to enable/disable native modules
 * Set to false in Expo Go, true in production builds
 */
export const ENABLE_NATIVE_MODULES = !isExpoGo;

// Log the mode for debugging
console.log(`[NativeModules] ========================================`);
console.log(`[NativeModules] Running in ${isExpoGo ? 'Expo Go' : 'Production Build'} mode`);
console.log(`[NativeModules] Native modules ${ENABLE_NATIVE_MODULES ? 'ENABLED' : 'DISABLED'}`);
console.log(`[NativeModules] ========================================`);
