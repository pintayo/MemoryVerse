#!/bin/bash
# Script to replace console.log with production-ready logger
# Run this from the project root: bash scripts/replace-console-logs.sh

echo "🔍 Replacing console.log statements with logger..."

# Find all TypeScript/JavaScript files in src
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read file; do
    # Skip node_modules and build directories
    if [[ $file == *"node_modules"* ]] || [[ $file == *"dist"* ]] || [[ $file == *"build"* ]]; then
        continue
    fi

    # Check if file contains console statements
    if grep -q "console\." "$file"; then
        echo "  📝 Processing: $file"

        # Add logger import if file has console statements but no logger import
        if ! grep -q "import.*logger.*from.*utils/logger" "$file"; then
            # Find the last import statement line number
            last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)

            if [ ! -z "$last_import" ]; then
                # Add logger import after last import
                sed -i "${last_import}a import { logger } from '../utils/logger';" "$file" 2>/dev/null || \
                sed -i "" "${last_import}a\\
import { logger } from '../utils/logger';" "$file" 2>/dev/null
            fi
        fi

        # Replace console statements with logger equivalents
        # Use both GNU sed and BSD sed syntax for compatibility
        sed -i 's/console\.log(/logger.log(/g' "$file" 2>/dev/null || \
        sed -i '' 's/console\.log(/logger.log(/g' "$file"

        sed -i 's/console\.error(/logger.error(/g' "$file" 2>/dev/null || \
        sed -i '' 's/console\.error(/logger.error(/g' "$file"

        sed -i 's/console\.warn(/logger.warn(/g' "$file" 2>/dev/null || \
        sed -i '' 's/console\.warn(/logger.warn(/g' "$file"

        sed -i 's/console\.info(/logger.info(/g' "$file" 2>/dev/null || \
        sed -i '' 's/console\.info(/logger.info(/g' "$file"

        sed -i 's/console\.debug(/logger.debug(/g' "$file" 2>/dev/null || \
        sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    fi
done

echo "✅ Done! All console.log statements have been replaced with logger"
echo "⚠️  Note: You may need to manually fix import paths in some files"
echo "💡 Logger only outputs in development mode (__DEV__)"
