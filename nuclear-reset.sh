#!/bin/bash

# Nuclear Reset - Clear EVERYTHING and start fresh
# Use this when nothing else works

set -e

echo "🔥 NUCLEAR RESET - Clearing EVERYTHING"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "⚠️  This will delete:"
echo "   - node_modules"
echo "   - package-lock.json"
echo "   - ios folder"
echo "   - android folder"
echo "   - All Metro bundler cache"
echo "   - Watchman cache"
echo "   - Expo cache"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

echo ""
echo "1️⃣  Killing any running processes..."
killall -9 node 2>/dev/null || true
killall -9 "Expo Go" 2>/dev/null || true
echo -e "${GREEN}✅ Processes killed${NC}"
echo ""

echo "2️⃣  Clearing Metro bundler cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
echo -e "${GREEN}✅ Metro cache cleared${NC}"
echo ""

echo "3️⃣  Clearing Watchman cache..."
watchman watch-del-all 2>/dev/null || true
echo -e "${GREEN}✅ Watchman cache cleared${NC}"
echo ""

echo "4️⃣  Clearing Expo cache..."
rm -rf ~/.expo/cache 2>/dev/null || true
echo -e "${GREEN}✅ Expo cache cleared${NC}"
echo ""

echo "5️⃣  Clearing project caches..."
rm -rf .expo
rm -rf .expo-shared
rm -rf node_modules
rm -rf package-lock.json
rm -rf ios
rm -rf android
echo -e "${GREEN}✅ Project caches cleared${NC}"
echo ""

echo "6️⃣  Installing dependencies..."
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo "7️⃣  Fixing versions..."
npx expo install --fix
echo -e "${GREEN}✅ Versions fixed${NC}"
echo ""

echo -e "${GREEN}🎉 NUCLEAR RESET COMPLETE!${NC}"
echo ""
echo "Now run:"
echo "  npx expo start --clear"
echo "  Press 'i'"
echo ""
echo "If this STILL doesn't work, the problem is in the Supabase"
echo "configuration or database schema."
echo ""
