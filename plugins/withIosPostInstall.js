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
        // Disable the specific non-modular include warning for Firebase targets
        const buildSettingsCode = `
    # Fix for React Native Firebase non-modular header warnings
    installer.pods_project.targets.each do |target|
      if target.name == 'RNFBApp' || target.name == 'RNFBAnalytics'
        target.build_configurations.each do |config|
          # Disable non-modular include warnings for Firebase
          config.build_settings['CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER'] = 'NO'
          config.build_settings['WARNING_CFLAGS'] ||= ['$(inherited)']
          config.build_settings['WARNING_CFLAGS'] << '-Wno-non-modular-include-in-framework-module'
        end
      end
    end`;

        // Merge with existing post_install hook
        if (!podfileContent.includes('Wno-non-modular-include-in-framework-module')) {
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

