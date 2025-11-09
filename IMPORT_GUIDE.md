# Importing Bible Translations to Supabase

This guide shows you how to import all 7 Bible translations directly to your Supabase database.

## Why Direct Import?

The Supabase dashboard has API limits that prevent importing large SQL files. This script connects directly to your PostgreSQL database to bypass those limits.

## Prerequisites

✅ Already installed:
- Node.js
- `postgres` package
- `dotenv` package

## Step-by-Step Guide

### Step 1: Get Your Database Connection String

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **Project Settings** → **Database**
3. Scroll to **Connection String**
4. Select **Direct connection** (not Session Pooler)
5. Copy the connection string

It should look like:
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

### Step 2: Create Your .env File

1. Copy the example file:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and add your connection string:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```

   **Important:** Replace `YOUR_PASSWORD` with your actual database password

### Step 3: Reset Your Database Password (if needed)

If you don't know your database password:

1. Go to **Project Settings** → **Database**
2. Scroll to **Reset database password**
3. Enter a new password
4. Update your `.env` file with the new password

### Step 4: Run the Import Script

```bash
node scripts/import-to-supabase.js
```

The script will:
1. Test the database connection
2. Import all 7 SQL files sequentially
3. Show progress for each translation
4. Verify the import was successful

### Expected Output

```
🚀 Supabase Bible Importer

🔌 Connecting to: postgresql://postgres:****@db.xxxxx.supabase.co:5432/postgres

🔍 Testing connection...
✅ Connection successful!

Found 7 SQL file(s) to import:

  📄 ASV: bible_verses_asv.sql
  📄 BBE: bible_verses_bbe.sql
  📄 DBY: bible_verses_dby.sql
  📄 KJV: bible_verses_kjv.sql
  📄 WBT: bible_verses_wbt.sql
  📄 WEB: bible_verses_web.sql
  📄 YLT: bible_verses_ylt.sql

────────────────────────────────────────────────────────────

📖 Importing ASV...
   File: bible_verses_asv.sql
   📄 File size: 5.32 MB
   📊 Estimated verses: ~31,000
   ⏳ Executing SQL...
   ✅ Import completed in 8.5s

────────────────────────────────────────────────────────────

... (repeats for each translation)

🎉 Import Complete!

✅ Successfully imported:
   ASV: 8.5s
   BBE: 8.7s
   DBY: 8.3s
   KJV: 8.6s
   WBT: 8.4s
   WEB: 8.2s
   YLT: 8.8s

📊 Verifying database...

Verse counts by translation:
   ASV: 31,103 verses
   BBE: 31,103 verses
   DBY: 31,099 verses
   KJV: 31,103 verses
   WBT: 31,102 verses
   WEB: 31,102 verses
   YLT: 31,103 verses

📖 Total verses in database: 217,715

✅ All done!
```

## Troubleshooting

### Error: "DATABASE_URL not found"
- Make sure you created a `.env` file (not `.env.example`)
- Check that `DATABASE_URL` is set in your `.env` file

### Error: "Connection failed"
Possible causes:
1. **Wrong password** - Reset your database password in Supabase dashboard
2. **IPv4 network issue** - You may need to use Session Pooler instead:
   - Change connection string to use port `6543` instead of `5432`
   - Example: `postgresql://postgres:password@db.xxxxx.supabase.co:6543/postgres`
3. **Firewall blocking** - Check if your firewall allows PostgreSQL connections

### Error: "postgres package not found"
Run:
```bash
npm install postgres dotenv
```

### Import is slow
This is normal! Each translation takes ~8-10 seconds to import. Total time for all 7 translations is about 1 minute.

## Verify Your Import

After import completes, you can verify in the Supabase dashboard:

1. Go to **Table Editor**
2. Select the `verses` table
3. You should see 217,715 total rows
4. Filter by `translation` to see each translation

Or run this SQL query in the SQL Editor:

```sql
SELECT translation, COUNT(*) as verse_count
FROM public.verses
GROUP BY translation
ORDER BY translation;
```

## What Gets Imported?

Each verse includes:
- **book** - Bible book name (e.g., "Genesis", "John")
- **chapter** - Chapter number
- **verse** - Verse number
- **text** - The verse text
- **translation** - Translation code (ASV, KJV, WEB, etc.)
- **category** - Semantic category (promise, comfort, wisdom, etc.)
- **difficulty_level** - 1-5 based on verse length

## Next Steps

After importing:
1. Update your app's translation picker to show all 7 translations
2. Test verse retrieval in your app
3. Users can now choose their preferred translation!

## Security Note

**NEVER commit your `.env` file to version control!**

The `.env` file contains your database password and should remain private.

---

Need help? Check the [README_TRANSLATIONS.md](README_TRANSLATIONS.md) for more details about the translations.
