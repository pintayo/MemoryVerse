# 📋 Tomorrow's Action Items

## ⚠️ MUST DO FIRST (Before Testing)

### 1. Apply Database Changes to Supabase
**Time Required**: 2 minutes

Go to Supabase Dashboard → SQL Editor → New Query

```sql
-- This adds default avatar for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '😊')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Click **RUN** ✅

---

## 🧪 Test All New Features

### Feature 1: VerseCard Text Scrolling
**Test**:
1. Go to "Learn Verse" screen
2. Find a long verse (try Jeremiah 29:11 or Psalm 23)
3. ✅ **Verify**: Can you scroll to see the full verse?

### Feature 2: Auto-AI Context Generation
**Test**:
1. Go to "Learn Verse" screen
2. Click "Show Context" button
3. ✅ **Verify**:
   - Shows "Generating spiritual context..." with loading spinner?
   - After a few seconds, displays AI-generated context?
   - Context is stored (close/reopen - should show instantly)?

**⚠️ NOTE**: You need your Perplexity API key in `.env`:
```
EXPO_PUBLIC_PERPLEXITY_API_KEY=your_key_here
EXPO_PUBLIC_PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-chat
```

### Feature 3: Recall Screen Button Visibility
**Test**:
1. Go to "Practice Verse" (Recall) screen
2. ✅ **Verify**: Can you see "Give Answer" and "Check Answer" buttons WITHOUT scrolling?

### Feature 4: Pray Screen (No Animation Error)
**Test**:
1. Go to "Pray" training screen
2. Tap the microphone button
3. ✅ **Verify**:
   - Waveform animation appears (no error in console)?
   - Mic button pulses correctly?

### Feature 5: Profile Editing
**Test**:
1. Go to Profile screen
2. Tap "Edit Profile"
3. ✅ **Verify**:
   - See emoji avatar picker (horizontal scroll)?
   - Can select new avatar?
   - Can edit name in text input?
   - "Save Changes" button works?
   - "Cancel" button reverts changes?
   - After save, profile updates appear immediately?

### Feature 6: Default Avatar for New Users
**Test** (optional - only if you want to create a test account):
1. Sign up a new user
2. ✅ **Verify**: Profile automatically has 😊 avatar

---

## 🐛 If You Find Issues

### Issue Reporting Template
```
**Feature**: [Which feature from above]
**What I Expected**: [Description]
**What Happened**: [Description]
**Steps to Reproduce**:
1.
2.
3.

**Screenshots/Error Messages**: [If any]
```

---

## 🚀 Optional: Clean Up Console Logs

If you want cleaner console output in development:

```bash
cd /path/to/MemoryVerse
bash scripts/replace-console-logs.sh
```

This will replace all 227 `console.log` statements with the production-ready logger that only outputs in development mode.

**⚠️ WARNING**: This script modifies many files. Commit your changes first:
```bash
git add -A
git commit -m "chore: Replace console.log with production logger"
```

---

## 📊 Monitor These During Testing

### Watch For:
- [ ] Any app crashes
- [ ] Slow loading times
- [ ] API errors (check console)
- [ ] UI elements overlapping or cut off
- [ ] Navigation issues
- [ ] Authentication problems

### Check Console For:
- Errors (red)
- Warnings (yellow)
- Failed API calls
- Missing environment variables

---

## 💡 Next Steps After Testing

Based on test results:

### ✅ If All Tests Pass:
1. Review `PRODUCTION_READINESS.md`
2. Work through "Critical" and "Important" sections
3. Prepare for App Store submission

### ❌ If Tests Fail:
1. Report issues using template above
2. I can help fix them in the next session
3. Don't proceed to production until fixed

---

## 📞 Quick Reference

**Changed Files** (latest commit):
- `src/screens/VerseCardScreen.tsx` - Added ScrollView + auto-AI context
- `src/screens/RecallScreen.tsx` - Fixed button visibility
- `src/screens/PrayScreen.tsx` - Fixed animation error
- `src/screens/ProfileScreen.tsx` - Added edit functionality
- `src/config/env.ts` - Fixed Perplexity model name
- `supabase/schema.sql` - Added default avatar (NEEDS TO BE APPLIED)
- `src/utils/logger.ts` - New production logger
- `src/contexts/AuthContext.tsx` - Uses logger now

**Current Branch**: `claude/memoryverse-mobile-ui-design-011CUc7V5kKK2Xvd53VGGamz`

**Last Commit**: "feat: Complete production readiness improvements"

---

## ⏱️ Estimated Testing Time

- Database setup: 2 min
- Feature testing: 15-20 min
- Issue reporting (if needed): 5-10 min

**Total**: ~20-30 minutes

---

Good luck with testing! 🙏📖✨
