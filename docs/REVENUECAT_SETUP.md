# RevenueCat Setup Guide

## 🎯 Why RevenueCat?

RevenueCat handles all the complexity of in-app purchases:
- Works with both iOS and Android
- Handles subscription management
- Provides analytics dashboard
- Server-side receipt validation
- Webhook integration
- Free up to $10k monthly revenue!

---

## 🚀 Step 1: Create RevenueCat Account

1. Go to https://www.revenuecat.com/
2. Click **"Get Started Free"**
3. Sign up with your email
4. Create a new project: **"MemoryVerse"**

---

## 📱 Step 2: Configure App in RevenueCat

### Add iOS App

1. In RevenueCat dashboard → **Apps**
2. Click **"+ New App"**
3. Fill in:
   - **App name:** MemoryVerse iOS
   - **Bundle ID:** `com.memoryverse.app`
   - **Platform:** iOS/iPadOS
4. Click **"Add iOS App"**

### Add Android App

1. Click **"+ New App"** again
2. Fill in:
   - **App name:** MemoryVerse Android
   - **Package name:** `com.memoryverse.app`
   - **Platform:** Android/Google Play
3. Click **"Add Android App"**

---

## 🔑 Step 3: Get API Keys

1. In RevenueCat dashboard → **API Keys**
2. Copy your **Public SDK Key** (starts with `appl_...` or `goog_...`)
3. Keep this safe - you'll add it to your app code

There are actually two keys:
- **Apple App Store key:** `appl_XxxXxxXxx`
- **Google Play Store key:** `goog_XxxXxxXxx`

You'll use the appropriate one based on the platform.

---

## 💰 Step 4: Set Up Products (Subscriptions)

### ✅ Your Products in App Store Connect (Already Created!)

You've already created these products in App Store Connect:

**Subscription Group:** MemoryVerse Premium Access

#### Product 1: Basic Monthly
- **Product ID:** `com.pintayo.memoryverse.pro.basic.monthly`
- **Reference Name:** MemoryVerse Pro Basic Monthly
- **Subscription Duration:** 1 Month
- **Price:** €4.99
- **Description:** "Unlock 1 prayer/day and daily spiritual encouragement"

#### Product 2: Standard Monthly (Recommended)
- **Product ID:** `com.pintayo.memoryverse.pro.standard.monthly`
- **Reference Name:** MemoryVerse Pro Standard Monthly
- **Subscription Duration:** 1 Month
- **Price:** €9.99
- **Description:** "Get 5 prayers/day and deeper scripture insights"

#### Product 3: Premium Monthly
- **Product ID:** `com.pintayo.memoryverse.pro.premium.monthly`
- **Reference Name:** MemoryVerse Pro Premium Monthly
- **Subscription Duration:** 1 Month
- **Price:** €14.99
- **Description:** "Get 10 prayers/day and exclusive spiritual features"

### Create in Google Play Console (Android) - When Ready

1. Go to https://play.google.com/console
2. Select your app
3. **Monetize** → **Products** → **Subscriptions**
4. Click **"Create subscription"**

**Create 3 products with SAME IDs:**
- `com.pintayo.memoryverse.pro.basic.monthly` - €4.99/month
- `com.pintayo.memoryverse.pro.standard.monthly` - €9.99/month
- `com.pintayo.memoryverse.pro.premium.monthly` - €14.99/month

**Billing period:** 1 month for all

**Free trial:** 7 days (recommended)

### Link Products to RevenueCat

1. RevenueCat dashboard → **Products**
2. Click **"+ New Product"**
3. For each product:
   - **Product ID:** `com.pintayo.memoryverse.pro.basic.monthly` (must match exactly!)
   - **Apple Product ID:** `com.pintayo.memoryverse.pro.basic.monthly`
   - **Google Product ID:** `com.pintayo.memoryverse.pro.basic.monthly`
4. Repeat for all 3 products

---

## 📦 Step 5: Create Offerings

Offerings let you test different pricing without changing code.

1. RevenueCat dashboard → **Offerings**
2. Click **"+ New Offering"**
3. Create offering:
   - **Identifier:** `default`
   - **Description:** Default offering
4. Add all 3 products to this offering
5. Mark **Standard** as "Default package" (recommended for most users)
6. Set this as **Current Offering**

---

## 🔧 Step 6: Install RevenueCat in Your App

### ✅ Package Already Installed!

The `react-native-purchases` package is already installed in your project.

### iOS Setup (Required)

You need to install CocoaPods dependencies:

```bash
cd ios
pod install
cd ..
```

If you don't have an `ios` folder yet (Expo Go mode), you'll generate it when building for iOS:

```bash
npx expo prebuild
```

### ✅ Configure Purchases (Already Done!)

The purchase service has already been created at `src/services/purchaseService.ts` with:
- Full RevenueCat SDK integration
- Subscription tier detection (Basic, Standard, Premium)
- Purchase and restore functionality
- Automatic sync with Supabase database

**What You Need to Do:**

Add your RevenueCat API keys to `.env` file:

```bash
# Copy .env.example to .env if you haven't already
cp .env.example .env

# Then edit .env and add your keys:
REVENUECAT_APPLE_API_KEY=appl_YOUR_KEY_HERE
REVENUECAT_GOOGLE_API_KEY=goog_YOUR_KEY_HERE
```

Get your API keys from:
1. RevenueCat dashboard → **Project Settings** → **API Keys**
2. Copy the **Public** SDK keys (not secret keys)

---

## 🎯 Step 7: App Integration (Already Done!)

### ✅ RevenueCat Initialization

RevenueCat is already integrated and initializes automatically when users log in:
- **Location:** `src/contexts/AuthContext.tsx`
- **When:** After user profile loads
- **What:** Initializes RevenueCat with user ID for subscription tracking

### ✅ Premium Upgrade Screen

The Premium Upgrade Screen has been fully updated:
- **Location:** `src/screens/PremiumUpgradeScreen.tsx`
- **Features:**
  - Loads subscription offerings from RevenueCat
  - Displays real-time pricing from App Store
  - Handles purchase flow with loading states
  - Implements restore purchases functionality
  - Auto-refreshes profile after purchase

**No code changes needed!** Just add your API keys to `.env`

---

## 🔔 Step 8: Set Up Webhooks (Important!)

RevenueCat webhooks keep your database in sync when subscriptions change.

### ✅ Webhook Handler Already Created!

A Supabase Edge Function has been created at:
- **Location:** `supabase/functions/revenuecat-webhook/index.ts`
- **Handles:** INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE, PRODUCT_CHANGE
- **Updates:** `is_premium`, `subscription_tier`, `premium_expires_at` in profiles table

### Deploy the Webhook

First, make sure you have Supabase CLI installed:

```bash
npm install -g supabase
```

Then deploy the webhook function:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the webhook function
supabase functions deploy revenuecat-webhook
```

After deployment, you'll get a URL like:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/revenuecat-webhook
```

### Configure Webhook in RevenueCat

1. RevenueCat dashboard → **Integrations** → **Webhooks**
2. Click **"+ Add Webhook"**
3. **URL:** `https://YOUR_PROJECT_ID.supabase.co/functions/v1/revenuecat-webhook`
4. **Events:** Select all events (recommended)
5. **Authorization:** (Optional but recommended for security)
6. Click **"Save"**

The webhook will now automatically update your database when:
- User purchases subscription
- Subscription renews
- User cancels subscription
- Subscription expires
- User changes subscription tier

---

## 🧪 Step 9: Testing

### iOS Sandbox Testing

1. Create a **Sandbox Tester** in App Store Connect
2. Settings → Users and Access → Sandbox Testers
3. Add a test account (use +sandbox@youremail.com)
4. Sign out of App Store on your device
5. Run your app
6. Try to purchase - it will ask for sandbox credentials
7. Use your sandbox account to "purchase" (free in sandbox)

### Android Testing

1. Google Play Console → **Setup** → **License Testing**
2. Add your email to test accounts
3. Use that Google account on your test device
4. Purchases will go through instantly (no charge)

### Test RevenueCat Integration

```typescript
// In your app, add a test button (remove before production)
<Button
  title="Test: Check Premium Status"
  onPress={async () => {
    const info = await purchaseService.getCustomerInfo();
    const isPremium = purchaseService.checkPremiumStatus(info);
    Alert.alert('Premium Status', isPremium ? 'Active!' : 'Not active');
  }}
/>
```

---

## 📊 Step 10: RevenueCat Dashboard

After setup, you can monitor:

### Overview
- Monthly Recurring Revenue (MRR)
- Active subscriptions
- Churn rate
- Conversion rate

### Customers
- Individual customer subscription status
- Purchase history
- Attribution (where users came from)

### Charts
- Revenue over time
- New vs returning customers
- Subscription cohorts

---

## 🚨 Important Notes

### Security
- **Never** hardcode your RevenueCat secret key in the app
- Only use the **public SDK key** in mobile apps
- Use webhooks for server-side verification

### Entitlements

RevenueCat uses "entitlements" instead of product IDs.

1. RevenueCat dashboard → **Entitlements**
2. Create entitlement: `premium`
3. Attach all your products to this entitlement
4. Check for `entitlements.active.premium` in your code

### Grace Period

Set a grace period for failed renewals:
- iOS: 16 days (Apple default)
- Android: 7 days
- RevenueCat shows this in dashboard

---

## ✅ Checklist

- [ ] RevenueCat account created
- [ ] iOS app added to RevenueCat
- [ ] Android app added to RevenueCat
- [ ] API keys obtained
- [ ] Products created in App Store Connect
- [ ] Products created in Google Play Console
- [ ] Products linked in RevenueCat
- [ ] Offering created and set as current
- [ ] `react-native-purchases` installed
- [ ] `purchaseService.ts` created with API keys
- [ ] Premium upgrade screen updated
- [ ] Webhook endpoint created
- [ ] Webhook configured in RevenueCat
- [ ] Tested with sandbox accounts

---

## 💰 Pricing Recommendation

Based on your features and market:

**Freemium Users (Free):**
- All core features
- No AI prayers
- Ads (optional)

**Basic ($4.99/mo):**
- 1 AI prayer per day
- Streak freeze (1x/week)
- Priority support

**Standard ($9.99/mo) - RECOMMENDED:**
- 5 AI prayers per day
- Unlimited streak freezes
- Advanced analytics
- All Bible translations

**Annual ($39.99/yr - Save 33%):**
- 10 AI prayers per day
- Everything in Standard
- Early access to new features

**Free Trial:** 7 days for any paid plan

---

## 📈 Expected Revenue

**Scenario: 1,000 users**

Conservative (2% conversion):
- 20 premium users × $9.99 = ~$200/month

Optimistic (5% conversion):
- 50 premium users × $9.99 = ~$500/month

**Your AI costs:** ~$45/month
**Net profit:** $155-455/month

**At 10,000 users (5% conversion):**
- 500 premium × $9.99 = ~$5,000/month
- AI costs: ~$180/month
- **Net profit: ~$4,800/month** 🚀

---

## 🔗 Resources

- RevenueCat Docs: https://docs.revenuecat.com
- React Native SDK: https://docs.revenuecat.com/docs/reactnative
- Testing Guide: https://docs.revenuecat.com/docs/sandbox
- Dashboard: https://app.revenuecat.com

---

**Ready to implement?** Follow this guide step-by-step and you'll have working in-app purchases in ~2-3 hours!
