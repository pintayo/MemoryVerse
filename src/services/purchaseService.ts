/**
 * Purchase Service
 * Manages in-app purchases and subscriptions via RevenueCat
 */

import Purchases, {
  PurchasesOfferings,
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';

// RevenueCat API Keys (loaded from environment variables)
const API_KEYS = {
  apple: process.env.REVENUECAT_APPLE_API_KEY || '',
  google: process.env.REVENUECAT_GOOGLE_API_KEY || '',
};

export interface SubscriptionTier {
  id: string;
  title: string;
  price: string;
  period: string;
  pricePerMonth: string;
  features: string[];
  package?: PurchasesPackage;
  isRecommended?: boolean;
  savings?: string;
}

export interface PurchaseResult {
  success: boolean;
  isPremium: boolean;
  error?: string;
  userCancelled?: boolean;
}

class PurchaseService {
  private initialized = false;
  private currentUserId?: string;

  /**
   * Initialize RevenueCat
   * Call this once when app starts or user logs in
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized && this.currentUserId === userId) {
      logger.log('[PurchaseService] Already initialized for this user');
      return;
    }

    try {
      const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;

      if (!apiKey) {
        logger.warn('[PurchaseService] RevenueCat API key not configured');
        // Don't throw error - allow app to function without purchases
        return;
      }

      // Set log level based on environment
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      } else {
        Purchases.setLogLevel(LOG_LEVEL.INFO);
      }

      // Configure RevenueCat with user ID
      await Purchases.configure({ apiKey, appUserID: userId });

      this.initialized = true;
      this.currentUserId = userId;

      logger.log('[PurchaseService] Initialized successfully for user:', userId);

      // Sync initial customer info with backend
      await this.syncCustomerInfo();
    } catch (error) {
      logger.error('[PurchaseService] Initialization failed:', error);
      // Don't throw - allow app to continue without purchases
    }
  }

  /**
   * Get available subscription offerings from RevenueCat
   */
  async getOfferings(): Promise<SubscriptionTier[]> {
    try {
      if (!this.initialized) {
        logger.warn('[PurchaseService] Not initialized, returning empty offerings');
        return this.getFallbackOfferings();
      }

      const offerings: PurchasesOfferings = await Purchases.getOfferings();

      if (!offerings.current || !offerings.current.availablePackages.length) {
        logger.warn('[PurchaseService] No offerings available');
        return this.getFallbackOfferings();
      }

      const current = offerings.current;
      const tiers: SubscriptionTier[] = [];

      // Map packages to subscription tiers
      current.availablePackages.forEach((pkg) => {
        const product = pkg.product;
        const productId = product.identifier;

        // Determine tier details
        const tierInfo = this.getTierInfo(productId);

        tiers.push({
          id: productId,
          title: tierInfo.title,
          price: product.priceString,
          period: this.getPeriodText(product.subscriptionPeriod),
          pricePerMonth: this.calculateMonthlyPrice(product.price, product.subscriptionPeriod),
          features: tierInfo.features,
          package: pkg,
          isRecommended: tierInfo.isRecommended,
          savings: tierInfo.savings,
        });
      });

      // Sort: Annual first (recommended), then Standard, then Basic
      tiers.sort((a, b) => {
        if (a.isRecommended) return -1;
        if (b.isRecommended) return 1;
        return 0;
      });

      logger.log(`[PurchaseService] Loaded ${tiers.length} offerings`);
      return tiers;
    } catch (error) {
      logger.error('[PurchaseService] Error fetching offerings:', error);
      return this.getFallbackOfferings();
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
    try {
      if (!this.initialized) {
        return {
          success: false,
          isPremium: false,
          error: 'Purchase service not initialized',
        };
      }

      logger.log('[PurchaseService] Purchasing package:', pkg.product.identifier);

      const purchaseResult = await Purchases.purchasePackage(pkg);
      const customerInfo = purchaseResult.customerInfo;

      const isPremium = this.checkPremiumStatus(customerInfo);

      if (isPremium) {
        logger.log('[PurchaseService] Purchase successful!');

        // Sync customer info with backend
        await this.syncCustomerInfo(customerInfo);

        return { success: true, isPremium: true };
      } else {
        return {
          success: false,
          isPremium: false,
          error: 'Purchase did not activate premium',
        };
      }
    } catch (error: any) {
      logger.error('[PurchaseService] Purchase failed:', error);

      if (error.userCancelled) {
        return {
          success: false,
          isPremium: false,
          error: 'Purchase cancelled',
          userCancelled: true,
        };
      }

      return {
        success: false,
        isPremium: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!this.initialized) {
        return {
          success: false,
          isPremium: false,
          error: 'Purchase service not initialized',
        };
      }

      logger.log('[PurchaseService] Restoring purchases...');

      const customerInfo = await Purchases.restorePurchases();
      const isPremium = this.checkPremiumStatus(customerInfo);

      // Sync with backend
      await this.syncCustomerInfo(customerInfo);

      logger.log('[PurchaseService] Restore completed. Premium:', isPremium);
      return { success: true, isPremium };
    } catch (error: any) {
      logger.error('[PurchaseService] Restore failed:', error);
      return {
        success: false,
        isPremium: false,
        error: error.message || 'Restore failed',
      };
    }
  }

  /**
   * Check if user has active premium subscription
   */
  checkPremiumStatus(customerInfo: CustomerInfo): boolean {
    const entitlements = customerInfo.entitlements.active;
    return 'premium' in entitlements;
  }

  /**
   * Get current customer info from RevenueCat
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      if (!this.initialized) {
        logger.warn('[PurchaseService] Not initialized');
        return null;
      }

      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      logger.error('[PurchaseService] Error getting customer info:', error);
      return null;
    }
  }

  /**
   * Sync customer info with backend (Supabase)
   */
  private async syncCustomerInfo(customerInfo?: CustomerInfo): Promise<void> {
    try {
      if (!this.currentUserId) {
        logger.warn('[PurchaseService] No user ID to sync');
        return;
      }

      const info = customerInfo || await this.getCustomerInfo();
      if (!info) return;

      const isPremium = this.checkPremiumStatus(info);

      // Determine subscription tier based on active entitlements
      let subscriptionTier: string | null = null;
      if (isPremium && info.entitlements.active['premium']) {
        const productId = info.entitlements.active['premium'].productIdentifier;
        subscriptionTier = this.getSubscriptionTierFromProductId(productId);
      }

      // Update user profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: isPremium,
          subscription_tier: subscriptionTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentUserId);

      if (error) {
        logger.error('[PurchaseService] Error syncing to database:', error);
      } else {
        logger.log('[PurchaseService] Synced premium status:', isPremium, 'tier:', subscriptionTier);
      }
    } catch (error) {
      logger.error('[PurchaseService] Error syncing customer info:', error);
    }
  }

  /**
   * Get subscription tier from product ID
   */
  private getSubscriptionTierFromProductId(productId: string): string {
    if (productId.includes('premium')) return 'premium';
    if (productId.includes('standard')) return 'standard';
    if (productId.includes('basic')) return 'basic';
    return 'basic';
  }

  /**
   * Get tier information based on product ID
   */
  private getTierInfo(productId: string): {
    title: string;
    features: string[];
    isRecommended: boolean;
    savings?: string;
  } {
    // Premium Tier (€14.99/mo) - Highest tier
    if (productId.includes('premium')) {
      return {
        title: 'Premium',
        features: [
          '10 AI prayers per day',
          'Daily spiritual encouragement',
          'Deeper scripture insights',
          'Unlimited streak freezes',
          'Advanced verse analytics',
          'All Bible translations',
          'Priority support',
          'Early access to new features',
        ],
        isRecommended: false, // Standard is recommended for most users
      };
    }

    // Standard Tier (€9.99/mo) - Recommended for most users
    if (productId.includes('standard')) {
      return {
        title: 'Standard',
        features: [
          '5 AI prayers per day',
          'Daily spiritual encouragement',
          'Deeper scripture insights',
          '3 streak freezes per month',
          'Advanced verse analytics',
          'All Bible translations',
          'Email support',
        ],
        isRecommended: true, // Best value for most users
      };
    }

    // Basic Tier (€4.99/mo) - Entry level
    if (productId.includes('basic')) {
      return {
        title: 'Basic',
        features: [
          '1 AI prayer per day',
          'Daily spiritual encouragement',
          '1 streak freeze per month',
          'Basic verse analytics',
          'Email support',
        ],
        isRecommended: false,
      };
    }

    return {
      title: 'Premium',
      features: ['All premium features'],
      isRecommended: false,
    };
  }

  /**
   * Get period text from subscription period
   */
  private getPeriodText(period: string | null | undefined): string {
    if (!period) return '/month';

    const periodLower = period.toLowerCase();
    if (periodLower.includes('year')) return '/year';
    if (periodLower.includes('month')) return '/month';
    if (periodLower.includes('week')) return '/week';

    return '/month';
  }

  /**
   * Calculate monthly price for comparison
   */
  private calculateMonthlyPrice(price: number, period: string | null | undefined): string {
    if (!period) return `$${price.toFixed(2)}/mo`;

    const periodLower = period.toLowerCase();
    if (periodLower.includes('year')) {
      const monthly = price / 12;
      return `$${monthly.toFixed(2)}/mo`;
    }

    return `$${price.toFixed(2)}/mo`;
  }

  /**
   * Get fallback offerings when RevenueCat is unavailable
   * Shows pricing but purchases won't work
   */
  private getFallbackOfferings(): SubscriptionTier[] {
    return [
      {
        id: 'com.pintayo.memoryverse.pro.standard.monthly',
        title: 'Standard',
        price: '€9.99',
        period: '/month',
        pricePerMonth: '€9.99/mo',
        features: [
          '5 AI prayers per day',
          'Daily spiritual encouragement',
          'Deeper scripture insights',
          '3 streak freezes per month',
          'Advanced verse analytics',
          'All Bible translations',
          'Email support',
        ],
        isRecommended: true,
      },
      {
        id: 'com.pintayo.memoryverse.pro.premium.monthly',
        title: 'Premium',
        price: '€14.99',
        period: '/month',
        pricePerMonth: '€14.99/mo',
        features: [
          '10 AI prayers per day',
          'Daily spiritual encouragement',
          'Deeper scripture insights',
          'Unlimited streak freezes',
          'Advanced verse analytics',
          'All Bible translations',
          'Priority support',
          'Early access to new features',
        ],
        isRecommended: false,
      },
      {
        id: 'com.pintayo.memoryverse.pro.basic.monthly',
        title: 'Basic',
        price: '€4.99',
        period: '/month',
        pricePerMonth: '€4.99/mo',
        features: [
          '1 AI prayer per day',
          'Daily spiritual encouragement',
          '1 streak freeze per month',
          'Basic verse analytics',
          'Email support',
        ],
        isRecommended: false,
      },
    ];
  }

  /**
   * Check if RevenueCat is properly configured
   */
  isConfigured(): boolean {
    const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
    return !!apiKey && this.initialized;
  }
}

export const purchaseService = new PurchaseService();

logger.log('[purchaseService] Module loaded');
