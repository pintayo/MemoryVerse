const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix Firebase with static frameworks
 * Adds use_modular_headers! and $RNFirebaseAsStaticFramework flag
 */
const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

        // Add Firebase static framework flag at the top
        const firebaseFlag = `# Configure React Native Firebase for static frameworks
$RNFirebaseAsStaticFramework = true

`;
        if (!podfileContent.includes('$RNFirebaseAsStaticFramework')) {
          podfileContent = firebaseFlag + podfileContent;
        }

        // Add use_modular_headers! after the target declaration
        if (!podfileContent.includes('use_modular_headers!')) {
          // Find the target line and add use_modular_headers! after it
          podfileContent = podfileContent.replace(
            /(target ['"]MemoryVerse['"] do)/,
            '$1\n  use_modular_headers!'
          );
        }

        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;
