#!/bin/bash

# MemoryVerse iOS Setup Script
# This script will help you set up the development environment for iOS

set -e  # Exit on error

echo "🚀 MemoryVerse iOS Setup"
echo "======================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ Error: This script must be run on macOS${NC}"
    exit 1
fi

echo "📋 Checking prerequisites..."
echo ""

# Check Xcode
echo "1. Checking Xcode..."
if ! xcode-select -p &> /dev/null; then
    echo -e "${RED}❌ Xcode is not installed${NC}"
    echo "   Please install Xcode from the Mac App Store"
    echo "   https://apps.apple.com/us/app/xcode/id497799835"
    exit 1
else
    echo -e "${GREEN}✅ Xcode is installed${NC}"
    xcode-select -p
fi
echo ""

# Check Xcode Command Line Tools
echo "2. Checking Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
    echo -e "${YELLOW}⚠️  Installing Xcode Command Line Tools...${NC}"
    xcode-select --install
    echo "   Please complete the installation and run this script again"
    exit 1
else
    echo -e "${GREEN}✅ Command Line Tools are installed${NC}"
fi
echo ""

# Check Node.js
echo "3. Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
else
    echo -e "${GREEN}✅ Node.js is installed: $(node -v)${NC}"
fi
echo ""

# Check npm
echo "4. Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm is installed: $(npm -v)${NC}"
fi
echo ""

# Check CocoaPods
echo "5. Checking CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}⚠️  CocoaPods not found. Installing...${NC}"
    sudo gem install cocoapods
    echo -e "${GREEN}✅ CocoaPods installed${NC}"
else
    echo -e "${GREEN}✅ CocoaPods is installed: $(pod --version)${NC}"
fi
echo ""

# Check Watchman (optional)
echo "6. Checking Watchman (optional)..."
if ! command -v watchman &> /dev/null; then
    echo -e "${YELLOW}⚠️  Watchman not found (optional but recommended)${NC}"
    if command -v brew &> /dev/null; then
        read -p "   Install Watchman via Homebrew? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            brew install watchman
            echo -e "${GREEN}✅ Watchman installed${NC}"
        fi
    else
        echo "   Install Homebrew first: https://brew.sh"
        echo "   Then run: brew install watchman"
    fi
else
    echo -e "${GREEN}✅ Watchman is installed${NC}"
fi
echo ""

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Node dependencies installed${NC}"
echo ""

# Generate native iOS project
echo "📱 Generating iOS project with Expo Prebuild..."
npx expo prebuild --clean --platform ios
echo -e "${GREEN}✅ iOS project generated${NC}"
echo ""

# Install iOS dependencies (CocoaPods)
echo "📲 Installing iOS dependencies (CocoaPods)..."
if [ -d "ios" ]; then
    cd ios
    pod install
    cd ..
    echo -e "${GREEN}✅ iOS dependencies installed${NC}"
else
    echo -e "${RED}❌ iOS folder not found after prebuild${NC}"
    echo "   Please check the output above for errors"
    exit 1
fi
echo ""

# Check for .env file
echo "🔑 Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found${NC}"

    # Check for .env.example
    if [ -f ".env.example" ]; then
        echo "   Copying .env.example to .env"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env with your API keys:${NC}"
    else
        echo "   Creating .env template"
        cat > .env << 'EOF'
# Supabase Configuration (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Provider Configuration
EXPO_PUBLIC_AI_PROVIDER=perplexity
EXPO_PUBLIC_PERPLEXITY_API_KEY=pplx-your-key-here
EOF
        echo -e "${YELLOW}⚠️  Created .env file - please configure your API keys:${NC}"
    fi

    echo ""
    echo "   Required keys:"
    echo "   - EXPO_PUBLIC_SUPABASE_URL"
    echo "   - EXPO_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - EXPO_PUBLIC_PERPLEXITY_API_KEY (or OpenAI/Anthropic)"
    echo ""
    echo "   Get Perplexity API key: https://www.perplexity.ai/settings/api"
    echo ""
else
    echo -e "${GREEN}✅ .env file exists${NC}"

    # Validate required keys
    if ! grep -q "EXPO_PUBLIC_SUPABASE_URL=your-supabase-url" .env && \
       ! grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key" .env; then
        echo -e "${GREEN}✅ Environment appears configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Please update your .env file with real API keys${NC}"
    fi
fi
echo ""

# Success message
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. If you haven't already, configure your .env file with API keys"
echo "2. Start the development server:"
echo -e "   ${GREEN}npx expo start${NC}"
echo ""
echo "3. Press 'i' to launch the iOS simulator"
echo ""
echo "📚 For more help, see: docs/IOS_SETUP_GUIDE.md"
echo ""
echo "Troubleshooting:"
echo "  - Clear cache: npx expo start --clear"
echo "  - Reinstall pods: cd ios && pod install && cd .."
echo "  - Reset simulator: xcrun simctl erase all"
echo ""
