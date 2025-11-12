# Firebase Analytics Setup Guide

This guide walks you through setting up Firebase Analytics for MemoryVerse.

## Prerequisites

- Firebase account (free tier is sufficient)
- Node.js and npm installed
- EAS CLI installed (`npm install -g eas-cli`)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `memoryverse` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Select or create a Google Analytics account
6. Click "Create project"

## Step 2: Add iOS App

1. In Firebase Console, click the iOS icon
2. Enter iOS bundle ID: `com.memoryverse.app` (must match `app.json`)
3. Enter app nickname: `MemoryVerse iOS`
4. Click "Register app"
5. Download `GoogleService-Info.plist`
6. Place it in the **root directory** of your project (same level as `app.json`)
7. Click "Next" through the remaining steps

## Step 3: Add Android App

1. In Firebase Console, click the Android icon
2. Enter Android package name: `com.memoryverse.app` (must match `app.json`)
3. Enter app nickname: `MemoryVerse Android`
4. Click "Register app"
5. Download `google-services.json`
6. Place it in the **root directory** of your project (same level as `app.json`)
7. Click "Next" through the remaining steps

## Step 4: Enable Analytics

1. In Firebase Console, go to "Analytics" → "Dashboard"
2. Analytics should be automatically enabled
3. You can configure additional settings in "Analytics" → "Settings"

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with Firebase settings:
   ```env
   EXPO_PUBLIC_FIREBASE_ENABLED=true
   ```

## Step 6: Verify Configuration Files

Your project root should now have:
```
MemoryVerse/
├── app.json
├── google-services.json          # Android config
├── GoogleService-Info.plist      # iOS config
├── .env
└── ...
```

**Important**: Add these files to `.gitignore` to avoid committing them:
```gitignore
# Firebase config files
google-services.json
GoogleService-Info.plist
```

## Step 7: Build with EAS

Firebase Analytics requires native modules, so you need to build with EAS:

### Initialize EAS (if not already done)
```bash
eas login
eas build:configure
```

### Build for iOS
```bash
eas build --platform ios --profile development
```

### Build for Android
```bash
eas build --platform android --profile development
```

## Step 8: Test Analytics

1. Run your app on a device or simulator
2. Navigate through screens and trigger some events
3. Wait 24-48 hours for data to appear in Firebase Console
4. Check "Analytics" → "Events" in Firebase Console

### Test Events

The app tracks these events automatically:
- `sign_up` - User registration
- `login` - User login
- `screen_view` - Screen navigation
- `verse_viewed` - Verse opened
- `verse_learned` - Verse practiced
- `verse_mastered` - Verse mastered
- `practice_started` - Practice session started
- `practice_completed` - Practice session completed
- `level_up` - User leveled up
- `achievement_unlocked` - Achievement earned
- `streak_milestone` - Streak milestone reached

## Troubleshooting

### Analytics Not Working

1. **Verify config files are in root directory**
   ```bash
   ls -la google-services.json GoogleService-Info.plist
   ```

2. **Check bundle IDs match**
   - Firebase Console bundle IDs must match `app.json`
   - iOS: `com.memoryverse.app`
   - Android: `com.memoryverse.app`

3. **Rebuild with EAS**
   ```bash
   eas build --platform all --profile development --clear-cache
   ```

4. **Check Firebase Console for errors**
   - Go to "Analytics" → "DebugView"
   - Enable debug mode on device

### Enable Debug Mode

**iOS**:
```bash
# Enable
defaults write com.memoryverse.app FIRDebugEnabled -bool YES

# Disable
defaults delete com.memoryverse.app FIRDebugEnabled
```

**Android**:
```bash
# Enable
adb shell setprop debug.firebase.analytics.app com.memoryverse.app

# Disable
adb shell setprop debug.firebase.analytics.app .none.
```

### Data Not Showing in Console

- Firebase Analytics can take 24-48 hours to process data
- Use DebugView for real-time testing
- Check that `EXPO_PUBLIC_FIREBASE_ENABLED=true` in `.env`

## Production Configuration

For production builds:

1. Create separate Firebase projects for dev/staging/production
2. Use different bundle IDs:
   - Dev: `com.memoryverse.app.dev`
   - Staging: `com.memoryverse.app.staging`
   - Production: `com.memoryverse.app`

3. Use EAS secrets for environment-specific configs:
   ```bash
   eas secret:create --scope project --name FIREBASE_ENABLED --value true
   ```

## Privacy & GDPR Compliance

1. Update Privacy Policy to mention analytics
2. Add opt-out mechanism for users
3. Implement consent management if required in your region

### Disable Analytics for User

In your app code:
```typescript
import { analyticsService } from './src/services/analyticsService';

// Disable for user
await analytics().setAnalyticsCollectionEnabled(false);
```

## Cost Considerations

Firebase Analytics free tier includes:
- Unlimited events
- 500 distinct events
- 25 user properties
- Unlimited users

This should be sufficient for most apps. Monitor usage in Firebase Console.

## Next Steps

1. Set up custom conversions in Firebase Console
2. Link to Google Ads (if running ads)
3. Set up BigQuery export (for advanced analytics)
4. Configure custom audiences

## Resources

- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [React Native Firebase Docs](https://rnfirebase.io/analytics/usage)
- [Expo + Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

## Support

If you encounter issues:
1. Check Firebase Console for errors
2. Review EAS build logs
3. Check React Native Firebase GitHub issues
4. Consult Expo Discord community

---

**Last Updated**: 2025-11-10
