-- Migration: Add subscription_tier column to profiles table
-- This tracks which subscription tier a user has: basic, standard, or premium
-- Used by RevenueCat integration to enforce tier-specific limits

-- Add subscription_tier column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT;

-- Add comment to document the column
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription tier: basic, standard, or premium. NULL for free users.';

-- Create index for faster queries filtering by subscription tier
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
ON profiles(subscription_tier);

-- Add check constraint to ensure only valid tiers
ALTER TABLE profiles
ADD CONSTRAINT check_subscription_tier
CHECK (subscription_tier IS NULL OR subscription_tier IN ('basic', 'standard', 'premium'));
