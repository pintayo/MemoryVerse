const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom Expo config plugin to configure iOS build for React Native Firebase with static frameworks
 * This plugin carefully disables only the specific warning that causes build failures
 * without breaking Expo module compilation
 */
module.exports = function withIosPostInstall(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

        // Add Firebase static framework configuration at the beginning
        const firebaseConfig = `# React Native Firebase static framework configuration
$RNFirebaseAsStaticFramework = true

`;

        if (!podfileContent.includes('$RNFirebaseAsStaticFramework')) {
          podfileContent = firebaseConfig + podfileContent;
        }

        // Add targeted fix for React Native Firebase header warnings
        // Only disable the specific warning, don't change other build settings
        const buildSettingsCode = `
    # Fix for React Native Firebase non-modular header warnings
    # Only disable the specific warning without affecting other build settings
    installer.pods_project.targets.each do |target|
      if target.name == 'RNFBApp' || target.name == 'RNFBAnalytics'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER'] = 'NO'
        end
      end
    end`;

        // Merge with existing post_install hook
        if (!podfileContent.includes('CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER')) {
          const postInstallRegex = /(post_install do \|installer\|[\s\S]*?)(^  end$)/m;

          if (postInstallRegex.test(podfileContent)) {
            podfileContent = podfileContent.replace(
              postInstallRegex,
              `$1${buildSettingsCode}\n$2`
            );
          } else {
            // Fallback: create post_install if it doesn't exist
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
