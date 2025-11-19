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

        // Add build settings inside existing post_install hook
        const buildSettingsCode = `
    # Fix for React Native Firebase with static frameworks
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        config.build_settings['CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER'] = 'NO'
      end
    end`;

        // Find the post_install hook and add our code inside it
        if (!podfileContent.includes('CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER')) {
          // Look for the post_install block and insert our code before the last 'end'
          const postInstallRegex = /(post_install do \|installer\|[\s\S]*?)(^  end$)/m;

          if (postInstallRegex.test(podfileContent)) {
            // Insert before the closing 'end' of post_install
            podfileContent = podfileContent.replace(
              postInstallRegex,
              `$1${buildSettingsCode}\n$2`
            );
          } else {
            // If no post_install exists, create one (shouldn't happen with Expo)
            podfileContent = podfileContent.replace(
              /^end\s*$/m,
              `  post_install do |installer|${buildSettingsCode}\n  end\nend`
            );
          }
        }

        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};
