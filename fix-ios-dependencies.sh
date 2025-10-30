#!/bin/bash

# Quick Fix for iOS Dependency Issues
# Run this if you're getting React Native Reanimated compatibility errors

set -e

echo "🔧 Fixing iOS Dependencies"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Clean existing installation
echo "1️⃣  Cleaning existing installation..."
rm -rf node_modules package-lock.json ios
echo -e "${GREEN}✅ Cleaned${NC}"
echo ""

# Step 2: Install dependencies with correct versions
echo "2️⃣  Installing dependencies..."
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Clean and regenerate iOS project
echo "3️⃣  Regenerating iOS project with Expo Prebuild..."
npx expo prebuild --clean --platform ios
echo -e "${GREEN}✅ iOS project regenerated${NC}"
echo ""

# Step 4: Install CocoaPods dependencies
echo "4️⃣  Installing iOS dependencies (CocoaPods)..."
cd ios
pod install
cd ..
echo -e "${GREEN}✅ CocoaPods dependencies installed${NC}"
echo ""

echo -e "${GREEN}🎉 Fix complete!${NC}"
echo ""
echo "Now you can run:"
echo "  npx expo start"
echo "  (then press 'i' to launch iOS simulator)"
echo ""
