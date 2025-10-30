# MemoryVerse Scripts

Utility scripts for MemoryVerse development and data processing.

## Bible Dataset Processing

### process-bible-dataset.js

This script processes Bible CSV files from Kaggle and generates SQL INSERT statements for populating the Supabase database.

#### Step 1: Download the Dataset

1. Go to https://www.kaggle.com/datasets/oswinrh/bible/data
2. Click "Download" (you may need to create a free Kaggle account)
3. Extract the ZIP file - you'll get multiple CSV files for different translations:
   - `t_asv.csv` - American Standard Version
   - `t_kjv.csv` - King James Version
   - `t_niv.csv` - New International Version (if available)
   - `t_web.csv` - World English Bible
   - etc.

#### Step 2: Run the Processing Script

```bash
# Process KJV translation
node scripts/process-bible-dataset.js path/to/t_kjv.csv KJV

# Process NIV translation (if you have the file)
node scripts/process-bible-dataset.js path/to/t_niv.csv NIV

# Process multiple translations
node scripts/process-bible-dataset.js t_kjv.csv KJV
node scripts/process-bible-dataset.js t_asv.csv ASV
node scripts/process-bible-dataset.js t_web.csv WEB
```

#### Step 3: Import into Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the generated SQL file (e.g., `supabase/bible_verses_kjv.sql`)
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

**Note:** Large SQL files may take 1-2 minutes to execute.

### What the Script Does

The script automatically:

1. **Reads CSV data** - Parses Bible verses with book, chapter, verse number, and text
2. **Categorizes verses** - Uses keyword matching to assign categories:
   - `promise` - Verses about God's promises and covenants
   - `comfort` - Comforting and consoling verses
   - `encouragement` - Verses about strength and courage
   - `wisdom` - Wisdom and understanding
   - `love` - God's love and compassion
   - `faith` - Verses about faith and trust
   - `hope` - Hope and patient waiting
   - `prayer` - Prayer and intercession
   - `praise` - Worship and thanksgiving
   - `salvation` - Salvation and redemption
   - `guidance` - Direction and leading
   - `joy` - Joy and gladness
   - `forgiveness` - Forgiveness and cleansing
   - `obedience` - Obedience to God's commands
   - `victory` - Overcoming and triumph
   - `protection` - God's protection and defense
   - `provision` - God's provision and care
   - `healing` - Healing and restoration
   - `justice` - Justice and righteousness
   - `humility` - Humility and servanthood

3. **Assigns difficulty** - Based on verse length:
   - Level 1: < 50 characters (very easy)
   - Level 2: 50-100 characters (easy)
   - Level 3: 100-150 characters (medium)
   - Level 4: 150-200 characters (hard)
   - Level 5: 200+ characters (very hard)

4. **Generates SQL** - Creates properly formatted INSERT statements with:
   - Escaped single quotes
   - NULL values for uncategorized verses
   - Conflict handling (ON CONFLICT DO NOTHING)
   - Batch processing for performance

### Output

The script generates SQL files in `supabase/` directory:
- `bible_verses_kjv.sql` - King James Version
- `bible_verses_niv.sql` - New International Version
- `bible_verses_asv.sql` - American Standard Version
- etc.

Each file contains:
- Header with translation info
- INSERT statements with all ~31,000 verses
- Conflict handling to prevent duplicates

### Customization

To modify categories or difficulty calculation:

1. Edit `categoryKeywords` object to add/change categories
2. Edit `calculateDifficulty()` function to adjust difficulty thresholds
3. Run the script again to regenerate SQL

### Troubleshooting

**Error: File not found**
- Make sure you've downloaded the CSV from Kaggle
- Check the file path is correct
- Use absolute or relative path to the CSV

**Error: Invalid format**
- Ensure CSV has columns: Book, Chapter, Verse, Text
- Check CSV isn't corrupted
- Try a different translation file

**Supabase SQL timeout**
- Large SQL files (31k+ verses) may take time
- Wait for completion (1-2 minutes)
- Check Supabase logs if errors occur

**Duplicate key violations**
- Script uses `ON CONFLICT DO NOTHING`
- Safe to run multiple times
- Duplicates are automatically skipped

## AI Context Generation

### generate-contexts.ts

Generates AI-powered spiritual context for Bible verses using OpenAI or Anthropic (Claude).

#### Setup

1. **Apply database migration:**
   ```sql
   -- Run in Supabase SQL Editor
   supabase/migrations/002_add_context_columns.sql
   ```

2. **Configure API key in `.env`:**
   ```bash
   # Choose provider
   EXPO_PUBLIC_AI_PROVIDER=anthropic  # or 'openai'

   # Add your API key
   EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
   # OR
   EXPO_PUBLIC_OPENAI_API_KEY=sk-...
   ```

3. **Get API keys:**
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys

#### Usage

```bash
# Generate context for 100 verses
npx ts-node scripts/generate-contexts.ts --limit 100

# Use OpenAI instead of Claude
npx ts-node scripts/generate-contexts.ts --limit 100 --provider openai

# Show statistics only
npx ts-node scripts/generate-contexts.ts --stats

# Show help
npx ts-node scripts/generate-contexts.ts --help
```

#### Options

- `--limit, -l <number>` - Max verses to process (default: 100)
- `--provider, -p <string>` - AI provider: 'openai' or 'anthropic' (default: anthropic)
- `--stats, -s` - Show statistics only
- `--help, -h` - Show help

#### Cost Estimates

**gpt-4o-mini (Recommended):**
- ~$0.0003 per verse
- 1,000 verses: ~$0.30
- 31,000 verses (full KJV): ~$9

**claude-3-5-sonnet:**
- ~$0.0033 per verse
- 1,000 verses: ~$3.30
- 31,000 verses (full KJV): ~$102

#### Time Estimates (50 RPM limit)

- 100 verses: ~2 minutes
- 500 verses: ~10 minutes
- 1,000 verses: ~20 minutes
- 5,000 verses: ~100 minutes

#### Features

- ✅ On-demand context generation in-app
- ✅ Batch processing for pre-population
- ✅ Rate limiting (50 requests/min default)
- ✅ Automatic retry with exponential backoff
- ✅ Progress tracking
- ✅ Error handling and logging
- ✅ Statistics reporting

#### Example Output

**Verse:** John 3:16
**Generated Context:**
> "This is the most famous verse in Scripture, summarizing the entire gospel message. It reveals God's immense love that motivated Him to sacrifice His Son, offering eternal life to all who believe. Remember this verse as the foundation of your faith—God's love, Christ's sacrifice, and the gift of salvation."

#### Documentation

For detailed information:
- **Full guide:** `docs/CONTEXT_GENERATION.md`
- **Quick start:** `docs/QUICK_START_CONTEXT.md`

## Asset Generation

### generate-assets.js

Generates placeholder SVG icons for the app.

```bash
node scripts/generate-assets.js
```

Creates:
- `assets/icon.svg` - App icon (1024x1024)
- `assets/adaptive-icon.svg` - Android adaptive icon
- `assets/splash.svg` - Splash screen
- `assets/favicon.svg` - Web favicon

**Note:** These are SVG placeholders. For production:
1. Design proper icons with the biblical theme
2. Convert to PNG at required sizes
3. Replace SVG files with PNG files

## Need Help?

- Check the main README.md for project setup
- Supabase setup: `supabase/README.md`
- AI Context: `docs/CONTEXT_GENERATION.md`
- Create an issue on GitHub
