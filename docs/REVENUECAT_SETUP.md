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

### Create in App Store Connect (iOS)

1. Go to https://appstoreconnect.apple.com
2. **My Apps** → Select your app
3. **In-App Purchases** (in sidebar)
4. Click **"+"** to create new subscription

**Subscription Group:**
1. Create group: "MemoryVerse Premium"
2. Reference Name: "Premium Membership"

**Create 3 subscriptions:**

#### Product 1: Basic Monthly
- **Product ID:** `memoryverse_basic_monthly`
- **Reference Name:** Basic Monthly
- **Subscription Duration:** 1 Month
- **Price:** $4.99 USD
- **Description:** "Unlock AI prayer coaching and streak protection"

#### Product 2: Standard Monthly
- **Product ID:** `memoryverse_standard_monthly`
- **Reference Name:** Standard Monthly
- **Subscription Duration:** 1 Month
- **Price:** $9.99 USD
- **Description:** "Unlock all premium features with 5 AI prayers daily"

#### Product 3: Annual (Best Value)
- **Product ID:** `memoryverse_annual`
- **Reference Name:** Annual Premium
- **Subscription Duration:** 1 Year
- **Price:** $39.99 USD (Save 33%!)
- **Description:** "Best value - all premium features, billed yearly"

### Create in Google Play Console (Android)

1. Go to https://play.google.com/console
2. Select your app
3. **Monetize** → **Products** → **Subscriptions**
4. Click **"Create subscription"**

**Create same 3 products:**
- `memoryverse_basic_monthly` - $4.99/month
- `memoryverse_standard_monthly` - $9.99/month
- `memoryverse_annual` - $39.99/year

**Billing period:**
- Monthly: 1 month
- Annual: 1 year

**Free trial:** 7 days (recommended)

### Link Products to RevenueCat

1. RevenueCat dashboard → **Products**
2. Click **"+ New Product"**
3. For each product:
   - **Product ID:** `memoryverse_basic_monthly` (must match exactly!)
   - **Apple Product ID:** `memoryverse_basic_monthly`
   - **Google Product ID:** `memoryverse_basic_monthly`
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
5. Mark **Annual** as "Default package"
6. Set this as **Current Offering**

---

## 🔧 Step 6: Install RevenueCat in Your App

### Install Package

```bash
cd /path/to/MemoryVerse
npm install react-native-purchases
```

### iOS Setup

```bash
cd ios
pod install
cd ..
```

### Configure Purchases

Create a new service file:

**File:** `src/services/purchaseService.ts`

```typescript
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

// RevenueCat API Keys
const API_KEYS = {
  apple: 'appl_YOUR_APPLE_KEY_HERE', // Replace with your actual key
  google: 'goog_YOUR_GOOGLE_KEY_HERE', // Replace with your actual key
};

export interface SubscriptionTier {
  id: string;
  title: string;
  price: string;
  period: string;
  features: string[];
  package?: PurchasesPackage;
}

class PurchaseService {
  private initialized = false;

  /**
   * Initialize RevenueCat
   * Call this once when app starts
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    try {
      const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;

      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG); // Remove in production

      await Purchases.configure({ apiKey, appUserID: userId });

      this.initialized = true;
      logger.log('[PurchaseService] Initialized successfully');
    } catch (error) {
      logger.error('[PurchaseService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<SubscriptionTier[]> {
    try {
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        logger.warn('[PurchaseService] No offerings available');
        return [];
      }

      const current = offerings.current;
      const tiers: SubscriptionTier[] = [];

      // Map packages to subscription tiers
      current.availablePackages.forEach((pkg) => {
        const product = pkg.product;

        tiers.push({
          id: product.identifier,
          title: this.getTierName(product.identifier),
          price: product.priceString,
          period: product.subscriptionPeriod || 'month',
          features: this.getTierFeatures(product.identifier),
          package: pkg,
        });
      });

      return tiers;
    } catch (error) {
      logger.error('[PurchaseService] Error fetching offerings:', error);
      return [];
    }
  }

  /**
   * Purchase a subscription
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      const isPremium = this.checkPremiumStatus(customerInfo);

      if (isPremium) {
        logger.log('[PurchaseService] Purchase successful!');
        return { success: true };
      } else {
        return { success: false, error: 'Purchase did not activate premium' };
      }
    } catch (error: any) {
      logger.error('[PurchaseService] Purchase failed:', error);

      if (error.userCancelled) {
        return { success: false, error: 'User cancelled' };
      }

      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<{ success: boolean; isPremium: boolean }> {
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      const isPremium = this.checkPremiumStatus(customerInfo);

      logger.log('[PurchaseService] Restore completed. Premium:', isPremium);
      return { success: true, isPremium };
    } catch (error) {
      logger.error('[PurchaseService] Restore failed:', error);
      return { success: false, isPremium: false };
    }
  }

  /**
   * Check if user has active premium subscription
   */
  checkPremiumStatus(customerInfo: any): boolean {
    const entitlements = customerInfo.entitlements.active;
    return 'premium' in entitlements;
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      logger.error('[PurchaseService] Error getting customer info:', error);
      return null;
    }
  }

  /**
   * Helper: Get tier name from product ID
   */
  private getTierName(productId: string): string {
    if (productId.includes('basic')) return 'Basic';
    if (productId.includes('standard')) return 'Standard';
    if (productId.includes('annual')) return 'Annual Premium';
    return 'Premium';
  }

  /**
   * Helper: Get tier features
   */
  private getTierFeatures(productId: string): string[] {
    const common = ['Remove ads', 'Streak freeze', 'Advanced stats'];

    if (productId.includes('basic')) {
      return [...common, '1 AI prayer per day'];
    }
    if (productId.includes('standard')) {
      return [...common, '5 AI prayers per day', 'Priority support'];
    }
    if (productId.includes('annual')) {
      return [...common, '10 AI prayers per day', 'All translations', 'Early access'];
    }

    return common;
  }
}

export const purchaseService = new PurchaseService();
```

---

## 🎯 Step 7: Update App to Use RevenueCat

### Initialize on App Start

**File:** `App.tsx` or `src/contexts/AuthContext.tsx`

```typescript
import { purchaseService } from './services/purchaseService';

// In your app initialization (after user logs in)
useEffect(() => {
  if (user?.id) {
    purchaseService.initialize(user.id);
  }
}, [user]);
```

### Update Premium Upgrade Screen

**File:** `src/screens/PremiumUpgradeScreen.tsx`

Replace the `handleUpgrade` function:

```typescript
const [offerings, setOfferings] = useState<SubscriptionTier[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  loadOfferings();
}, []);

const loadOfferings = async () => {
  setIsLoading(true);
  const tiers = await purchaseService.getOfferings();
  setOfferings(tiers);
  setIsLoading(false);
};

const handleUpgrade = async (tier: SubscriptionTier) => {
  if (!tier.package) return;

  setIsLoading(true);
  const result = await purchaseService.purchasePackage(tier.package);
  setIsLoading(false);

  if (result.success) {
    Alert.alert('Success!', 'Welcome to Premium! 🎉');
    // Update user's premium status in your database
    await updateUserPremiumStatus(user.id, true);
    // Refresh profile
    await refreshProfile();
  } else if (result.error && result.error !== 'User cancelled') {
    Alert.alert('Purchase Failed', result.error);
  }
};
```

---

## 🔔 Step 8: Set Up Webhooks (Important!)

RevenueCat webhooks keep your database in sync.

### Create Webhook Endpoint

**File:** Create a serverless function or API endpoint

```typescript
// Example: Supabase Edge Function or Vercel Serverless Function
export default async function handler(req, res) {
  const event = req.body;

  // RevenueCat sends events like:
  // - INITIAL_PURCHASE
  // - RENEWAL
  // - CANCELLATION
  // - EXPIRATION

  if (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') {
    // Update user to premium
    const userId = event.app_user_id;

    await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_expires_at: event.expiration_at_ms,
      })
      .eq('id', userId);
  }

  if (event.type === 'CANCELLATION' || event.type === 'EXPIRATION') {
    // Remove premium access
    const userId = event.app_user_id;

    await supabase
      .from('profiles')
      .update({ is_premium: false })
      .eq('id', userId);
  }

  res.status(200).json({ received: true });
}
```

### Configure in RevenueCat

1. RevenueCat dashboard → **Integrations** → **Webhooks**
2. Click **"+ Add Webhook"**
3. Enter your webhook URL
4. Select events to receive (select all for now)
5. Save

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
