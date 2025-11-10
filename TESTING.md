# Testing Guide for MemoryVerse

This guide helps you test the app in different modes while waiting for your Apple Developer account approval.

## 🎯 Two Testing Modes

### Mode 1: Expo Go Testing (Quick & Easy)
Test the core app features without native modules (Firebase, Sentry, Voice)

### Mode 2: Development Build (Full Features)
Test with all features including Firebase, Sentry, and Voice recognition

---

## 📱 Mode 1: Expo Go Testing

Perfect for testing while waiting for Apple Developer approval!

### What Works:
✅ Authentication (Supabase)
✅ Verse memorization
✅ Progress tracking
✅ Gamification (XP, levels, streaks)
✅ Achievements
✅ Notes
✅ Bible picker
✅ All core app features

### What Doesn't Work:
❌ Firebase Analytics (logs locally instead)
❌ Sentry error reporting (logs locally instead)
❌ Voice recognition (button will show "not available")

### How to Enable:

**Step 1:** Remove native module packages from `package.json`

Comment out or delete these 4 lines in the `dependencies` section:
```json
"@react-native-firebase/analytics": "^23.5.0",
"@react-native-firebase/app": "^23.5.0",
"@react-native-voice/voice": "^3.2.4",
"@sentry/react-native": "^7.5.0"
```

They're grouped together at the bottom of the dependencies for easy commenting.

**Step 2:** Reinstall packages
```bash
npm install
```

**Step 3:** Start Expo Go
```bash
npx expo start -c --tunnel
```

**Step 4:** Scan QR code with your phone
- **iOS:** Use Camera app
- **Android:** Use Expo Go app

### How to Switch Back:

**Step 1:** Uncomment the 4 lines in `package.json`

**Step 2:** Reinstall
```bash
npm install
```

---

## 🚀 Mode 2: Development Build (Full Features)

Use this once you have your Apple Developer account approved.

### Prerequisites:
- ✅ EAS CLI installed globally (already in devDependencies)
- ✅ Expo account created
- ✅ Apple Developer account ($99/year) - **REQUIRED FOR iOS**
- ✅ Connected Apple Developer account to Expo

### Setup EAS:

```bash
# Install EAS CLI globally (already added to devDependencies)
npm install -g eas-cli

# Login to Expo
eas login

# Configure project (creates eas.json)
eas build:configure
```

### Create Development Build:

#### For Android (FREE - Test Now!)
```bash
eas build --profile development --platform android
```

Wait 10-20 minutes for build to complete. Download the APK and install on your Android device.

#### For iOS (Requires Apple Developer Account)
```bash
eas build --profile development --platform ios
```

Wait 10-20 minutes. Download and install via TestFlight or directly on device.

### Start Development Server:
```bash
npx expo start --dev-client
```

Your custom development build will connect to the server and load the app with ALL features enabled.

---

## 🔄 Quick Reference

### Testing Core Features (No Apple Account)
```bash
# 1. Comment out 4 native module lines in package.json
# 2. npm install
# 3. npx expo start -c --tunnel
# 4. Scan QR code with phone
```

### Testing Full Features (With Apple Account)
```bash
# 1. Keep all packages in package.json
# 2. eas build --profile development --platform ios
# 3. Install build on device
# 4. npx expo start --dev-client
```

---

## 📦 Native Module Packages Reference

These are the native modules that require a development build:

```json
"@react-native-firebase/analytics": "^23.5.0",  // Analytics tracking
"@react-native-firebase/app": "^23.5.0",        // Firebase core
"@react-native-voice/voice": "^3.2.4",          // Speech recognition
"@sentry/react-native": "^7.5.0"                // Error tracking
```

---

## 🛠️ Troubleshooting

### "Invariant Violation: native module doesn't exist"
You have native modules in package.json but are using Expo Go. Follow Mode 1 instructions.

### "PluginError: Unable to resolve config plugin"
Remove Firebase plugins from app.json (already done). Use development build instead.

### EAS build fails with "No Apple Developer account"
You need to connect your Apple Developer account:
```bash
eas device:create
eas credentials
```

### Want to test on iOS but no Apple account yet?
Use Mode 1 (Expo Go) to test core features while waiting for approval.

---

## 📝 Current Status

Based on your situation:
- ✅ Firebase setup complete (config files downloaded)
- ✅ Sentry setup complete
- ⏳ Waiting for Apple Developer account approval
- 💡 **Recommended:** Use Mode 1 (Expo Go) for now

Once your Apple Developer account is approved, you can switch to Mode 2 for full feature testing!

---

## 🎬 Next Steps

1. **Now:** Test with Expo Go (Mode 1) to verify core features
2. **After Apple approval:** Create development build (Mode 2)
3. **When ready:** Create production build for App Store submission

```bash
# Production builds (when ready to publish)
eas build --profile production --platform ios
eas build --profile production --platform android
```
