# Verse Quality System Setup

This guide helps you filter verses to show only meaningful, memorable verses for daily devotionals and memorization.

**Multi-Translation Support:** Currently these queries filter KJV only. Once verified working, we'll update all queries to apply to all translations (ASV, BBE, DBY, WBT, WEB, YLT) so premium users can choose their preferred translation.

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

**IMPORTANT:** Run these queries in order! Part 1 filters out low-quality verses, then Part 2 marks high-quality ones.

### Part 1: Filter Out Low-Quality Verses

```sql
-- ============================================================================
-- PART 1: Mark verses as NOT MEMORABLE (Run this FIRST)
-- ============================================================================

-- Reset all verses to not memorable first (we'll mark good ones as memorable in Part 2)
UPDATE verses
SET is_memorable = false,
    verse_category = 'general'
WHERE translation = 'KJV';

-- Mark entire books/sections with mostly genealogies/lists as not memorable
UPDATE verses
SET is_memorable = false,
    verse_category = 'genealogy'
WHERE
  translation = 'KJV' AND
  (
    -- 1 Chronicles chapters 1-9 are almost entirely genealogies
    (book = '1 Chronicles' AND chapter BETWEEN 1 AND 9) OR
    -- Genesis genealogy chapters
    (book = 'Genesis' AND chapter IN (5, 10, 11, 36, 46)) OR
    -- Numbers census chapters
    (book = 'Numbers' AND chapter IN (1, 2, 3, 4, 7, 26)) OR
    -- Ezra and Nehemiah returning exiles lists
    (book = 'Ezra' AND chapter IN (2, 8, 10)) OR
    (book = 'Nehemiah' AND chapter IN (7, 11, 12))
  );

-- Mark travel itineraries
UPDATE verses
SET is_memorable = false,
    verse_category = 'itinerary'
WHERE
  translation = 'KJV' AND
  (
    -- Entire Numbers 33 is travel itinerary
    (book = 'Numbers' AND chapter = 33) OR
    -- Itinerary phrases
    text ILIKE '%departed from%' OR
    text ILIKE '%encamped at%' OR
    text ILIKE '%encamped in%' OR
    text ILIKE '%encamped by%' OR
    text ILIKE '%removed from%' OR
    text ILIKE '%pitched in%' OR
    text ILIKE '%pitched by%' OR
    text ILIKE '%went from%' OR
    text ILIKE '%journeyed from%' OR
    (text ILIKE '%came to%' AND text ILIKE '%and pitched%')
  );

-- Mark genealogy-style verses (expanded patterns)
UPDATE verses
SET is_memorable = false,
    verse_category = 'genealogy'
WHERE
  translation = 'KJV' AND
  is_memorable = true AND -- Only update verses not already filtered
  (
    text ILIKE '%begat%' OR
    text ILIKE '%son of%' OR
    text ILIKE '%sons of%' OR
    text ILIKE '%daughter of%' OR
    text ILIKE '%daughters of%' OR
    text ILIKE '%children of%' AND text ~ '\d+' OR -- "children of X, 500"
    text ILIKE '%genealogy%' OR
    text ILIKE '%generations of%' OR
    text ILIKE '%father of%' OR
    text ILIKE '%born unto%' OR
    text ILIKE '%bare unto%' OR
    text ILIKE '%wife of%' AND LENGTH(text) < 100 OR -- Short genealogy notes
    -- Multiple names in succession
    text ~ '([A-Z][a-z]+,?\s+(and\s+)?){3,}'
  );

-- Mark census and counting verses
UPDATE verses
SET is_memorable = false,
    verse_category = 'census'
WHERE
  translation = 'KJV' AND
  is_memorable = true AND
  (
    -- Contains large numbers
    text ~ '\d{3,}' OR -- Any number with 3+ digits
    text ~ '\d+,\d+' OR -- Numbers with commas
    text ILIKE '%thousand%' AND text ILIKE '%hundred%' OR
    text ILIKE '%thousand and%' OR
    text ILIKE '%hundred and%' AND text ~ '\d+' OR
    text ILIKE '%numbered%' OR
    text ILIKE '%numbering%' OR
    text ILIKE '%number of%' AND text ~ '\d+' OR
    -- Counting phrases
    text ILIKE 'The children of%' AND text ~ '\d+' OR
    text ILIKE 'The men of%' AND text ~ '\d+'
  );

-- Mark lists of places/names
UPDATE verses
SET is_memorable = false,
    verse_category = 'lists'
WHERE
  translation = 'KJV' AND
  is_memorable = true AND
  (
    -- Multiple "and" connecting items (lists)
    text ~ '(,\s+and\s+[A-Z][a-z]+){2,}' OR
    -- Lists of places/people
    text ~ '([A-Z][a-z]+,\s+){3,}' OR
    -- Lists of nations
    text ILIKE '%Hittites%' OR
    text ILIKE '%Canaanites%' OR
    text ILIKE '%Jebusites%' OR
    text ILIKE '%Amorites%' OR
    text ~ 'the\s+[A-Z][a-z]+ites,\s+and\s+the' OR
    -- Lists of animals/things
    (LENGTH(text) < 150 AND text ~ '(and\s+the\s+[a-z]+,?\s+){3,}')
  );

-- Mark ceremonial law and measurements
UPDATE verses
SET is_memorable = false,
    verse_category = 'law',
    memorization_difficulty = 'hard'
WHERE
  translation = 'KJV' AND
  is_memorable = true AND
  (
    -- Temple construction in 1 Kings, 2 Chronicles, Ezekiel
    (book IN ('1 Kings', '2 Chronicles', '2 Kings', 'Ezekiel') AND
     (text ILIKE '%cubit%' OR
      text ILIKE '%overlaid with gold%' OR
      text ILIKE '%of brass%' OR
      text ILIKE '%breadth%' AND text ILIKE '%length%')) OR
    -- Levitical law
    (book IN ('Exodus', 'Leviticus', 'Numbers', 'Deuteronomy') AND
     (text ILIKE '%cubit%' OR
      text ILIKE '%ephah%' OR
      text ILIKE '%shekel%' OR
      text ILIKE '%hin%' OR
      text ILIKE '%span%' OR
      text ILIKE '%trespass offering%' OR
      text ILIKE '%sin offering%' OR
      text ILIKE '%meat offering%' OR
      text ILIKE '%burnt offering%' OR
      text ILIKE '%shall be unclean%' OR
      text ILIKE '%make him clean%'))
  );

-- Mark transition/connector verses
UPDATE verses
SET is_memorable = false,
    verse_category = 'transition'
WHERE
  translation = 'KJV' AND
  is_memorable = true AND
  (
    text = 'And the LORD spake unto Moses, saying,' OR
    text ILIKE 'And the word of the LORD came%saying,' OR
    text ILIKE 'And it came to pass%' AND LENGTH(text) < 60 OR
    text ILIKE 'Thus saith the LORD%' AND LENGTH(text) < 50 OR
    -- Very generic transitional statements
    (LENGTH(text) < 60 AND
     (text ILIKE 'And the LORD said%' OR
      text ILIKE 'And God said%' OR
      text ILIKE 'Then said%' OR
      text ILIKE 'And he said%' OR
      text ILIKE 'And they said%'))
  );

-- Mark very short verses (fragments)
UPDATE verses
SET is_memorable = false,
    verse_category = 'fragment'
WHERE
  translation = 'KJV' AND
  is_memorable = true AND
  LENGTH(text) < 25;

-- Mark obscure prophetic imagery
UPDATE verses
SET is_memorable = false,
    verse_category = 'prophecy_obscure'
WHERE
  translation = 'KJV' AND
  is_memorable = true AND
  (
    -- Ezekiel's temple vision (chapters 40-48)
    (book = 'Ezekiel' AND chapter BETWEEN 40 AND 48) OR
    -- Revelation's detailed symbolic imagery
    (book = 'Revelation' AND
     (text ILIKE '%sardine%' OR
      text ILIKE '%sardius%' OR
      text ILIKE '%chrysolite%' OR
      text ILIKE '%beryl%' OR
      text ILIKE '%topaz%' OR
      text ~ '(and\s+[a-z]+\s+){5,}')) -- Long lists in Revelation
  );

-- Mark territorial boundary descriptions
UPDATE verses
SET is_memorable = false,
    verse_category = 'boundaries'
WHERE
  translation = 'KJV' AND
  is_memorable = true AND
  (
    (book IN ('Joshua', 'Numbers') AND
     (text ILIKE '%border%' OR
      text ILIKE '%coast%' OR
      text ILIKE '%goeth out%' AND text ILIKE '%goeth%' OR
      text ILIKE '%unto%' AND text ILIKE '%from%' AND LENGTH(text) < 120))
  );
```

### Part 2: Mark High-Quality Verses as Memorable

```sql
-- ============================================================================
-- PART 2: Mark verses as HIGHLY MEMORABLE (Run this SECOND)
-- ============================================================================

-- Mark entire Psalms (except very long ones)
UPDATE verses
SET is_memorable = true,
    verse_category = 'praise',
    memorization_difficulty = CASE
      WHEN LENGTH(text) <= 150 THEN 'easy'
      WHEN LENGTH(text) <= 250 THEN 'medium'
      ELSE 'hard'
    END
WHERE
  translation = 'KJV' AND
  book = 'Psalms' AND
  LENGTH(text) >= 20 AND
  LENGTH(text) <= 400;

-- Mark entire Proverbs (wisdom)
UPDATE verses
SET is_memorable = true,
    verse_category = 'wisdom',
    memorization_difficulty = CASE
      WHEN LENGTH(text) <= 150 THEN 'easy'
      ELSE 'medium'
    END
WHERE
  translation = 'KJV' AND
  book = 'Proverbs' AND
  LENGTH(text) >= 25 AND
  LENGTH(text) <= 300;

-- Mark other wisdom literature
UPDATE verses
SET is_memorable = true,
    verse_category = 'wisdom',
    memorization_difficulty = 'medium'
WHERE
  translation = 'KJV' AND
  book IN ('Ecclesiastes', 'Job', 'Song of Solomon') AND
  LENGTH(text) >= 30 AND
  LENGTH(text) <= 300 AND
  -- Exclude genealogies in Job
  NOT (text ~ '([A-Z][a-z]+,?\s+){3,}');

-- Mark major teaching sections (work better as ranges but marking individually)
UPDATE verses
SET is_memorable = true,
    verse_category = 'teaching',
    memorization_difficulty = CASE
      WHEN LENGTH(text) <= 150 THEN 'easy'
      WHEN LENGTH(text) <= 250 THEN 'medium'
      ELSE 'hard'
    END
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 25 AND
  LENGTH(text) <= 400 AND
  (
    -- Sermon on the Mount (Matthew 5-7)
    (book = 'Matthew' AND chapter BETWEEN 5 AND 7) OR
    -- Romans (major theological teaching)
    (book = 'Romans' AND chapter BETWEEN 1 AND 8) OR
    (book = 'Romans' AND chapter = 12) OR
    -- 1 Corinthians 13 (Love chapter)
    (book = '1 Corinthians' AND chapter = 13) OR
    -- Ephesians (theology and practice)
    (book = 'Ephesians' AND chapter BETWEEN 1 AND 6) OR
    -- James (practical wisdom)
    (book = 'James') OR
    -- 1 John (love and assurance)
    (book = '1 John') OR
    -- Colossians (Christ's supremacy)
    (book = 'Colossians') OR
    -- Philippians (joy and Christ-centeredness)
    (book = 'Philippians')
  );

-- Mark famous verses
UPDATE verses
SET is_memorable = true,
    verse_category = 'famous',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  (
    (book = 'John' AND chapter = 3 AND verse_number = 16) OR
    (book = 'Jeremiah' AND chapter = 29 AND verse_number = 11) OR
    (book = 'Philippians' AND chapter = 4 AND verse_number = 13) OR
    (book = 'Psalms' AND chapter = 23) OR
    (book = 'Romans' AND chapter = 8 AND verse_number = 28) OR
    (book = 'Proverbs' AND chapter = 3 AND verse_number IN (5,6)) OR
    (book = 'Joshua' AND chapter = 1 AND verse_number = 9) OR
    (book = 'Isaiah' AND chapter = 40 AND verse_number = 31) OR
    (book = 'Matthew' AND chapter = 28 AND verse_number = 19) OR
    (book = 'Genesis' AND chapter = 1 AND verse_number = 1) OR
    (book = 'Romans' AND chapter = 3 AND verse_number = 23) OR
    (book = 'Romans' AND chapter = 6 AND verse_number = 23) OR
    (book = 'Ephesians' AND chapter = 2 AND verse_number IN (8,9))
  );

-- Mark promises
UPDATE verses
SET is_memorable = true,
    verse_category = 'promise',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 30 AND
  LENGTH(text) <= 250 AND
  (
    text ILIKE '%I will%' AND NOT text ILIKE '%if%' OR
    text ILIKE '%will never%' OR
    text ILIKE '%I will not%' OR
    text ILIKE '%I am with you%' OR
    text ILIKE '%be with you%' OR
    text ILIKE '%I have loved you%' OR
    text ILIKE '%will be your God%' OR
    text ILIKE '%my God%' AND text ILIKE '%strength%'
  ) AND
  -- Exclude conditional promises and genealogies
  NOT (text ~ '([A-Z][a-z]+,?\s+){3,}') AND
  NOT (text ILIKE '%if thou%' OR text ILIKE '%if ye%');

-- Mark commands
UPDATE verses
SET is_memorable = true,
    verse_category = 'command',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 25 AND
  LENGTH(text) <= 200 AND
  (
    text ILIKE '%fear not%' OR
    text ILIKE '%be not afraid%' OR
    text ILIKE '%trust in%' OR
    text ILIKE '%love one another%' OR
    text ILIKE '%love thy%' OR
    text ILIKE '%let not your heart%' OR
    text ILIKE '%rejoice%' OR
    text ILIKE '%give thanks%'
  ) AND
  book NOT IN ('Leviticus', 'Numbers', 'Deuteronomy', 'Exodus');

-- Mark gospel/salvation verses
UPDATE verses
SET is_memorable = true,
    verse_category = 'gospel',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 30 AND
  LENGTH(text) <= 300 AND
  (
    (book IN ('Matthew', 'Mark', 'Luke', 'John', 'Acts') AND
     (text ILIKE '%believe%' OR
      text ILIKE '%eternal life%' OR
      text ILIKE '%kingdom of God%' OR
      text ILIKE '%kingdom of heaven%' OR
      text ILIKE '%Son of God%' OR
      text ILIKE '%Son of man%' OR
      text ILIKE '%resurrection%' OR
      text ILIKE '%follow me%' OR
      text ILIKE '%I am the%')) OR
    (book IN ('Romans', 'Galatians', 'Ephesians') AND
     (text ILIKE '%faith%' OR
      text ILIKE '%grace%' OR
      text ILIKE '%saved%' OR
      text ILIKE '%justified%'))
  );

-- Mark comfort/hope verses
UPDATE verses
SET is_memorable = true,
    verse_category = 'comfort',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 25 AND
  LENGTH(text) <= 250 AND
  (
    text ILIKE '%comfort%' OR
    text ILIKE '%peace%' AND NOT text ILIKE '%peace offering%' OR
    text ILIKE '%rest%' AND NOT text ILIKE '%the rest%' OR
    text ILIKE '%hope%' AND NOT text ILIKE '%hoped%' OR
    text ILIKE '%strength%' AND text ILIKE '%LORD%' OR
    text ILIKE '%refuge%' OR
    text ILIKE '%shelter%' OR
    text ILIKE '%delivers%' OR
    text ILIKE '%delivereth%'
  ) AND
  NOT (text ~ '([A-Z][a-z]+,?\s+){3,}');

-- Mark love verses
UPDATE verses
SET is_memorable = true,
    verse_category = 'love',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 25 AND
  LENGTH(text) <= 250 AND
  (
    -- Famous love chapter (1 Corinthians 13)
    (book = '1 Corinthians' AND chapter = 13) OR
    -- Love-related verses
    text ILIKE '%love%' OR
    text ILIKE '%lovingkindness%' OR
    (text ILIKE '%mercy%' AND text ILIKE '%LORD%') OR
    text ILIKE '%compassion%' OR
    text ILIKE '%tender%'
  );

-- Mark New Testament teachings
UPDATE verses
SET is_memorable = true,
    verse_category = 'teaching',
    memorization_difficulty = 'medium'
WHERE
  translation = 'KJV' AND
  LENGTH(text) >= 35 AND
  LENGTH(text) <= 250 AND
  book IN ('Romans', 'Ephesians', 'Philippians', 'Colossians',
           'Hebrews', 'James', '1 Peter', '2 Peter', '1 John') AND
  -- Exclude lists and genealogies
  NOT (text ~ '([A-Z][a-z]+,?\s+){3,}') AND
  NOT (text ~ '\d{3,}');

-- Mark creation account (Genesis 1-2)
UPDATE verses
SET is_memorable = true,
    verse_category = 'creation',
    memorization_difficulty = 'easy'
WHERE
  translation = 'KJV' AND
  book = 'Genesis' AND
  chapter IN (1, 2) AND
  LENGTH(text) >= 20 AND
  LENGTH(text) <= 300;
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

## Step 5: Apply to Other Translations (ASV, BBE, DBY, WBT, WEB, YLT)

Once you've verified the KJV filtering works well, apply structure-based filtering to all translations. This uses book/chapter ranges that work regardless of English translation differences.

**Run Part 1 for All Translations:**

Replace `WHERE translation = 'KJV'` with:
```sql
WHERE translation IN ('ASV', 'BBE', 'DBY', 'WBT', 'WEB', 'YLT')
```

**Run Part 2 Structure-Based Filtering for All Translations:**

This focuses on book/chapter ranges and famous verse references that work across all translations:

```sql
-- Mark Psalms, Proverbs, and wisdom books (all translations)
UPDATE verses
SET is_memorable = true,
    verse_category = CASE
      WHEN book = 'Psalms' THEN 'praise'
      WHEN book = 'Proverbs' THEN 'wisdom'
      ELSE 'wisdom'
    END,
    memorization_difficulty = CASE
      WHEN LENGTH(text) <= 150 THEN 'easy'
      WHEN LENGTH(text) <= 250 THEN 'medium'
      ELSE 'hard'
    END
WHERE
  translation IN ('ASV', 'BBE', 'DBY', 'WBT', 'WEB', 'YLT') AND
  book IN ('Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon') AND
  LENGTH(text) >= 20 AND
  LENGTH(text) <= 400;

-- Mark major teaching sections (all translations)
UPDATE verses
SET is_memorable = true,
    verse_category = 'teaching',
    memorization_difficulty = CASE
      WHEN LENGTH(text) <= 150 THEN 'easy'
      WHEN LENGTH(text) <= 250 THEN 'medium'
      ELSE 'hard'
    END
WHERE
  translation IN ('ASV', 'BBE', 'DBY', 'WBT', 'WEB', 'YLT') AND
  LENGTH(text) >= 25 AND
  LENGTH(text) <= 400 AND
  (
    (book = 'Matthew' AND chapter BETWEEN 5 AND 7) OR
    (book = 'Romans' AND chapter BETWEEN 1 AND 8) OR
    (book = 'Romans' AND chapter = 12) OR
    (book = '1 Corinthians' AND chapter = 13) OR
    (book = 'Ephesians' AND chapter BETWEEN 1 AND 6) OR
    (book = 'James') OR
    (book = '1 John') OR
    (book = 'Colossians') OR
    (book = 'Philippians')
  );

-- Mark famous verses (all translations - these references work everywhere)
UPDATE verses
SET is_memorable = true,
    verse_category = 'famous',
    memorization_difficulty = 'easy'
WHERE
  translation IN ('ASV', 'BBE', 'DBY', 'WBT', 'WEB', 'YLT') AND
  (
    (book = 'John' AND chapter = 3 AND verse_number = 16) OR
    (book = 'Jeremiah' AND chapter = 29 AND verse_number = 11) OR
    (book = 'Philippians' AND chapter = 4 AND verse_number = 13) OR
    (book = 'Psalms' AND chapter = 23) OR
    (book = 'Romans' AND chapter = 8 AND verse_number = 28) OR
    (book = 'Proverbs' AND chapter = 3 AND verse_number IN (5,6)) OR
    (book = 'Joshua' AND chapter = 1 AND verse_number = 9) OR
    (book = 'Isaiah' AND chapter = 40 AND verse_number = 31) OR
    (book = 'Matthew' AND chapter = 28 AND verse_number = 19) OR
    (book = 'Genesis' AND chapter = 1 AND verse_number = 1) OR
    (book = 'Romans' AND chapter = 3 AND verse_number = 23) OR
    (book = 'Romans' AND chapter = 6 AND verse_number = 23) OR
    (book = 'Ephesians' AND chapter = 2 AND verse_number IN (8,9))
  );

-- Mark Gospel teachings (all translations)
UPDATE verses
SET is_memorable = true,
    verse_category = 'gospel',
    memorization_difficulty = 'medium'
WHERE
  translation IN ('ASV', 'BBE', 'DBY', 'WBT', 'WEB', 'YLT') AND
  book IN ('Matthew', 'Mark', 'Luke', 'John') AND
  LENGTH(text) >= 30 AND
  LENGTH(text) <= 300;
```

**Note:** Translation-specific word patterns (like ILIKE '%lovingkindness%') are NOT included in multi-translation filtering because different translations use different vocabulary.

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
