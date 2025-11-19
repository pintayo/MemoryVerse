const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix Firebase with static frameworks
 * Adds use_modular_headers! and suppresses non-modular warnings for Firebase targets
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

        // Add post_install hook to suppress non-modular warnings for Firebase
        const postInstallCode = `
    # Suppress non-modular header warnings for Firebase targets
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
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
