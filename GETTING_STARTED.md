# 🚀 Getting Started with MemoryVerse

## Prerequisites
- Node.js 16+ installed
- iOS Simulator (Xcode) or Android Studio
- Supabase account

## 1. Database Setup (5 minutes)

### Run the Complete Setup SQL

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire content of `supabase/complete-setup.sql`
6. Paste it into the SQL editor
7. Click **RUN** (or press Cmd+Enter / Ctrl+Enter)

✅ You should see:
```
status: Setup complete!
verse_count: 50
user_count: 1
```

✅ Your profile will show with avatar: 😊

## 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Context Generation (Required)
EXPO_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
EXPO_PUBLIC_PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-chat

# AI Provider Selection
EXPO_PUBLIC_AI_PROVIDER=perplexity

# Optional: Other AI Providers
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
EXPO_PUBLIC_OPENAI_MODEL=gpt-4
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key
EXPO_PUBLIC_ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

### Get Your Supabase Credentials:
1. Go to Project Settings → API
2. Copy **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Get Perplexity API Key:
1. Go to [Perplexity AI](https://www.perplexity.ai/)
2. Sign up / Log in
3. Navigate to API settings
4. Generate an API key
5. Copy to `EXPO_PUBLIC_PERPLEXITY_API_KEY`

## 3. Install Dependencies

```bash
npm install
```

## 4. Run the App

### iOS (Recommended for Development)
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web (Limited Functionality)
```bash
npm run web
```

## 5. Test Account

You can log in with your account:
- **Email**: `pintayo.dev@gmail.com`
- **Password**: [Your password]

Or create a new test account through the signup flow.

## 6. Test New Features

### ✅ Feature Checklist

1. **VerseCard Scrolling**
   - Navigate to "Learn Verse"
   - Long verses should scroll smoothly
   - No text cut-off

2. **AI Context Generation**
   - On any verse, click "Show Context"
   - Should show loading indicator
   - AI-generated context appears in 2-5 seconds
   - Context is saved to database

3. **Profile Editing**
   - Go to Profile tab
   - Click "Edit Profile"
   - Change avatar (emoji picker)
   - Edit name
   - Click "Save Changes"

4. **Recall Screen**
   - Navigate to "Practice Verse"
   - "Give Answer" and "Check Answer" buttons visible without scrolling

5. **Pray Screen**
   - Navigate to "Pray" mode
   - Tap mic button
   - Waveform animation appears (no errors)

6. **Default Avatar**
   - Create a new test account
   - Should automatically have 😊 avatar

## 7. Development Tips

### View Logs
```bash
# In a separate terminal
npx react-native log-ios    # iOS
npx react-native log-android # Android
```

### Clear Cache (if issues)
```bash
npm start -- --reset-cache
```

### Rebuild
```bash
# iOS
cd ios && pod install && cd ..
npm run ios

# Android
cd android && ./gradlew clean && cd ..
npm run android
```

## 8. Production Checklist

Before deploying, ensure:
- [ ] All environment variables are set
- [ ] Database setup is complete
- [ ] All features tested and working
- [ ] No console errors in logs
- [ ] App icon and splash screen added
- [ ] Privacy policy and terms of service ready

See `PRODUCTION_GUIDE.md` for complete production deployment guide.

## 9. Common Issues

### "Cannot connect to Metro"
```bash
npm start -- --reset-cache
```

### "No bundle URL present"
```bash
rm -rf ios/build
npm run ios
```

### "Supabase auth error"
- Check `.env` file exists and has correct credentials
- Verify RLS policies in Supabase Dashboard

### "AI context not generating"
- Verify Perplexity API key is valid
- Check console for API errors
- Ensure model name is correct: `llama-3.1-sonar-small-128k-chat`

## 10. Need Help?

- Check `BACKLOG.md` for planned features
- Check `PRODUCTION_GUIDE.md` for deployment help
- Review code comments for implementation details

---

**Happy Developing!** 📖✨
