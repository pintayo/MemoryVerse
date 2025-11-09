#!/usr/bin/env node

/**
 * Process Bible JSON dataset and generate SQL INSERT statements
 *
 * Expected JSON format:
 * [{"book":"Genesis","chapter":1,"verse":1,"text":"In the beginning..."}]
 *
 * Usage:
 *   node scripts/process-bible-dataset.js
 *
 * This will process all JSON files in assets/translations/ directory
 * and generate SQL files in the supabase/ directory.
 */

const fs = require('fs');
const path = require('path');

// Category keywords for verse classification (expanded for better coverage)
const categoryKeywords = {
  // Promise & Covenant
  promise: [
    'promise', 'promises', 'promised', 'covenant', 'covenants',
    'forever', 'eternal', 'everlasting', 'faithful', 'faithfulness',
    'swear', 'sworn', 'oath', 'vow', 'endure', 'endures', 'establish', 'established'
  ],

  // Comfort & Peace
  comfort: [
    'comfort', 'comforts', 'comforter', 'console', 'consolation',
    'peace', 'peaceful', 'rest', 'rested', 'refuge', 'shelter',
    'safe', 'safety', 'stronghold', 'rock', 'hiding place',
    'still', 'calm', 'quiet', 'gentle', 'tender'
  ],

  // Encouragement & Strength
  encouragement: [
    'strength', 'strengthen', 'strengthened', 'strong', 'stronger',
    'courage', 'courageous', 'fear not', 'do not fear', 'be strong',
    'encourage', 'encouraged', 'encouragement', 'bold', 'boldly',
    'mighty', 'power', 'powerful', 'able', 'renew', 'renewed'
  ],

  // Wisdom & Understanding
  wisdom: [
    'wisdom', 'wise', 'wisely', 'understanding', 'understand',
    'knowledge', 'know', 'discernment', 'discern', 'prudent', 'prudence',
    'counsel', 'counselor', 'insight', 'instruct', 'instruction',
    'teach', 'teaching', 'learn', 'learned', 'skillful', 'skill'
  ],

  // Love & Compassion
  love: [
    'love', 'loves', 'loved', 'loving', 'lovingkindness', 'beloved',
    'compassion', 'compassionate', 'merciful', 'mercy', 'mercies',
    'grace', 'gracious', 'kindness', 'kind', 'goodness',
    'tender', 'tenderness', 'care', 'caring', 'affection'
  ],

  // Faith & Trust
  faith: [
    'faith', 'faithful', 'believe', 'believes', 'believed', 'believer',
    'trust', 'trusts', 'trusted', 'confidence', 'confident',
    'rely', 'reliance', 'depend', 'dependence', 'assurance'
  ],

  // Hope & Patience
  hope: [
    'hope', 'hopes', 'hoped', 'hoping', 'hopeful',
    'expectation', 'expect', 'expected', 'wait', 'waited', 'waiting',
    'patient', 'patience', 'patiently', 'endure', 'endurance',
    'persevere', 'perseverance', 'steadfast'
  ],

  // Prayer & Intercession
  prayer: [
    'pray', 'prayed', 'prayer', 'prayers', 'praying',
    'petition', 'petitions', 'supplicate', 'supplication',
    'intercede', 'intercession', 'ask', 'asked', 'asking',
    'seek', 'seeking', 'call', 'called', 'calling', 'cry', 'cried'
  ],

  // Praise & Worship
  praise: [
    'praise', 'praises', 'praised', 'praising',
    'worship', 'worshiped', 'worshiper', 'exalt', 'exalted',
    'glorify', 'glorified', 'glory', 'glorious',
    'thanksgiving', 'thanks', 'thank', 'grateful', 'gratitude',
    'hallelujah', 'hosanna', 'blessed', 'bless', 'magnify'
  ],

  // Salvation & Redemption
  salvation: [
    'salvation', 'save', 'saved', 'savior', 'saving',
    'redeemer', 'redemption', 'redeem', 'redeemed',
    'delivered', 'deliverance', 'deliver', 'deliverer',
    'rescue', 'rescued', 'rescuer', 'ransom', 'ransomed',
    'born again', 'new creation', 'justified', 'sanctified'
  ],

  // Guidance & Direction
  guidance: [
    'guide', 'guides', 'guided', 'lead', 'leads', 'leading', 'led',
    'path', 'paths', 'way', 'ways', 'direct', 'direction', 'directed',
    'counsel', 'show', 'showed', 'teach', 'instruct',
    'steps', 'walk', 'walking', 'follow', 'following'
  ],

  // Joy & Gladness
  joy: [
    'joy', 'joys', 'joyful', 'joyfully',
    'rejoice', 'rejoiced', 'rejoicing',
    'glad', 'gladness', 'delight', 'delighted', 'delightful',
    'happy', 'happiness', 'blessed', 'blessing', 'cheerful', 'merry'
  ],

  // Forgiveness & Cleansing
  forgiveness: [
    'forgive', 'forgives', 'forgiveness', 'forgiven', 'forgiving',
    'pardon', 'pardoned', 'cleanse', 'cleansed', 'cleansing',
    'wash', 'washed', 'purify', 'purified', 'purification',
    'atone', 'atonement', 'reconcile', 'reconciliation',
    'remission', 'blot out', 'cast away'
  ],

  // Obedience & Commandments
  obedience: [
    'obey', 'obeyed', 'obedience', 'obedient',
    'commandment', 'commandments', 'command', 'commanded',
    'law', 'laws', 'decree', 'decrees', 'statute', 'statutes',
    'ordinance', 'ordinances', 'precept', 'precepts',
    'keep', 'kept', 'observe', 'observed', 'follow', 'heed'
  ],

  // Victory & Overcoming
  victory: [
    'victory', 'victorious', 'overcome', 'overcame', 'overcomer',
    'conquer', 'conquered', 'conqueror', 'triumph', 'triumphant',
    'prevail', 'prevailed', 'win', 'won', 'defeat', 'defeated'
  ],

  // Protection & Defense
  protection: [
    'protect', 'protected', 'protection', 'shield', 'shielded',
    'guard', 'guarded', 'defend', 'defended', 'defender',
    'watchman', 'watch', 'keep', 'keeper', 'preserve', 'preservation',
    'cover', 'covering', 'fortress', 'tower', 'wall'
  ],

  // Provision & Blessing
  provision: [
    'provide', 'provided', 'provision', 'provisions',
    'supply', 'supplied', 'sustain', 'sustained',
    'nourish', 'nourished', 'feed', 'fed', 'food',
    'care', 'cared', 'bless', 'blessed', 'blessing', 'blessings',
    'prosper', 'prosperity', 'abundant', 'abundance', 'bounty'
  ],

  // Healing & Restoration
  healing: [
    'heal', 'healed', 'healing', 'healer',
    'health', 'healthy', 'restore', 'restored', 'restoration',
    'recover', 'recovered', 'recovery', 'cure', 'cured',
    'whole', 'wholeness', 'renew', 'renewed', 'revival'
  ],

  // Justice & Righteousness
  justice: [
    'justice', 'just', 'justly', 'righteous', 'righteousness',
    'equity', 'equitable', 'fair', 'fairness', 'right',
    'judgment', 'judge', 'judged', 'upright', 'uprightness',
    'vindicate', 'vindication', 'innocent', 'innocence'
  ],

  // Humility & Servanthood
  humility: [
    'humble', 'humbled', 'humility', 'humbly',
    'meek', 'meekness', 'lowly', 'lowliness',
    'servant', 'serve', 'served', 'service',
    'submit', 'submission', 'gentle', 'gentleness'
  ],

  // Creation & Power of God
  creation: [
    'create', 'created', 'creation', 'creator',
    'made', 'make', 'maketh', 'formed', 'form',
    'heaven', 'heavens', 'earth', 'world',
    'beginning', 'light', 'darkness', 'day', 'night',
    'almighty', 'omnipotent', 'sovereign'
  ],

  // Holiness & Purity
  holiness: [
    'holy', 'holiness', 'sanctify', 'sanctified', 'sanctification',
    'sacred', 'consecrate', 'consecrated', 'set apart',
    'pure', 'purity', 'blameless', 'perfect', 'perfection',
    'righteous', 'upright', 'clean'
  ],

  // Repentance & Turning to God
  repentance: [
    'repent', 'repented', 'repentance', 'turn', 'turned', 'return',
    'converted', 'conversion', 'change', 'changed',
    'confess', 'confession', 'acknowledge', 'admit',
    'sorry', 'sorrow', 'sorrowful', 'mourn', 'mourning'
  ],

  // God's Presence & Glory
  presence: [
    'presence', 'face', 'dwell', 'dwelling', 'tabernacle',
    'temple', 'sanctuary', 'glory', 'glorious', 'shekinah',
    'manifest', 'manifestation', 'appear', 'appeared',
    'with us', 'among', 'midst', 'abide', 'remain'
  ],
};

/**
 * Categorize a verse based on keyword matching
 */
function categorizeVerse(text) {
  const lowerText = text.toLowerCase();
  const scores = {};

  // Score each category based on keyword matches
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        scores[category]++;
      }
    }
  }

  // Find category with highest score
  let maxScore = 0;
  let bestCategory = null;
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory; // Returns null if no keywords matched
}

/**
 * Calculate difficulty based on verse length and complexity
 * 1 = Very Easy (< 50 chars)
 * 2 = Easy (50-100 chars)
 * 3 = Medium (100-150 chars)
 * 4 = Hard (150-200 chars)
 * 5 = Very Hard (> 200 chars)
 */
function calculateDifficulty(text) {
  const length = text.length;

  if (length < 50) return 1;
  if (length < 100) return 2;
  if (length < 150) return 3;
  if (length < 200) return 4;
  return 5;
}

/**
 * Escape single quotes for SQL
 */
function escapeSQLString(str) {
  return str.replace(/'/g, "''");
}

/**
 * Process JSON file and generate SQL
 */
function processBibleJSON(jsonFilePath, translation) {
  console.log(`📖 Processing Bible dataset: ${jsonFilePath}`);
  console.log(`📝 Translation: ${translation}`);
  console.log('');

  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ Error: File not found: ${jsonFilePath}`);
    process.exit(1);
  }

  // Read and parse JSON file
  const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
  let verses;

  try {
    verses = JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ Error parsing JSON: ${error.message}`);
    process.exit(1);
  }

  console.log(`📊 Loaded ${verses.length} verse entries from JSON file`);

  // Combine duplicate verses (some translations split verses into multiple entries)
  const verseMap = new Map();

  for (const verse of verses) {
    const key = `${verse.book}:${verse.chapter}:${verse.verse}`;

    if (verseMap.has(key)) {
      // Append text to existing verse
      const existing = verseMap.get(key);
      existing.text = existing.text.trim() + ' ' + verse.text.trim();
    } else {
      verseMap.set(key, {
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text.trim()
      });
    }
  }

  // Convert map back to array
  const consolidatedVerses = Array.from(verseMap.values());

  console.log(`✅ Consolidated to ${consolidatedVerses.length} unique verses`);
  console.log('');

  // Output SQL file
  const outputFile = path.join(__dirname, '..', 'supabase', `bible_verses_${translation.toLowerCase()}.sql`);
  const sqlHeader = `-- Bible Verses - ${translation} Translation
-- Auto-generated from JSON dataset
-- Total unique verses: ${consolidatedVerses.length}

-- Insert verses into public.verses table
INSERT INTO public.verses (book, chapter, verse_number, text, translation, category, difficulty)
VALUES
`;

  fs.writeFileSync(outputFile, sqlHeader);

  let processedCount = 0;
  let skippedCount = 0;
  const batchSize = 500;
  let valueLines = [];

  // Track statistics
  const stats = {
    byBook: {},
    byCategory: {},
    byDifficulty: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  for (let i = 0; i < consolidatedVerses.length; i++) {
    const verse = consolidatedVerses[i];

    try {
      // Validate verse data
      if (!verse.book || !verse.chapter || !verse.verse || !verse.text) {
        console.log(`⚠️  Skipping verse ${i + 1}: Missing required fields`);
        skippedCount++;
        continue;
      }

      const bookName = verse.book;
      const chapter = verse.chapter;
      const verseNum = verse.verse;
      const text = verse.text;

      const category = categorizeVerse(text);
      const difficulty = calculateDifficulty(text);

      const valueLine = `  ('${escapeSQLString(bookName)}', ${chapter}, ${verseNum}, '${escapeSQLString(text)}', '${translation}', ${category ? `'${category}'` : 'NULL'}, ${difficulty})`;

      valueLines.push(valueLine);
      processedCount++;

      // Update statistics
      stats.byBook[bookName] = (stats.byBook[bookName] || 0) + 1;
      if (category) {
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      }
      stats.byDifficulty[difficulty]++;

      // Write in batches
      if (valueLines.length >= batchSize) {
        fs.appendFileSync(outputFile, valueLines.join(',\n') + ',\n');
        valueLines = [];
      }

      if (processedCount % 1000 === 0) {
        process.stdout.write(`\r✨ Processed: ${processedCount} verses...`);
      }

    } catch (error) {
      console.log(`\n⚠️  Error processing verse ${i + 1}: ${error.message}`);
      skippedCount++;
    }
  }

  // Write remaining verses (without trailing comma)
  if (valueLines.length > 0) {
    fs.appendFileSync(outputFile, valueLines.join(',\n'));
  }

  // Add conflict handling and semicolon
  fs.appendFileSync(outputFile, '\nON CONFLICT (book, chapter, verse_number, translation) DO NOTHING;\n');

  // Print statistics
  console.log(`\n\n✅ Successfully processed ${processedCount} verses`);
  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} invalid verses`);
  }

  console.log('\n📊 Statistics:');
  console.log(`   Books: ${Object.keys(stats.byBook).length}`);
  console.log(`   Categories assigned: ${Object.keys(stats.byCategory).length}`);
  console.log(`   Uncategorized: ${processedCount - Object.values(stats.byCategory).reduce((a, b) => a + b, 0)}`);
  console.log('\n   Difficulty breakdown:');
  console.log(`     Level 1 (Very Easy): ${stats.byDifficulty[1]}`);
  console.log(`     Level 2 (Easy): ${stats.byDifficulty[2]}`);
  console.log(`     Level 3 (Medium): ${stats.byDifficulty[3]}`);
  console.log(`     Level 4 (Hard): ${stats.byDifficulty[4]}`);
  console.log(`     Level 5 (Very Hard): ${stats.byDifficulty[5]}`);

  console.log(`\n📄 SQL file generated: ${outputFile}`);
  console.log(`   File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
  console.log('');

  return { processedCount, skippedCount, stats };
}

// Main execution
console.log('🚀 Bible Dataset Processor\n');

// Get translations directory
const translationsDir = path.join(__dirname, '..', 'assets', 'translations');

if (!fs.existsSync(translationsDir)) {
  console.error(`❌ Error: Translations directory not found: ${translationsDir}`);
  console.log('');
  console.log('Please ensure your JSON files are in: assets/translations/');
  process.exit(1);
}

// Find all JSON files in the translations directory
const files = fs.readdirSync(translationsDir).filter(f => f.endsWith('.json'));

if (files.length === 0) {
  console.error(`❌ Error: No JSON files found in ${translationsDir}`);
  console.log('');
  console.log('Please add your Bible translation JSON files to: assets/translations/');
  process.exit(1);
}

console.log(`Found ${files.length} translation file(s):\n`);
files.forEach(f => console.log(`  📖 ${f}`));
console.log('');

// Process each translation file
const results = [];
for (const file of files) {
  const filePath = path.join(translationsDir, file);

  // Extract translation name from filename (e.g., bible_kjv.json -> KJV)
  const translationName = file
    .replace('bible_', '')
    .replace('.json', '')
    .toUpperCase();

  const result = processBibleJSON(filePath, translationName);
  results.push({ translation: translationName, ...result });

  console.log('─'.repeat(60));
  console.log('');
}

// Print summary
console.log('🎉 All translations processed successfully!\n');
console.log('Summary:');
results.forEach(r => {
  console.log(`  ${r.translation}: ${r.processedCount} verses`);
});

console.log('\n📝 Next steps:');
console.log('1. Open Supabase SQL Editor');
console.log('2. Copy and paste the contents of each generated SQL file:');
results.forEach(r => {
  console.log(`   - supabase/bible_verses_${r.translation.toLowerCase()}.sql`);
});
console.log('3. Run each SQL query (may take 1-2 minutes per file)');
console.log('');
