# Database Migrations

This folder contains incremental database migration files for updating existing databases.

## For New Installations

If you're setting up the database for the first time, **use the master setup file instead**:

```bash
# Run this in Supabase SQL Editor
supabase/complete-setup.sql
```

This file contains the complete database schema with all migrations already applied.

## For Existing Installations

If you already have a database set up and need to apply new updates, run the migration files in order:

1. `002_add_context_columns.sql` - Adds AI context to verses
2. `003_add_verses_update_policy.sql` - Adds update policy for verses
3. `004_add_chapter_contexts.sql` - Creates chapter contexts table
4. `005_fix_chapter_contexts_schema.sql` - Fixes chapter contexts schema
5. `006_add_daily_verses.sql` - Adds daily verses and usage limits
6. `007_add_subscription_tier.sql` - Adds subscription tier tracking
7. `008_add_usage_tracking.sql` - Adds prayer abuse prevention tracking

## Migration Files

**Note:** Migrations 002-007 are now consolidated in `complete-setup.sql` and can be safely deleted if you're using the master file for fresh installations.

Only migration `008_add_usage_tracking.sql` is newer than the consolidated file.

## How to Apply Migrations

### Using Supabase CLI:

```bash
supabase db push
```

### Manually (Supabase Dashboard):

1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the migration file contents
3. Click "Run"

## Best Practices

- **Fresh Install:** Use `complete-setup.sql` (includes all migrations)
- **Existing Database:** Run new migrations incrementally in order
- **Always backup** before running migrations:
  ```bash
  ./scripts/backup-database.sh
  ```
