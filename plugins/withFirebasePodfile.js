const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom Expo config plugin to configure Podfile for React Native Firebase with static frameworks
 */
module.exports = function withFirebasePodfile(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

        // Add Firebase configuration at the beginning of the file
        const firebaseConfig = `# Firebase configuration for static frameworks
$RNFirebaseAsStaticFramework = true

`;

        // Only add if not already present
        if (!podfileContent.includes('$RNFirebaseAsStaticFramework')) {
          podfileContent = firebaseConfig + podfileContent;
        }

        // Add use_modular_headers! after the target declaration
        if (!podfileContent.includes('use_modular_headers!')) {
          // Find the target line and add use_modular_headers! after it
          podfileContent = podfileContent.replace(
            /(target\s+'[^']+'\s+do)/,
            '$1\n  use_modular_headers!'
          );
        }

        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};
