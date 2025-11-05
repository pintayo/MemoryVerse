#!/bin/bash

# Simple iOS Setup - No Prebuild Required!
# This uses Expo's standard development server

set -e

echo "🚀 Starting MemoryVerse for iOS"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Please create a .env file with your API keys"
    echo "   You can copy .env.example and fill in your values:"
    echo "   cp .env.example .env"
    exit 1
fi

echo -e "${GREEN}🎉 Ready to launch!${NC}"
echo ""
echo "Starting Expo development server..."
echo ""
echo "When the QR code appears, press 'i' to launch iOS simulator"
echo ""

# Start Expo
npx expo start

