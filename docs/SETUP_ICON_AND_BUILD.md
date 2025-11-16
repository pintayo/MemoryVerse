# Setting Up App Icon and EAS Builds

## 📱 Step 1: Add Your App Icon

You mentioned you have an app icon ready. Here's how to add it to the project:

### Required Files

You need to create these image files in the `assets/` folder:

1. **`icon.png`** - 1024x1024 pixels (main app icon)
2. **`adaptive-icon.png`** - 1024x1024 pixels (Android adaptive icon foreground)
3. **`splash.png`** - 1284x2778 pixels (splash screen)
4. **`favicon.png`** - 48x48 pixels (web icon, optional)

### Quick Setup

#### Option 1: Manual (if you have all sizes)
```bash
# In your project root
cd /path/to/MemoryVerse

# Create assets folder if it doesn't exist
mkdir -p assets

# Copy your icon files
cp /path/to/your/icon-1024.png assets/icon.png
cp /path/to/your/icon-1024.png assets/adaptive-icon.png
# (You can use the same 1024x1024 image for both)

# For splash screen - create a simple one with your logo centered
# Or use https://www.appicon.co/ to generate all sizes
```

#### Option 2: Use Online Generator (Easiest)
1. Go to **https://www.appicon.co/**
2. Upload your 1024x1024 icon
3. Click "Generate"
4. Download the "App Icon Set"
5. Extract and copy:
   - `icon.png` → `assets/icon.png`
   - `adaptive-icon.png` → `assets/adaptive-icon.png`

### Splash Screen

For the splash screen, you can:

**Option A: Simple Background**
```bash
# Create a 1284x2778 PNG with:
# - Your app icon centered (512x512)
# - Warm parchment background (#F5F0E8)
# - App name below icon (optional)
```

**Option B: Use Figma Template**
1. Use Figma (free)
2. Create 1284x2778 canvas
3. Set background to #F5F0E8
4. Center your icon
5. Export as PNG

### Verify Setup

After adding files:
```bash
ls -la assets/
# Should show:
# icon.png
# adaptive-icon.png
# splash.png
```

---

## 🚀 Step 2: Set Up EAS (Expo Application Services)

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Login to Expo

```bash
eas login
# Use your Expo account credentials
```

### Configure Your Project

```bash
# In your project directory
cd /path/to/MemoryVerse

# Initialize EAS
eas build:configure
```

This will:
- Create/update `eas.json`
- Link project to Expo account
- Generate a project ID

### Update app.json with Project ID

After running `eas build:configure`, you'll get a project ID. Update `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR-PROJECT-ID-FROM-EAS"
      }
    }
  }
}
```

---

## 🍎 Step 3: iOS Build Setup

### Prerequisites

- Apple Developer account (✓ You mentioned you have this!)
- App Store Connect app created
- Provisioning profiles (EAS handles this automatically)

### Create iOS Build for TestFlight

```bash
# Build for internal distribution (TestFlight)
eas build --platform ios --profile preview

# Or for production (App Store)
eas build --platform ios --profile production
```

**What happens:**
1. EAS uploads your code to cloud
2. Builds iOS app in the cloud (~15-20 minutes)
3. Generates `.ipa` file
4. You can download or auto-submit to TestFlight

### Auto-Submit to TestFlight

```bash
eas build --platform ios --profile production --auto-submit
```

EAS will prompt you for:
- Apple ID
- App-specific password (create at appleid.apple.com)
- Team ID

**Find your Team ID:**
1. Go to https://developer.apple.com/account
2. Click "Membership"
3. Copy your "Team ID"

---

## 🤖 Step 4: Android Build Setup

### Prerequisites

- Google Play Console account (✓ You mentioned you have this!)
- App created in Google Play Console

### Create Android Build

```bash
# Build APK for internal testing
eas build --platform android --profile preview

# Or AAB for Google Play Store
eas build --platform android --profile production
```

**APK vs AAB:**
- **APK**: Install directly on device for testing
- **AAB**: Upload to Google Play Store (required for production)

### Auto-Submit to Google Play

First, create a service account key:

1. Go to Google Play Console
2. **Setup** → **API Access**
3. Create a **Service Account**
4. Download JSON key file
5. Save as `google-play-service-account.json` in your project

Then:
```bash
eas build --platform android --profile production --auto-submit
```

---

## 📦 Step 5: Build Profiles Explained

Your `eas.json` has 3 profiles:

### 1. `development`
```bash
eas build --platform ios --profile development
```
- For local development
- Includes debug tools
- NOT for App Store

### 2. `preview`
```bash
eas build --platform ios --profile preview
```
- For internal testing (TestFlight, Internal Testing)
- Slightly optimized
- Can share with beta testers

### 3. `production`
```bash
eas build --platform ios --profile production
```
- For App Store / Google Play submission
- Fully optimized
- Code obfuscation enabled

---

## 🧪 Step 6: Testing Your Builds

### iOS - TestFlight

After building:
```bash
eas build --platform ios --profile preview --auto-submit
```

1. Build completes (~20 min)
2. Auto-uploads to TestFlight
3. Wait for Apple processing (~10-30 min)
4. Invite testers in App Store Connect
5. Testers download TestFlight app
6. Testers install your build from TestFlight

**Invite yourself first:**
1. App Store Connect → TestFlight
2. Add yourself as internal tester
3. You'll get email with TestFlight invite

### Android - Internal Testing

After building:
```bash
eas build --platform android --profile preview
```

1. Download the APK from EAS dashboard
2. Go to Google Play Console
3. **Internal Testing** → **Create Release**
4. Upload APK or AAB
5. Add yourself to internal testers
6. Install from Google Play (opt-in link in console)

---

## 🔧 Troubleshooting

### "Build failed - missing icon"
- Verify `assets/icon.png` exists and is 1024x1024
- Verify `app.json` has `"icon": "./assets/icon.png"`

### "Build failed - invalid bundle ID"
- Go to Apple Developer → Identifiers
- Create App ID with bundle ID: `com.memoryverse.app`
- Re-run build

### "Build failed - provisioning profile"
- Run: `eas credentials`
- Select iOS → Manage Credentials
- Reset/Create new provisioning profile

### Build is slow
- First build: 15-25 minutes (normal)
- Subsequent builds: 5-15 minutes
- Use `--profile preview` for faster builds during testing

---

## 📋 Checklist Before First Build

- [ ] App icon added to `assets/icon.png` (1024x1024)
- [ ] Adaptive icon added to `assets/adaptive-icon.png`
- [ ] Splash screen added to `assets/splash.png`
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged into EAS (`eas login`)
- [ ] Project ID added to `app.json`
- [ ] Bundle ID registered in Apple Developer (iOS)
- [ ] Package name registered in Google Play Console (Android)

---

## 🎯 Your Next Commands

### First Time Setup
```bash
# Install EAS
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Update app.json with the project ID shown
```

### Build for iOS TestFlight
```bash
eas build --platform ios --profile preview --auto-submit
```

### Build for Android Testing
```bash
eas build --platform android --profile preview
```

### Build Both Platforms
```bash
eas build --platform all --profile preview
```

---

## 💡 Pro Tips

1. **First build:** Start with just iOS or Android, not both
2. **Use preview profile** for testing (faster, cheaper)
3. **Auto-submit** saves time but requires initial setup
4. **Check build logs** if something fails (EAS provides detailed logs)
5. **Test on real devices** - simulators don't show all issues

---

## 📱 What You'll Get

After a successful build:

**iOS (.ipa file):**
- Installable on iPhone/iPad via TestFlight
- Can share with up to 10,000 testers
- Expires after 90 days

**Android (.apk or .aab):**
- APK: Install directly on any Android device
- AAB: Upload to Google Play Store
- No expiration

---

## 🚀 Ready to Build?

Once you've added your icon files to `assets/`, run:

```bash
# Quick test to verify assets
npx expo start

# If that works, build for iOS
eas build --platform ios --profile preview

# Monitor build progress at:
# https://expo.dev/accounts/[your-account]/projects/memoryverse/builds
```

**Build time:** Grab a coffee! ☕ First builds take 15-25 minutes.

---

**Questions?**
- EAS Docs: https://docs.expo.dev/build/introduction/
- Troubleshooting: https://docs.expo.dev/build-reference/troubleshooting/
- Expo Discord: https://chat.expo.dev/

