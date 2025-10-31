#!/bin/bash

echo "🔨 FORCE iOS REBUILD"
echo "===================="
echo ""

# Kill Metro
echo "1️⃣  Killing Metro..."
pkill -f "metro" || true
pkill -f "expo" || true

# Delete build artifacts
echo "2️⃣  Deleting build artifacts..."
rm -rf ios/
rm -rf android/
rm -rf .expo/
rm -rf node_modules/.cache/

# Clear watchman
echo "3️⃣  Clearing Watchman..."
watchman watch-del-all || echo "Watchman not installed, skipping"

# Clear metro
echo "4️⃣  Clearing Metro cache..."
rm -rf $TMPDIR/metro-* || true
rm -rf $TMPDIR/haste-* || true

echo "5️⃣  Rebuilding iOS app..."
echo ""
echo "This will take a few minutes..."
npx expo run:ios

echo ""
echo "🎉 Done! The app should now be running with the latest code."
