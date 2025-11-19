#!/bin/bash

# =====================================================
# MEMORYVERSE CODE CLEANUP ANALYZER
# Helps identify unused files and services
# =====================================================

echo "🔍 MEMORYVERSE CODE CLEANUP ANALYSIS"
echo "====================================="
echo ""

# Change to project root
cd /home/user/MemoryVerse

echo "📊 SUMMARY OF PROJECT FILES"
echo "-----------------------------------"
echo "Total TypeScript files: $(find src -name '*.ts' -o -name '*.tsx' | wc -l)"
echo "Total service files: $(find src/services -name '*.ts' | wc -l)"
echo "Total screen files: $(find src/screens -name '*.tsx' | wc -l)"
echo "Total component files: $(find src/components -name '*.tsx' -o -name '*.ts' | wc -l)"
echo ""

echo "🔍 POTENTIALLY UNUSED SERVICES"
echo "-----------------------------------"
echo "Services that might not be imported anywhere:"
echo ""

# Check each service file to see if it's imported
for service in src/services/*.ts; do
    basename_service=$(basename "$service")
    service_name="${basename_service%.ts}"

    # Skip index.ts
    if [ "$service_name" = "index" ]; then
        continue
    fi

    # Search for imports of this service
    import_count=$(grep -r "from.*['\"].*services.*${service_name}" src --include="*.ts" --include="*.tsx" | grep -v "^src/services" | wc -l)

    if [ "$import_count" -eq 0 ]; then
        echo "⚠️  $basename_service - NOT IMPORTED (candidate for removal)"
    fi
done
echo ""

echo "🔍 POTENTIALLY UNUSED SCREENS"
echo "-----------------------------------"
echo "Screens that might not be in navigation:"
echo ""

# Check each screen file
for screen in src/screens/*.tsx; do
    basename_screen=$(basename "$screen")
    screen_name="${basename_screen%.tsx}"

    # Search for screen name in navigation files
    nav_count=$(grep -r "$screen_name" src/navigation --include="*.ts" --include="*.tsx" | wc -l)

    if [ "$nav_count" -eq 0 ]; then
        echo "⚠️  $basename_screen - NOT IN NAVIGATION (candidate for removal)"
    fi
done
echo ""

echo "🔍 DUPLICATE SERVICE FILES"
echo "-----------------------------------"
# Check for similar named services
if [ -f "src/services/achievementService.ts" ] && [ -f "src/services/achievementsService.ts" ]; then
    echo "⚠️  Both achievementService.ts and achievementsService.ts exist - likely duplicates"
fi

if [ -f "src/services/guestModeService.ts" ] && [ -f "src/services/guestProgressService.ts" ]; then
    echo "⚠️  Both guestModeService.ts and guestProgressService.ts exist - review for consolidation"
fi

if [ -f "src/services/analyticsService.ts" ] && [ -f "src/services/advancedAnalyticsService.ts" ]; then
    echo "⚠️  Both analyticsService.ts and advancedAnalyticsService.ts exist - review if both needed"
fi
echo ""

echo "🔍 OLD/TEST FILES"
echo "-----------------------------------"
# Check for test or old files
find supabase -name "*test*.sql" -o -name "*old*.sql" -o -name "*backup*.sql" 2>/dev/null | while read file; do
    echo "⚠️  $file - Test/backup file (candidate for removal)"
done
echo ""

echo "🔍 LARGE FILES (>500 lines)"
echo "-----------------------------------"
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt 500 ]; then
        echo "📄 $file - $lines lines (consider refactoring if too complex)"
    fi
done | sort -t'-' -k2 -rn | head -10
echo ""

echo "🔍 TODO COMMENTS"
echo "-----------------------------------"
echo "Number of TODO comments in code: $(grep -r "TODO" src --include="*.ts" --include="*.tsx" | wc -l)"
echo ""
grep -r "TODO" src --include="*.ts" --include="*.tsx" -n | head -20
echo ""
echo "(showing first 20, run manually for full list)"
echo ""

echo "🔍 CONSOLE.LOG STATEMENTS"
echo "-----------------------------------"
echo "Number of console.log statements: $(grep -r "console\.log" src --include="*.ts" --include="*.tsx" | wc -l)"
echo "(Should be replaced with logger.log)"
echo ""

echo "✅ ANALYSIS COMPLETE"
echo "====================================="
echo ""
echo "NEXT STEPS:"
echo "1. Review the files marked with ⚠️ above"
echo "2. Verify they're truly unused by checking imports/navigation"
echo "3. Delete or comment out unused code"
echo "4. Create backup branch before deleting: git checkout -b cleanup-backup"
echo "5. Run 'npm run build' after cleanup to ensure nothing breaks"
echo ""
