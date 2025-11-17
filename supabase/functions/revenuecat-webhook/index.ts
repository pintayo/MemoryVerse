/**
 * RevenueCat Webhook Handler
 *
 * This Supabase Edge Function handles webhook events from RevenueCat
 * to keep the database in sync with subscription changes.
 *
 * Webhook Events Handled:
 * - INITIAL_PURCHASE: User subscribes for the first time
 * - RENEWAL: Subscription renews successfully
 * - CANCELLATION: User cancels subscription (access until expiration)
 * - EXPIRATION: Subscription expires (remove access)
 * - BILLING_ISSUE: Payment failed
 *
 * Setup:
 * 1. Deploy this function: supabase functions deploy revenuecat-webhook
 * 2. Get the function URL: https://[project-id].supabase.co/functions/v1/revenuecat-webhook
 * 3. Add URL to RevenueCat dashboard: Integrations → Webhooks
 * 4. Set authorization header with shared secret for security
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// RevenueCat webhook event types
type WebhookEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  | 'UNCANCELLATION';

interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    id: string;
    type: WebhookEventType;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    entitlement_ids: string[];
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    store: 'APP_STORE' | 'PLAY_STORE';
    environment: 'PRODUCTION' | 'SANDBOX';
    price_in_purchased_currency: number;
    currency: string;
    is_family_share: boolean;
  };
}

// Helper to extract subscription tier from product ID
function getSubscriptionTier(productId: string): string | null {
  if (productId.includes('premium')) return 'premium';
  if (productId.includes('standard')) return 'standard';
  if (productId.includes('basic')) return 'basic';
  return null;
}

// Helper to check if subscription is active
function isSubscriptionActive(expirationMs: number | null): boolean {
  if (!expirationMs) return false;
  return expirationMs > Date.now();
}

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse webhook payload
    const payload: RevenueCatWebhookEvent = await req.json();
    const { event } = payload;

    console.log('[RevenueCat Webhook] Received event:', {
      type: event.type,
      userId: event.app_user_id,
      productId: event.product_id,
      environment: event.environment,
    });

    // Initialize Supabase client (uses service role key for full access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const userId = event.app_user_id;
    const productId = event.product_id;
    const subscriptionTier = getSubscriptionTier(productId);
    const expirationDate = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    // Handle different event types
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION': {
        // Activate premium access
        const isActive = isSubscriptionActive(event.expiration_at_ms);

        const { error } = await supabase
          .from('profiles')
          .update({
            is_premium: isActive,
            subscription_tier: subscriptionTier,
            premium_expires_at: expirationDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('[RevenueCat Webhook] Error updating profile:', error);
          throw error;
        }

        console.log('[RevenueCat Webhook] Premium activated:', {
          userId,
          tier: subscriptionTier,
          expiresAt: expirationDate,
        });
        break;
      }

      case 'CANCELLATION': {
        // User cancelled but still has access until expiration
        // Just log it, don't remove premium yet
        console.log('[RevenueCat Webhook] Subscription cancelled (access until expiration):', {
          userId,
          expiresAt: expirationDate,
        });
        break;
      }

      case 'EXPIRATION': {
        // Subscription expired, remove premium access
        const { error } = await supabase
          .from('profiles')
          .update({
            is_premium: false,
            subscription_tier: null,
            premium_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('[RevenueCat Webhook] Error removing premium:', error);
          throw error;
        }

        console.log('[RevenueCat Webhook] Premium expired:', { userId });
        break;
      }

      case 'BILLING_ISSUE': {
        // Payment failed - log for monitoring
        console.warn('[RevenueCat Webhook] Billing issue:', {
          userId,
          productId,
          expiresAt: expirationDate,
        });
        // Don't immediately remove access - RevenueCat has grace period
        break;
      }

      case 'PRODUCT_CHANGE': {
        // User switched to different tier
        const isActive = isSubscriptionActive(event.expiration_at_ms);

        const { error } = await supabase
          .from('profiles')
          .update({
            is_premium: isActive,
            subscription_tier: subscriptionTier,
            premium_expires_at: expirationDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('[RevenueCat Webhook] Error updating tier:', error);
          throw error;
        }

        console.log('[RevenueCat Webhook] Subscription tier changed:', {
          userId,
          newTier: subscriptionTier,
        });
        break;
      }

      default:
        console.log('[RevenueCat Webhook] Unhandled event type:', event.type);
    }

    // Return success response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[RevenueCat Webhook] Error processing webhook:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
