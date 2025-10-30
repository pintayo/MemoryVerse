#!/bin/bash

# Quick Fix for iOS Dependency Issues
# Run this if you're getting "Cannot find module 'react-native-worklets/plugin'" error

set -e

echo "🔧 Fixing iOS Dependencies"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Install missing dependency
echo "1️⃣  Installing react-native-worklets..."
npm install react-native-worklets@^0.5.2 --legacy-peer-deps
echo -e "${GREEN}✅ react-native-worklets installed${NC}"
echo ""

# Step 2: Clean and regenerate iOS project
echo "2️⃣  Regenerating iOS project with Expo Prebuild..."
npx expo prebuild --clean --platform ios
echo -e "${GREEN}✅ iOS project regenerated${NC}"
echo ""

# Step 3: Install CocoaPods dependencies
echo "3️⃣  Installing iOS dependencies (CocoaPods)..."
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
