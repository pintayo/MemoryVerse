# Bible Translations for MemoryVerse

This document describes the Bible translations available in your MemoryVerse app and how they were processed.

## Available Translations

Your app now has **7 complete public domain Bible translations** ready to import:

| Code | Translation Name | Year | Verses | SQL File Size |
|------|-----------------|------|---------|--------------|
| **KJV** | King James Version | 1611 | 31,103 | 5.30 MB |
| **ASV** | American Standard Version | 1901 | 31,103 | 5.32 MB |
| **BBE** | Bible in Basic English | 1965 | 31,103 | 5.34 MB |
| **DBY** | Darby English Bible | 1890 | 31,099 | 5.27 MB |
| **WBT** | Webster's Bible Translation | 1833 | 31,102 | 5.28 MB |
| **WEB** | World English Bible | 2000 | 31,102 | 5.22 MB |
| **YLT** | Young's Literal Translation | 1898 | 31,103 | 5.34 MB |

**Total: 217,715 verses across 7 translations**

## Translation Characteristics

### Best for Beginners
- **BBE** (Bible in Basic English) - Uses simple vocabulary (~850 basic words)
- **WEB** (World English Bible) - Modern English, easy to read

### Traditional & Historic
- **KJV** (King James Version) - Classic English, poetic language
- **ASV** (American Standard Version) - Scholarly, accurate
- **WBT** (Webster's Bible) - American revision of KJV

### Literal Translations
- **YLT** (Young's Literal Translation) - Word-for-word translation
- **DBY** (Darby English Bible) - Literal, preserves Hebrew/Greek structure

## Database Schema

Each verse has been enriched with:

- **Category** (24 categories):
  - promise, comfort, encouragement, wisdom, love, faith, hope
  - prayer, praise, salvation, guidance, joy, forgiveness
  - obedience, victory, protection, provision, healing
  - justice, humility, creation, holiness, repentance, presence

- **Difficulty Level** (1-5):
  - Level 1 (Very Easy): < 50 characters
  - Level 2 (Easy): 50-100 characters
  - Level 3 (Medium): 100-150 characters
  - Level 4 (Hard): 150-200 characters
  - Level 5 (Very Hard): > 200 characters

## Import Instructions

### Step 1: Open Supabase SQL Editor
1. Log into your Supabase dashboard
2. Go to SQL Editor

### Step 2: Import Each Translation
For each SQL file in the `supabase/` directory:

1. Open the file (e.g., `bible_verses_kjv.sql`)
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" (takes ~1-2 minutes per file)

### Step 3: Verify Import
Run this query to check your verses:

```sql
SELECT translation, COUNT(*) as verse_count
FROM public.verses
GROUP BY translation
ORDER BY translation;
```

Expected results:
```
ASV  | 31,103
BBE  | 31,103
DBY  | 31,099
KJV  | 31,103
WBT  | 31,102
WEB  | 31,102
YLT  | 31,103
```

## Statistics

### Category Distribution (Average)
- ~22,000 verses categorized (72%)
- ~9,000 verses uncategorized (28%)

### Difficulty Distribution (Average)
- Level 1 (Very Easy): ~900 verses (3%)
- Level 2 (Easy): ~9,800 verses (31%)
- Level 3 (Medium): ~10,100 verses (32%)
- Level 4 (Hard): ~6,400 verses (21%)
- Level 5 (Very Hard): ~3,900 verses (13%)

## How It Was Built

### 1. Source Data
Downloaded from [Kaggle Bible Dataset](https://www.kaggle.com/datasets/oswinrh/bible/data)

### 2. Processing Pipeline

```
CSV Files (t_*.csv)
    ↓
convert-csv-to-json.js → JSON Files (bible_*.json)
    ↓
process-bible-dataset.js → SQL Files (bible_verses_*.sql)
    ↓
Supabase Import → Database
```

### 3. Scripts Used

- **`convert-csv-to-json.js`** - Converts Kaggle CSV files to JSON format
- **`process-bible-dataset.js`** - Adds categories, difficulty, generates SQL
- **`download-bible-translations.js`** - Helper for finding more translations

### 4. Features

✅ **Duplicate verse consolidation** - WEB translation had split verses
✅ **24 semantic categories** - Based on keyword matching
✅ **5 difficulty levels** - Based on verse length
✅ **Batch SQL inserts** - Optimized for fast import
✅ **Conflict handling** - `ON CONFLICT DO NOTHING` prevents duplicates

## Adding More Translations

To add more translations in the future:

1. Download CSV files from Kaggle or other sources
2. Place in `assets/translations/` directory
3. Run: `node scripts/convert-csv-to-json.js`
4. Run: `node scripts/process-bible-dataset.js`
5. Import the generated SQL files

## License

All translations included are **public domain** and free to use without restrictions.

---

**Built with:** Node.js
**Database:** PostgreSQL (Supabase)
**Format:** JSON → SQL
**Total Processing Time:** ~2 minutes for all 7 translations
