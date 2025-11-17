# Files to Clean Up

The following files can be safely deleted as they've been consolidated into the new documentation structure.

---

## ✅ **Keep These** (New Organization)

- `STATUS.md` - Current status, todos, priorities
- `FEATURES.md` - Feature roadmap and wishlist
- `DOCUMENTATION.md` - Technical documentation
- `README.md` - Main project readme
- `docs/REVENUECAT_SETUP.md` - RevenueCat setup guide (still relevant)
- `docs/FIREBASE_SETUP.md` - Firebase setup guide (still relevant)
- `docs/SENTRY_TRACKING.md` - Sentry setup guide (still relevant)

---

## 🗑️ **Can Delete** (Redundant/Outdated)

### Root Level
- `VERSE_QUALITY_SETUP.md` - Outdated, context generation is done
- `TECHNICAL_UPDATES.md` - Outdated changelog
- `TESTING.md` - Covered in STATUS.md
- `SETUP_GUIDE.md` - Outdated, covered in DOCUMENTATION.md
- `README_TRANSLATIONS.md` - Outdated, translations not yet implemented
- `PROJECT_STATUS.md` - Replaced by STATUS.md
- `PRODUCTION_GUIDE.md` - Covered in DOCUMENTATION.md
- `PRODUCTION_SETUP.md` - Covered in DOCUMENTATION.md
- `IMPORT_GUIDE.md` - One-time task, already done
- `FEATURE_FLAGS_GUIDE.md` - Covered in DOCUMENTATION.md
- `BACKLOG.md` - Replaced by FEATURES.md

### Docs Folder
- `docs/SETUP_ICON_AND_BUILD.md` - One-time setup, already done
- `docs/PRE_LAUNCH_TESTING_GUIDE.md` - Covered in STATUS.md
- `docs/IMMEDIATE_NEXT_STEPS.md` - Covered in STATUS.md
- `docs/GROWTH_STRATEGY.md` - Not relevant yet (pre-launch)
- `docs/CONTEXT_GENERATION.md` - One-time setup, already done
- `docs/APP_STORE_PREPARATION.md` - Future task, covered in DOCUMENTATION.md

### Scripts Folder
- `scripts/README.md` - Self-explanatory scripts
- `scripts/BACKUP_README.md` - Covered in script comments

### Supabase Migrations (Consolidated)
- `supabase/migrations/002_add_context_columns.sql` - Consolidated into complete-setup.sql
- `supabase/migrations/003_add_verses_update_policy.sql` - Consolidated into complete-setup.sql
- `supabase/migrations/004_add_chapter_contexts.sql` - Consolidated into complete-setup.sql
- `supabase/migrations/005_fix_chapter_contexts_schema.sql` - Consolidated into complete-setup.sql
- `supabase/migrations/006_add_daily_verses.sql` - Consolidated into complete-setup.sql
- `supabase/migrations/007_add_subscription_tier.sql` - Consolidated into complete-setup.sql
- `supabase/migrations/008_add_usage_tracking.sql` - Consolidated into complete-setup.sql
- `supabase/migrations/README.md` - Instructions now in DOCUMENTATION.md

### Other
- `supabase/README.md` - Covered in DOCUMENTATION.md
- `assets/README.md` - Not needed

### Shell Scripts (Keep)
- `start-ios-simple.sh` - Still useful
- `setup-ios.sh` - Still useful
- `nuclear-reset.sh` - Still useful
- `scripts/backup-database.sh` - Still useful
- `scripts/restore-database.sh` - Still useful

---

## 📋 **To Delete** (Command)

Run this command to remove all redundant files:

```bash
rm -f \
  VERSE_QUALITY_SETUP.md \
  TECHNICAL_UPDATES.md \
  TESTING.md \
  SETUP_GUIDE.md \
  README_TRANSLATIONS.md \
  PROJECT_STATUS.md \
  PRODUCTION_GUIDE.md \
  PRODUCTION_SETUP.md \
  IMPORT_GUIDE.md \
  FEATURE_FLAGS_GUIDE.md \
  BACKLOG.md \
  docs/SETUP_ICON_AND_BUILD.md \
  docs/PRE_LAUNCH_TESTING_GUIDE.md \
  docs/IMMEDIATE_NEXT_STEPS.md \
  docs/GROWTH_STRATEGY.md \
  docs/CONTEXT_GENERATION.md \
  docs/APP_STORE_PREPARATION.md \
  scripts/README.md \
  scripts/BACKUP_README.md \
  supabase/README.md \
  assets/README.md \
  supabase/migrations/002_add_context_columns.sql \
  supabase/migrations/003_add_verses_update_policy.sql \
  supabase/migrations/004_add_chapter_contexts.sql \
  supabase/migrations/005_fix_chapter_contexts_schema.sql \
  supabase/migrations/006_add_daily_verses.sql \
  supabase/migrations/007_add_subscription_tier.sql \
  supabase/migrations/008_add_usage_tracking.sql \
  supabase/migrations/README.md

echo "✅ Cleanup complete! Old files removed."
```

---

## 📝 **Summary**

**Documentation Files:**
- **Before:** 24 scattered MD files
- **After:** 6 organized MD files

**Database Migrations:**
- **Before:** 8 separate migration files + README
- **After:** 1 consolidated `complete-setup.sql`

**Organized Structure:**
- `STATUS.md` - What's done, what's next
- `FEATURES.md` - Feature wishlist
- `DOCUMENTATION.md` - Technical docs
- `README.md` - Project overview
- `docs/REVENUECAT_SETUP.md` - RevenueCat guide
- `docs/FIREBASE_SETUP.md` - Firebase guide
- `docs/SENTRY_TRACKING.md` - Sentry guide
- `supabase/complete-setup.sql` - Single comprehensive database setup

All information consolidated, no data lost!
