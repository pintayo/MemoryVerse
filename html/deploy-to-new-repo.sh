#!/bin/bash

# Script to turn the html folder into its own GitHub repository
# This will create a new repo that's ready for GitHub Pages deployment

echo "🚀 Creating separate repository for MemoryVerse website..."
echo ""

# Step 1: Ask for the GitHub repo URL
echo "First, create a new repository on GitHub:"
echo "  1. Go to: https://github.com/new"
echo "  2. Repository name: pintayo.github.io (for user site)"
echo "     OR: memoryverse-website (for project site)"
echo "  3. Make it Public"
echo "  4. DON'T initialize with README, .gitignore, or license"
echo "  5. Click 'Create repository'"
echo ""
read -p "Enter the new repository URL (e.g., https://github.com/pintayo/pintayo.github.io.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Repository URL is required"
    exit 1
fi

# Step 2: Create a temporary directory
TEMP_DIR="/tmp/memoryverse-website-$(date +%s)"
mkdir -p "$TEMP_DIR"

echo ""
echo "📁 Copying website files to temporary directory..."

# Step 3: Copy all html files to temp directory
cp -r /home/user/MemoryVerse/html/* "$TEMP_DIR/"

# Step 4: Initialize git repo
cd "$TEMP_DIR"
git init
git add .
git commit -m "Initial commit: MemoryVerse website

- Professional landing page
- Privacy Policy (GDPR & CCPA compliant)
- Terms of Service
- Support Center with FAQs
- Responsive design ready for GitHub Pages"

# Step 5: Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git branch -M main
git remote add origin "$REPO_URL"
git push -u origin main

echo ""
echo "✅ Success! Your website is now in a separate repository!"
echo ""
echo "📍 Repository URL: $REPO_URL"
echo "📁 Local copy: $TEMP_DIR"
echo ""
echo "🌐 Next steps:"
echo "  1. Go to your repo settings: https://github.com/[username]/[repo]/settings/pages"
echo "  2. Under 'Source', select branch: main"
echo "  3. Set folder to: / (root)"
echo "  4. Click Save"
echo ""
if [[ "$REPO_URL" == *"pintayo.github.io"* ]]; then
    echo "  5. Your site will be available at: https://pintayo.github.io/"
else
    REPO_NAME=$(basename "$REPO_URL" .git)
    echo "  5. Your site will be available at: https://pintayo.github.io/$REPO_NAME/"
fi
echo ""
echo "  6. For custom domain (pintayo.com):"
echo "     - Add custom domain in GitHub Pages settings"
echo "     - Update DNS records as described in README.md"
echo ""
echo "🎉 Done!"
