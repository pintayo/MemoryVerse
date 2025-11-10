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
-- ============================================================================
-- PART 1: Mark verses as NOT MEMORABLE
-- ============================================================================

-- Mark genealogies as not memorable (EXPANDED)
UPDATE verses
SET is_memorable = false,
    verse_category = 'genealogy'
WHERE
  translation = 'KJV' AND
  (
    -- Genealogy indicators
    text ILIKE '%begat%' OR
    text ILIKE '%son of%' OR
    text ILIKE '%sons of%' OR
    text ILIKE '%daughter of%' OR
    text ILIKE '%daughters of%' OR
    text ILIKE '%genealogy%' OR
    text ILIKE '%generations of%' OR
    text ILIKE '%father of%' OR
    text ILIKE '%born unto%' OR
    text ILIKE '%bare unto%' OR
    -- Multiple names in one verse (likely genealogy)
    (text ~ '([A-Z][a-z]+,?\s+){5,}') OR
    -- Specific genealogy books/chapters
    (book = '1 Chronicles' AND chapter IN (1,2,3,4,5,6,7,8,9)) OR
    (book = 'Genesis' AND chapter IN (5,10,11,36)) OR
    (book = 'Numbers' AND chapter IN (1,2,3,7,26))
  );

-- Mark travel itineraries as not memorable (EXPANDED)
UPDATE verses
SET is_memorable = false,
    verse_category = 'itinerary'
WHERE
  translation = 'KJV' AND
  (
    text ILIKE '%departed from%' OR
    text ILIKE '%encamped at%' OR
    text ILIKE '%encamped in%' OR
    text ILIKE '%encamped by%' OR
    text ILIKE '%removed from%' OR
    text ILIKE '%pitched in%' OR
    text ILIKE '%pitched by%' OR
    text ILIKE '%went from%' OR
    text ILIKE '%journeyed from%' OR
    text ILIKE '%came to%' AND text ILIKE '%and pitched%' OR
    -- Entire itinerary chapter
    (book = 'Numbers' AND chapter = 33)
  );

-- Mark ceremonial law as low priority (EXPANDED)
UPDATE verses
SET is_memorable = false,
    verse_category = 'law',
    memorization_difficulty = 'hard'
WHERE
  translation = 'KJV' AND
  (
    -- Measurement/ceremonial terms
    (book IN ('Exodus', 'Leviticus', 'Numbers', 'Deuteronomy') AND
     (text ILIKE '%cubit%' OR
      text ILIKE '%cubits%' OR
      text ILIKE '%ephah%' OR
      text ILIKE '%shekel%' OR
      text ILIKE '%shekels%' OR
      text ILIKE '%hin%' OR
      text ILIKE '%span%' OR
      text ILIKE '%offering%' AND text ILIKE '%burnt%' OR
      text ILIKE '%sacrifice%' AND text ILIKE '%altar%' OR
      text ILIKE '%unclean%' AND text ILIKE '%clean%' OR
      text ILIKE '%shall be unclean%' OR
      text ILIKE '%trespass offering%' OR
      text ILIKE '%sin offering%' OR
      text ILIKE '%meat offering%'))
  );

-- Mark very short verses (likely fragments) as not memorable
UPDATE verses
SET is_memorable = false,
    verse_category = 'fragment'
WHERE
  translation = 'KJV' AND
  LENGTH(text) < 20;

-- Mark lists and census data as not memorable (NEW)
UPDATE verses
SET is_memorable = false,
    verse_category = 'census'
WHERE
  translation = 'KJV' AND
  (
    text ~ '\d+,\d+' OR -- Contains numbers with commas
    text ILIKE '%thousand and%' AND text ILIKE '%hundred%' OR
    text ILIKE '%numbered them%' OR
    text ILIKE '%number of the%' AND text ILIKE '%thousand%'
  );

-- Mark obscure prophetic imagery as low priority (NEW)
UPDATE verses
SET is_memorable = false,
    verse_category = 'prophecy_obscure'
WHERE
  translation = 'KJV' AND
  (
    -- Ezekiel's detailed visions
    (book = 'Ezekiel' AND chapter >= 40 AND chapter <= 48) OR
    -- Revelation's detailed imagery (keep some memorable ones)
    (book = 'Revelation' AND
     (text ILIKE '%candlestick%' OR
      text ILIKE '%emerald%' OR
      text ILIKE '%sardine%' OR
      text ~ '([a-z]+\s+and\s+){4,}')) -- Multiple "and" clauses
  );

-- Mark repetitive temple construction details as not memorable (NEW)
UPDATE verses
SET is_memorable = false,
    verse_category = 'construction'
WHERE
  translation = 'KJV' AND
  (
    (book IN ('1 Kings', '2 Chronicles', 'Ezekiel') AND
     (text ILIKE '%cubits long%' OR
      text ILIKE '%cubits broad%' OR
      text ILIKE '%overlaid with gold%' OR
      text ILIKE '%made he%' AND text ILIKE '%cubits%'))
  );

-- Mark lists of nations/kings as not memorable (NEW)
UPDATE verses
SET is_memorable = false,
    verse_category = 'lists'
WHERE
  translation = 'KJV' AND
  (
    text ILIKE '%the Hittites, and the%' OR
    text ILIKE '%the Canaanites, and the%' OR
    text ILIKE '%and the Jebusites%' OR
    (text ~ 'the\s+[A-Z][a-z]+ites,\s+and\s+the\s+[A-Z][a-z]+ites')
  );


-- ============================================================================
-- PART 2: Mark verses as HIGHLY MEMORABLE
-- ============================================================================

-- Mark wisdom literature as highly memorable
UPDATE verses
SET is_memorable = true,
    verse_category = 'wisdom',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  book IN ('Proverbs', 'Ecclesiastes', 'Job', 'Psalms', 'Song of Solomon') AND
  LENGTH(text) >= 20 AND LENGTH(text) <= 300; -- Not too short or too long

-- Mark promises as highly memorable (EXPANDED)
UPDATE verses
SET is_memorable = true,
    verse_category = 'promise',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 20 AND
  (
    text ILIKE '%I will%' OR
    text ILIKE '%will never%' OR
    text ILIKE '%I will not%' OR
    text ILIKE '%promise%' OR
    text ILIKE '%covenant%' OR
    text ILIKE '%I am with you%' OR
    text ILIKE '%be with you%' OR
    text ILIKE '%I have loved you%' OR
    text ILIKE '%will be your God%'
  );

-- Mark commands as memorable (EXPANDED)
UPDATE verses
SET is_memorable = true,
    verse_category = 'command',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 20 AND
  LENGTH(text) <= 200 AND
  (
    text ILIKE '%thou shalt%' OR
    text ILIKE '%ye shall%' OR
    text ILIKE '%let us%' OR
    text ILIKE '%do not%' OR
    text ILIKE '%love one another%' OR
    text ILIKE '%fear not%' OR
    text ILIKE '%be not afraid%' OR
    text ILIKE '%trust in%' OR
    text ILIKE '%believe in%'
  ) AND
  book NOT IN ('Leviticus', 'Numbers', 'Deuteronomy');

-- Mark praise/worship as memorable (EXPANDED)
UPDATE verses
SET is_memorable = true,
    verse_category = 'praise',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 20 AND
  (
    text ILIKE '%praise%' OR
    text ILIKE '%glory%' OR
    text ILIKE '%worship%' OR
    text ILIKE '%hallelujah%' OR
    text ILIKE '%blessed%' OR
    text ILIKE '%rejoice%' OR
    text ILIKE '%give thanks%' OR
    text ILIKE '%sing unto%' OR
    text ILIKE '%magnify%'
  );

-- Mark gospel verses as highly memorable (EXPANDED)
UPDATE verses
SET is_memorable = true,
    verse_category = 'gospel',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 20 AND
  book IN ('Matthew', 'Mark', 'Luke', 'John') AND
  (
    text ILIKE '%Jesus%' OR
    text ILIKE '%kingdom of%' OR
    text ILIKE '%eternal life%' OR
    text ILIKE '%believe%' OR
    text ILIKE '%saved%' OR
    text ILIKE '%Son of God%' OR
    text ILIKE '%resurrection%' OR
    text ILIKE '%follow me%'
  );

-- Mark comfort/encouragement verses as highly memorable (NEW)
UPDATE verses
SET is_memorable = true,
    verse_category = 'comfort',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 20 AND LENGTH(text) <= 250 AND
  (
    text ILIKE '%comfort%' OR
    text ILIKE '%fear not%' OR
    text ILIKE '%be not afraid%' OR
    text ILIKE '%strength%' OR
    text ILIKE '%peace%' OR
    text ILIKE '%rest%' OR
    text ILIKE '%hope%' OR
    text ILIKE '%delivered%' OR
    text ILIKE '%refuge%' OR
    text ILIKE '%shelter%'
  );

-- Mark faith/trust verses as highly memorable (NEW)
UPDATE verses
SET is_memorable = true,
    verse_category = 'faith',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 20 AND LENGTH(text) <= 250 AND
  (
    text ILIKE '%faith%' OR
    text ILIKE '%trust in%' OR
    text ILIKE '%believe%' OR
    text ILIKE '%hope in%' OR
    text ILIKE '%confidence%'
  );

-- Mark love verses as highly memorable (NEW)
UPDATE verses
SET is_memorable = true,
    verse_category = 'love',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 20 AND LENGTH(text) <= 250 AND
  (
    text ILIKE '%love%' OR
    text ILIKE '%lovingkindness%' OR
    text ILIKE '%mercy%' OR
    text ILIKE '%compassion%' OR
    text ILIKE '%grace%'
  );

-- Mark famous/popular verses as easy to memorize (NEW)
UPDATE verses
SET memorization_difficulty = 'easy',
    is_memorable = true
WHERE
  translation = 'KJV' AND
  (
    -- John 3:16
    (book = 'John' AND chapter = 3 AND verse_number = 16) OR
    -- Jeremiah 29:11
    (book = 'Jeremiah' AND chapter = 29 AND verse_number = 11) OR
    -- Philippians 4:13
    (book = 'Philippians' AND chapter = 4 AND verse_number = 13) OR
    -- Psalm 23 (entire chapter)
    (book = 'Psalms' AND chapter = 23) OR
    -- Romans 8:28
    (book = 'Romans' AND chapter = 8 AND verse_number = 28) OR
    -- Proverbs 3:5-6
    (book = 'Proverbs' AND chapter = 3 AND verse_number IN (5,6)) OR
    -- Joshua 1:9
    (book = 'Joshua' AND chapter = 1 AND verse_number = 9) OR
    -- Isaiah 40:31
    (book = 'Isaiah' AND chapter = 40 AND verse_number = 31)
  );

-- Mark New Testament epistles teachings as memorable (NEW)
UPDATE verses
SET is_memorable = true,
    verse_category = 'teaching',
    memorization_difficulty = 'medium'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 30 AND LENGTH(text) <= 250 AND
  book IN ('Romans', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
           '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Hebrews',
           'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude');
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
