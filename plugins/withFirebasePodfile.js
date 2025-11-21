const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix Firebase with static frameworks
 * Adds use_modular_headers! globally and sets modular_headers for GoogleUtilities
 */
const withFirebaseModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

        // Add Firebase static framework flag and use_modular_headers! at the very top
        const headerConfig = `# Configure React Native Firebase for static frameworks
$RNFirebaseAsStaticFramework = true

# Enable modular headers globally for Swift pod compatibility
use_modular_headers!

`;
        if (!podfileContent.includes('$RNFirebaseAsStaticFramework')) {
          podfileContent = headerConfig + podfileContent;
        }

        // Add post_install hook to suppress warnings for Firebase targets
        const postInstallCode = `
    # Suppress non-modular warnings for Firebase targets
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
          config.build_settings['SWIFT_SUPPRESS_WARNINGS'] = 'YES'
        end
      end
    end`;

        // Merge with existing post_install hook
        if (!podfileContent.includes('GCC_WARN_INHIBIT_ALL_WARNINGS')) {
          const postInstallRegex = /(post_install do \|installer\|[\s\S]*?)(^  end$)/m;

          if (postInstallRegex.test(podfileContent)) {
            podfileContent = podfileContent.replace(
              postInstallRegex,
              `$1${postInstallCode}\n$2`
            );
          } else {
            // No post_install exists, create one
            podfileContent = podfileContent.replace(
              /^end\s*$/m,
              `  post_install do |installer|${postInstallCode}\n  end\nend`
            );
          }
        }

        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};

module.exports = withFirebaseModularHeaders;
