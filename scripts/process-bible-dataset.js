#!/usr/bin/env node

/**
 * Process Bible CSV dataset and generate SQL INSERT statements
 *
 * Download the dataset from:
 * https://www.kaggle.com/datasets/oswinrh/bible/data
 *
 * Expected CSV format from Kaggle:
 * id,b,c,v,t
 * Where: id=unique_id, b=book_number, c=chapter, v=verse_number, t=text
 *
 * Usage:
 *   node scripts/process-bible-dataset.js <csv-file-path> [translation]
 *
 * Example:
 *   node scripts/process-bible-dataset.js t_kjv.csv KJV
 *   node scripts/process-bible-dataset.js t_asv.csv ASV
 */

const fs = require('fs');
const path = require('path');

// Bible book number to name mapping (66 books)
const bookNames = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles', 15: 'Ezra',
  16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms', 20: 'Proverbs',
  21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah', 24: 'Jeremiah', 25: 'Lamentations',
  26: 'Ezekiel', 27: 'Daniel', 28: 'Hosea', 29: 'Joel', 30: 'Amos',
  31: 'Obadiah', 32: 'Jonah', 33: 'Micah', 34: 'Nahum', 35: 'Habakkuk',
  36: 'Zephaniah', 37: 'Haggai', 38: 'Zechariah', 39: 'Malachi',
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
  45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians', 49: 'Ephesians',
  50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy',
  55: '2 Timothy', 56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James',
  60: '1 Peter', 61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John',
  65: 'Jude', 66: 'Revelation'
};

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
 * Parse CSV line (handles quoted fields)
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

/**
 * Process CSV file and generate SQL
 */
function processBibleCSV(csvFilePath, translation = 'KJV') {
  console.log(`📖 Processing Bible dataset: ${csvFilePath}`);
  console.log(`📝 Translation: ${translation}`);
  console.log('');

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: File not found: ${csvFilePath}`);
    console.log('');
    console.log('Please download the dataset from:');
    console.log('https://www.kaggle.com/datasets/oswinrh/bible/data');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = fileContent.split('\n');

  // Skip header line (id,b,c,v,t)
  const headerLine = lines[0].trim();
  console.log(`Header: ${headerLine}`);

  if (!headerLine.includes('id,b,c,v,t')) {
    console.log('⚠️  Warning: Expected header format "id,b,c,v,t"');
    console.log(`   Found: ${headerLine}`);
  }

  // Output SQL file
  const outputFile = path.join(__dirname, '../supabase', `bible_verses_${translation.toLowerCase()}.sql`);
  const sqlHeader = `-- Bible Verses - ${translation} Translation
-- Auto-generated from Kaggle Bible dataset
-- Source: https://www.kaggle.com/datasets/oswinrh/bible/data
-- Total verses: ${lines.length - 1}

-- Insert verses into public.verses table
INSERT INTO public.verses (book, chapter, verse_number, text, translation, category, difficulty)
VALUES\n`;

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

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const fields = parseCSVLine(line);

      // Expected format: id,b,c,v,t
      if (fields.length < 5) {
        console.log(`⚠️  Skipping line ${i}: Invalid format (${fields.length} fields)`);
        skippedCount++;
        continue;
      }

      const [id, bookNum, chapter, verseNum, text] = fields;

      if (!bookNum || !chapter || !verseNum || !text) {
        skippedCount++;
        continue;
      }

      // Convert book number to book name
      const bookNumber = parseInt(bookNum);
      const bookName = bookNames[bookNumber];

      if (!bookName) {
        console.log(`⚠️  Skipping line ${i}: Unknown book number ${bookNumber}`);
        skippedCount++;
        continue;
      }

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
      console.log(`\n⚠️  Error processing line ${i}: ${error.message}`);
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
    console.log(`⚠️  Skipped ${skippedCount} invalid lines`);
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
  console.log('To import into Supabase:');
  console.log('1. Open Supabase SQL Editor');
  console.log(`2. Paste contents of ${path.basename(outputFile)}`);
  console.log('3. Run the query (may take 1-2 minutes)');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/process-bible-dataset.js <csv-file-path> [translation]');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/process-bible-dataset.js t_kjv.csv KJV');
  console.log('  node scripts/process-bible-dataset.js t_asv.csv ASV');
  console.log('');
  console.log('Download the dataset from:');
  console.log('https://www.kaggle.com/datasets/oswinrh/bible/data');
  console.log('');
  console.log('CSV files in the dataset:');
  console.log('  t_kjv.csv - King James Version');
  console.log('  t_asv.csv - American Standard Version');
  console.log('  t_web.csv - World English Bible');
  console.log('  t_ylt.csv - Young\'s Literal Translation');
  console.log('  t_bbe.csv - Bible in Basic English');
  process.exit(1);
}

const csvFile = args[0];
const translation = args[1] || path.basename(csvFile, '.csv').split('_')[1]?.toUpperCase() || 'KJV';

processBibleCSV(csvFile, translation);
