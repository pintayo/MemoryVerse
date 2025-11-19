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

        // Add post_install hook to fix non-modular header warnings
        const postInstallHook = `
  post_install do |installer|
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
        config.build_settings['CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER'] = 'NO'
      end
    end
  end`;

        // Add post_install hook if not already present
        if (!podfileContent.includes('CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER')) {
          // Find the end block and add the post_install hook before it
          podfileContent = podfileContent.replace(/^end\s*$/m, postInstallHook + '\nend');
        }

        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};
