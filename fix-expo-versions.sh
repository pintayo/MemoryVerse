#!/bin/bash

# Fix Expo Version Compatibility
# This aligns React Native and React to Expo SDK 54 requirements

set -e

echo "🔧 Fixing Expo Version Compatibility"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "This will install versions compatible with Expo SDK 54:"
echo "  - React 19.1.0 (was 18.2.0)"
echo "  - React Native 0.81.5 (was 0.75.4)"
echo "  - React Native Reanimated 4.1.1 (was 3.15.1)"
echo ""
echo "This fixes the 'Bridgeless mode' error with Expo Go."
echo ""

# Step 1: Clean everything
echo "1️⃣  Cleaning existing installation..."
rm -rf node_modules package-lock.json ios
echo -e "${GREEN}✅ Cleaned${NC}"
echo ""

# Step 2: Install with updated versions
echo "2️⃣  Installing dependencies with Expo-compatible versions..."
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${GREEN}🎉 Fix complete!${NC}"
echo ""
echo "Now you can run:"
echo "  npx expo start"
echo "  (then press 'i' to launch iOS simulator)"
echo ""
echo "The app should now work with Expo Go (no Bridgeless mode errors)!"
echo ""
