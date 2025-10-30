#!/bin/bash

# Final iOS Fix - Use Expo's Automatic Dependency Resolution
# This lets Expo install the exact compatible versions

set -e

echo "🔧 Final iOS Setup - Expo Auto-Install"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "This will use Expo's automatic dependency resolution to install"
echo "all packages with the correct versions for Expo SDK 54."
echo ""

# Step 1: Clean everything
echo "1️⃣  Cleaning existing installation..."
rm -rf node_modules package-lock.json ios android
echo -e "${GREEN}✅ Cleaned${NC}"
echo ""

# Step 2: Use Expo install for automatic version resolution
echo "2️⃣  Installing dependencies with Expo's auto-resolution..."
npx expo install --fix
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Now you can run:"
echo "  npx expo start"
echo "  (then press 'i' to launch iOS simulator)"
echo ""
