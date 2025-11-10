# Verse Quality System Setup

This guide helps you filter verses to show only meaningful, memorable verses for daily devotionals and memorization.

---

## Step 1: Add Quality Fields to verses Table

Run this SQL in Supabase SQL Editor:

```sql
-- Add verse quality fields
ALTER TABLE verses
ADD COLUMN IF NOT EXISTS is_memorable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS memorization_difficulty TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS verse_category TEXT DEFAULT 'general';

-- Add index for filtering memorable verses
CREATE INDEX IF NOT EXISTS idx_verses_memorable ON verses(is_memorable) WHERE is_memorable = true;
CREATE INDEX IF NOT EXISTS idx_verses_category ON verses(verse_category);
```

---

## Step 2: Mark Low-Quality Verses as Not Memorable

Run this SQL to automatically filter out genealogies, itineraries, and other non-devotional verses:

```sql
-- Mark genealogies as not memorable
UPDATE verses
SET is_memorable = false,
    verse_category = 'genealogy'
WHERE
  -- Genealogy indicators
  text ILIKE '%begat%' OR
  text ILIKE '%son of%' OR
  text ILIKE '%daughter of%' OR
  text ILIKE '%genealogy%' OR
  text ILIKE '%generations of%' OR
  -- Multiple names in one verse (likely genealogy)
  (text ~ '([A-Z][a-z]+,?\s+){5,}');

-- Mark travel itineraries as not memorable
UPDATE verses
SET is_memorable = false,
    verse_category = 'itinerary'
WHERE
  text ILIKE '%departed from%' OR
  text ILIKE '%encamped at%' OR
  text ILIKE '%removed from%' OR
  text ILIKE '%pitched in%' OR
  text ILIKE '%went from%';

-- Mark ceremonial law as medium priority
UPDATE verses
SET verse_category = 'law',
    memorization_difficulty = 'hard'
WHERE
  (book IN ('Leviticus', 'Numbers', 'Deuteronomy') AND
   (text ILIKE '%cubit%' OR
    text ILIKE '%ephah%' OR
    text ILIKE '%shekel%' OR
    text ILIKE '%offering%' OR
    text ILIKE '%sacrifice%'));

-- Mark very short verses (likely fragments) as not memorable
UPDATE verses
SET is_memorable = false,
    verse_category = 'fragment'
WHERE LENGTH(text) < 20;

-- Mark wisdom literature as highly memorable
UPDATE verses
SET is_memorable = true,
    verse_category = 'wisdom',
    memorization_difficulty = 'easy'
WHERE
  book IN ('Proverbs', 'Ecclesiastes', 'Job', 'Psalms', 'Song of Solomon') AND
  is_memorable = true;

-- Mark promises as highly memorable
UPDATE verses
SET verse_category = 'promise',
    memorization_difficulty = 'easy'
WHERE
  text ILIKE '%I will%' OR
  text ILIKE '%will never%' OR
  text ILIKE '%promise%' OR
  text ILIKE '%covenant%';

-- Mark commands as memorable
UPDATE verses
SET verse_category = 'command',
    memorization_difficulty = 'easy'
WHERE
  (text ILIKE '%thou shalt%' OR
   text ILIKE '%ye shall%' OR
   text ILIKE '%let us%' OR
   text ILIKE '%do not%' OR
   text ILIKE '%love one another%') AND
  book NOT IN ('Leviticus', 'Numbers');

-- Mark praise/worship as memorable
UPDATE verses
SET verse_category = 'praise',
    memorization_difficulty = 'easy'
WHERE
  text ILIKE '%praise%' OR
  text ILIKE '%glory%' OR
  text ILIKE '%worship%' OR
  text ILIKE '%hallelujah%' OR
  text ILIKE '%blessed%';

-- Mark gospel verses as highly memorable
UPDATE verses
SET is_memorable = true,
    verse_category = 'gospel',
    memorization_difficulty = 'easy'
WHERE
  book IN ('Matthew', 'Mark', 'Luke', 'John') AND
  (text ILIKE '%Jesus%' OR
   text ILIKE '%kingdom of%' OR
   text ILIKE '%eternal life%' OR
   text ILIKE '%believe%' OR
   text ILIKE '%saved%');
```

---

## Step 3: Verify the Results

Check how many verses are marked as memorable:

```sql
-- Count verses by memorability
SELECT
  is_memorable,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM verses WHERE translation = 'KJV'), 2) as percentage
FROM verses
WHERE translation = 'KJV'
GROUP BY is_memorable;

-- Count verses by category
SELECT
  verse_category,
  COUNT(*) as count
FROM verses
WHERE translation = 'KJV'
GROUP BY verse_category
ORDER BY count DESC;

-- Sample some non-memorable verses to verify filtering works
SELECT book, chapter, verse_number, verse_category, LEFT(text, 80) as preview
FROM verses
WHERE translation = 'KJV' AND is_memorable = false
LIMIT 20;
```

---

## Step 4: Update App to Use Quality Filters

The app already uses quality filtering! Check these files:
- `src/services/verseService.ts` - Random verse selection
- `src/screens/HomeScreen.tsx` - Today's verse

### Example: Filter Random Verses

```typescript
// In verseService.ts, update getRandomVerse to filter memorable verses:
const { data, error } = await supabase
  .from('verses')
  .select('*')
  .eq('translation', translation)
  .eq('is_memorable', true) // Only get memorable verses
  .limit(100); // Get a pool of verses

// Then randomly select one from the pool
const randomIndex = Math.floor(Math.random() * data.length);
return data[randomIndex];
```

---

## Categories Explained

- **`general`** - Default category for all verses
- **`wisdom`** - Proverbs, wisdom literature, life principles
- **`promise`** - God's promises and covenants
- **`command`** - Commandments and instructions
- **`praise`** - Worship, praise, and thanksgiving
- **`gospel`** - Gospel message, salvation, Jesus' teachings
- **`narrative`** - Story verses
- **`prophecy`** - Prophetic verses
- **`law`** - Ceremonial/legal instructions (lower priority)
- **`genealogy`** - Family trees (not memorable)
- **`itinerary`** - Travel logs (not memorable)
- **`fragment`** - Very short verses, fragments (not memorable)

---

## Memorization Difficulty

- **`easy`** - Short, clear, powerful verses
- **`medium`** - Standard length, moderate complexity
- **`hard`** - Long verses, complex language, legal/ceremonial

---

## Fine-Tuning (Optional)

You can manually mark specific verses:

```sql
-- Mark a specific favorite verse as memorable
UPDATE verses
SET is_memorable = true,
    verse_category = 'promise',
    memorization_difficulty = 'easy'
WHERE
  book = 'Jeremiah' AND
  chapter = 29 AND
  verse_number = 11 AND
  translation = 'KJV';

-- Find and mark all verses containing "love"
UPDATE verses
SET verse_category = 'love'
WHERE
  text ILIKE '%love%' AND
  is_memorable = true AND
  translation = 'KJV';
```

---

## Result

After running these queries, your app will:
- ✅ Show meaningful verses for daily devotionals
- ✅ Filter out genealogies and itineraries
- ✅ Prioritize wisdom, promises, and gospel verses
- ✅ Provide better memorization experience

Approximately 60-70% of verses will be marked as memorable, filtering out the less meaningful content!
