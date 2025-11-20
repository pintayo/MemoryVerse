const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix Firebase with static frameworks
 * Adds use_modular_headers! and sets modular_headers for GoogleUtilities
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

        // Add use_modular_headers! in the target block - try multiple patterns
        if (!podfileContent.includes('use_modular_headers!')) {
          // Try with double quotes
          if (podfileContent.includes('target "MemoryVerse" do')) {
            podfileContent = podfileContent.replace(
              /target "MemoryVerse" do/,
              'target "MemoryVerse" do\n  use_modular_headers!'
            );
          }
          // Try with single quotes
          else if (podfileContent.includes("target 'MemoryVerse' do")) {
            podfileContent = podfileContent.replace(
              /target 'MemoryVerse' do/,
              "target 'MemoryVerse' do\n  use_modular_headers!"
            );
          }
        }

        // Add post_install hook to:
        // 1. Enable modular headers for GoogleUtilities specifically
        // 2. Suppress warnings for Firebase targets
        const postInstallCode = `
    # Enable modular headers for GoogleUtilities (required by FirebaseCoreInternal)
    installer.pod_targets.each do |pod|
      if pod.name == 'GoogleUtilities'
        pod.send(:define_method, :build_type) do
          Pod::BuildType.static_library
        end
      end
    end

    # Set modular headers for GoogleUtilities
    installer.pods_project.targets.each do |target|
      if target.name == 'GoogleUtilities'
        target.build_configurations.each do |config|
          config.build_settings['DEFINES_MODULE'] = 'YES'
        end
      end

      # Suppress non-modular warnings for Firebase targets
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['WARNING_CFLAGS'] ||= ['$(inherited)']
          config.build_settings['WARNING_CFLAGS'] << '-Wno-non-modular-include-in-framework-module'
        end
      end
    end`;

        // Merge with existing post_install hook
        if (!podfileContent.includes('DEFINES_MODULE')) {
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
