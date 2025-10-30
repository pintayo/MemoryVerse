# Quick Start Guide for iOS

The simplest way to run MemoryVerse on iOS simulator.

## ⚡ Super Quick Start

```bash
# 1. Install dependencies (if you haven't already)
npm install --legacy-peer-deps

# 2. Make sure you have a .env file configured
cp .env.example .env
# Then edit .env with your API keys

# 3. Start Expo
npx expo start

# 4. Press 'i' when the menu appears
```

That's it! No prebuild needed. Expo handles everything for you.

---

## 🎯 What This Does

When you run `npx expo start` and press `i`:

1. **Expo Development Server** starts and bundles your JavaScript
2. **iOS Simulator** launches automatically
3. **Expo Go app** opens in the simulator
4. **Your app loads** with hot-reload enabled

No need to:
- ❌ Run `expo prebuild`
- ❌ Manually install CocoaPods
- ❌ Deal with native iOS project files
- ❌ Worry about version compatibility

---

## 🔧 Requirements

- ✅ macOS with Xcode installed
- ✅ Node.js and npm
- ✅ iOS Simulator (comes with Xcode)
- ✅ `.env` file configured

---

## 📝 Detailed Steps

### 1. Check Xcode is Installed

```bash
xcode-select -p
```

If not installed, get it from the Mac App Store (free).

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your API keys
nano .env  # or use your favorite editor
```

Required keys:
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `EXPO_PUBLIC_PERPLEXITY_API_KEY` - Get from https://www.perplexity.ai/settings/api

### 4. Start Development Server

```bash
npx expo start
```

### 5. Launch iOS Simulator

When you see the menu:
```
› Press i │ open iOS simulator
› Press a │ open Android emulator
› Press w │ open web
```

Press `i` and wait for the simulator to launch.

---

## 🚀 First Launch

The first time you run this:
- Simulator takes 1-2 minutes to launch
- Expo Go app installs automatically
- App bundles and loads (2-3 minutes total)

**Be patient on first launch!**

---

## ⚡ Subsequent Launches

After the first time:
- Simulator opens in ~30 seconds
- App loads in ~1 minute
- **Hot reload** means code changes appear instantly!

---

## 🐛 Troubleshooting

### Simulator Won't Launch

Try opening it manually first:
```bash
open -a Simulator
```

Then run `npx expo start` and press `i` again.

### Port Already in Use

```bash
# Kill the process on port 8081
lsof -ti:8081 | xargs kill -9

# Restart
npx expo start
```

### Metro Bundler Issues

```bash
# Clear cache and restart
npx expo start --clear
```

### Need to Reinstall

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npx expo start
```

---

## 🎮 Simulator Shortcuts

Once the simulator is running:

- `Cmd + D` - Open developer menu
- `Cmd + R` - Reload app
- `Cmd + Ctrl + Z` - Shake gesture (for React Native dev menu)
- `Cmd + K` - Toggle keyboard

---

## ✅ Expected Result

You should see:
1. **Login Screen** (if not authenticated)
2. **Sign up** to create a test account
3. **Home Screen** with today's verse
4. **Bottom navigation** (Home, Profile, Leaderboard)
5. **All features working** with real data!

---

## 🎯 Why This Is Simpler

**Traditional approach (with prebuild):**
```bash
npm install
npx expo prebuild --clean      # ← Can have version conflicts
cd ios && pod install           # ← Can fail with compatibility issues
npx expo start
```

**Simple approach (Expo standard):**
```bash
npm install
npx expo start                  # ← Just works!
# Press 'i'
```

Expo handles all the native build stuff automatically. You don't need to touch the iOS project files!

---

## 📚 Next Steps

Once the app is running:

1. **Test authentication:**
   - Sign up with email/password
   - Log out and log back in

2. **Test core features:**
   - View today's verse
   - Practice a verse (Recall screen)
   - Check your profile
   - View the leaderboard

3. **Make changes:**
   - Edit any `.tsx` file
   - Save
   - See changes instantly with hot reload!

---

## 🔄 Development Workflow

```bash
# Terminal 1: Start the dev server (leave running)
npx expo start

# Make code changes in your editor
# Save files
# See changes appear in simulator automatically!

# To restart from scratch
# Press 'r' in the terminal
# Or Cmd+R in the simulator
```

---

## ⚙️ Optional: Use the Helper Script

I've created a helper script that checks everything:

```bash
./start-ios-simple.sh
```

This will:
- ✅ Check if dependencies are installed
- ✅ Verify .env file exists
- ✅ Start Expo dev server
- ✅ Show you when to press 'i'

---

## 🎉 That's It!

The beauty of Expo is that it handles all the complexity of iOS builds for you. You just need:

1. `npm install --legacy-peer-deps`
2. `npx expo start`
3. Press `i`

**Happy coding!** 🚀

---

## ❓ FAQ

**Q: Do I need to run `expo prebuild`?**
A: No! That's only needed for "bare workflow" or when you have custom native modules. Standard Expo apps don't need it.

**Q: Why don't I see an `ios/` folder?**
A: You don't need one! Expo manages the native iOS code for you in the cloud.

**Q: Can I open this in Xcode?**
A: For standard Expo development, you don't need Xcode. The simulator works without opening Xcode.

**Q: What about the version warnings?**
A: You can ignore them! Expo manages the version compatibility automatically.

**Q: Will this work on a real iPhone?**
A: Yes! Just scan the QR code with your iPhone's camera app (after installing Expo Go from the App Store).

---

For more details, see: [docs/IOS_SETUP_GUIDE.md](docs/IOS_SETUP_GUIDE.md)
