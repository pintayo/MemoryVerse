# iOS Development Setup Guide

This guide will help you run MemoryVerse on your MacBook using Xcode simulator.

## Prerequisites

### 1. Check if Xcode is Installed

```bash
# Check if Xcode is installed
xcode-select -p
```

If not installed, download from the Mac App Store (it's free but large, ~15GB).

### 2. Install Xcode Command Line Tools

```bash
xcode-select --install
```

### 3. Accept Xcode License

```bash
sudo xcodebuild -license accept
```

### 4. Install Watchman (Optional but Recommended)

```bash
# Using Homebrew (install Homebrew first if needed: https://brew.sh)
brew install watchman
```

### 5. Install CocoaPods

```bash
# Check if already installed
pod --version

# If not installed:
sudo gem install cocoapods
```

---

## Setup Steps

### Step 1: Install Node Dependencies

```bash
cd /home/user/MemoryVerse
npm install --legacy-peer-deps
```

### Step 2: Generate iOS Project with Expo Prebuild

```bash
# Generate native iOS project from Expo configuration
npx expo prebuild --clean --platform ios
```

This will:
- Generate the `ios/` directory
- Create the Xcode project
- Configure native modules
- Set up app.json settings

### Step 3: Install iOS Dependencies

```bash
# Navigate to iOS folder and install CocoaPods dependencies
cd ios
pod install
cd ..
```

**Note:** If you see any warnings about pod versions, you can usually ignore them for development.

### Step 4: Set Up Environment Variables

Create a `.env` file in the root directory with your API keys:

```bash
# Copy the example file if it exists
cp .env.example .env

# Or create a new .env file
touch .env
```

Add the following to your `.env` file:

```bash
# Supabase Configuration (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Provider Configuration (Choose one)
# Recommended: Perplexity (best cost/quality ratio)
EXPO_PUBLIC_AI_PROVIDER=perplexity
EXPO_PUBLIC_PERPLEXITY_API_KEY=pplx-your-key-here

# Alternative providers (optional)
# EXPO_PUBLIC_AI_PROVIDER=openai
# EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here

# EXPO_PUBLIC_AI_PROVIDER=anthropic
# EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Where to get API keys:**
- **Supabase:** Already set up in your project (check Supabase dashboard)
- **Perplexity:** https://www.perplexity.ai/settings/api
- **OpenAI:** https://platform.openai.com/api-keys
- **Anthropic:** https://console.anthropic.com/settings/keys

---

## Running the App

### Method 1: Standard Expo Development (Recommended for Quick Start)

1. **Start the Expo development server:**

```bash
npx expo start
```

2. **Press `i` to launch iOS simulator**

When the QR code appears, you'll see a menu:
```
› Press i │ open iOS simulator
› Press a │ open Android emulator
› Press w │ open web
```

Press `i` and Expo will:
- Launch the iOS simulator automatically
- Install the Expo Go app in the simulator
- Load your app

### Method 2: Development Build (More Native Features)

If you need native modules or custom native code:

1. **Build the development client:**

```bash
npx expo run:ios
```

This will:
- Build the app with Xcode
- Install it on the simulator
- Start the Metro bundler

2. **For subsequent runs:**

```bash
# Terminal 1: Start Metro bundler
npx expo start --dev-client

# Terminal 2: Run iOS (if needed)
npx expo run:ios
```

---

## Troubleshooting

### iOS Simulator Won't Launch

**Check available simulators:**
```bash
xcrun simctl list devices
```

**Launch simulator manually:**
```bash
open -a Simulator
```

**Select a specific simulator:**
```bash
# In Xcode: Xcode → Open Developer Tool → Simulator
# Or from terminal:
xcrun simctl boot "iPhone 15 Pro"
```

### "Cannot find module 'react-native-worklets/plugin'"

This means react-native-worklets is missing. Install it:
```bash
npm install react-native-worklets@^0.5.2 --legacy-peer-deps
npx expo prebuild --clean
cd ios && pod install && cd ..
```

### "Command PhaseScriptExecution failed"

This usually means pods need to be reinstalled:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

### "No ios folder found"

You need to generate the iOS project first:
```bash
npx expo prebuild --clean --platform ios
cd ios && pod install && cd ..
```

### "Unable to boot device in current state: Booted"

The simulator is already running. Just press `i` again or:
```bash
# Reset the simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

### Port 8081 Already in Use

```bash
# Kill the process using port 8081
lsof -ti:8081 | xargs kill -9

# Then restart
npx expo start
```

### Metro Bundler Crashes

Clear the cache and restart:
```bash
npx expo start --clear
```

### "Cannot find module" Errors

Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Xcode Build Fails

1. Clean the build:
```bash
cd ios
xcodebuild clean
cd ..
```

2. Or open in Xcode and clean:
```bash
open ios/MemoryVerse.xcworkspace
# In Xcode: Product → Clean Build Folder (Cmd+Shift+K)
```

---

## Quick Reference Commands

```bash
# Start development server
npx expo start

# Start with cache cleared
npx expo start --clear

# Generate iOS project (first time or after major changes)
npx expo prebuild --clean --platform ios

# Run on iOS simulator
npx expo run:ios

# Run on specific simulator
npx expo run:ios --simulator="iPhone 15 Pro"

# Check what's running
lsof -i :8081
lsof -i :19000

# Reset everything
npx expo start --clear
rm -rf node_modules && npm install --legacy-peer-deps
npx expo prebuild --clean
cd ios && pod install && cd ..
```

---

## Recommended iOS Simulator Settings

For the best development experience:

1. **Open Simulator → I/O → Keyboard**
   - ✅ Connect Hardware Keyboard
   - ✅ Toggle Software Keyboard (Cmd+K)

2. **Enable Hot Reload in App**
   - Shake device (Cmd+D in simulator)
   - Enable "Fast Refresh"

3. **Debug Menu Shortcuts (in Simulator)**
   - `Cmd+D` - Open developer menu
   - `Cmd+R` - Reload app
   - `Cmd+Ctrl+Z` - Shake gesture

---

## Next Steps After Setup

1. **Test the authentication flow:**
   - Sign up a new account
   - Log in with existing credentials
   - Test logout functionality

2. **Test core features:**
   - View today's verse on Home screen
   - Practice a verse (Recall screen)
   - Check Profile screen (real data should load)
   - View Leaderboard

3. **Generate some verse contexts:**
   ```bash
   npm run generate-contexts -- --limit 10
   ```

---

## Notes

- **First launch** might take 2-3 minutes while Expo builds
- **Subsequent launches** are much faster (30-60 seconds)
- **Hot reload** is enabled by default - changes appear instantly
- **iOS simulator** uses your Mac's resources - close other apps for better performance

---

## Architecture Notes for iOS

This app uses:
- **Expo SDK 54** with React Native 0.75.4
- **New Architecture** (Bridgeless mode) is enabled
- **React 18.2.0** (required by RN 0.75.4)
- **Supabase** for backend (auth + database)
- **Bottom Tab Navigation** with Stack Navigation

If you encounter any issues, check:
1. `.env` file is properly configured
2. Supabase URL and keys are correct
3. iOS simulator is running (iPhone 14 or later recommended)
4. Port 8081 is not blocked by firewall

---

**Happy coding! 🚀**

For more help: https://docs.expo.dev/workflow/ios-simulator/
