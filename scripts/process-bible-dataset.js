#!/usr/bin/env node

/**
 * Process Bible CSV dataset and generate SQL INSERT statements
 *
 * Download the dataset from:
 * https://www.kaggle.com/datasets/oswinrh/bible/data
 *
 * Expected CSV format:
 * Book,Chapter,Verse,Text,Translation
 *
 * Usage:
 *   node scripts/process-bible-dataset.js <csv-file-path> [translation]
 *
 * Example:
 *   node scripts/process-bible-dataset.js bible_kjv.csv KJV
 *   node scripts/process-bible-dataset.js bible_niv.csv NIV
 */

const fs = require('fs');
const path = require('path');

// Category keywords for verse classification
const categoryKeywords = {
  promise: ['promise', 'promises', 'covenant', 'forever', 'eternal', 'everlasting', 'faithful', 'faithfulness'],
  comfort: ['comfort', 'comforts', 'console', 'peace', 'rest', 'refuge', 'shelter', 'safe', 'safety', 'stronghold'],
  encouragement: ['strength', 'strengthen', 'strong', 'courage', 'courageous', 'fear not', 'do not fear', 'be strong', 'encourage'],
  wisdom: ['wisdom', 'wise', 'understanding', 'knowledge', 'discernment', 'prudent', 'counsel', 'insight'],
  love: ['love', 'loves', 'loved', 'loving', 'beloved', 'compassion', 'merciful', 'mercy', 'grace', 'gracious'],
  faith: ['faith', 'believe', 'believes', 'trust', 'trusts', 'trusted', 'confidence'],
  hope: ['hope', 'hopes', 'hoping', 'expectation', 'wait', 'waiting', 'patient', 'patience'],
  prayer: ['pray', 'prayer', 'prayers', 'praying', 'petition', 'supplicate', 'intercede'],
  praise: ['praise', 'praises', 'worship', 'exalt', 'glorify', 'thanksgiving', 'thanks', 'hallelujah'],
  salvation: ['salvation', 'save', 'saved', 'redeemer', 'redemption', 'redeem', 'delivered', 'deliverance'],
  guidance: ['guide', 'guides', 'lead', 'leads', 'path', 'way', 'direct', 'direction', 'counsel'],
  joy: ['joy', 'joyful', 'rejoice', 'glad', 'gladness', 'delight', 'happy', 'happiness'],
  forgiveness: ['forgive', 'forgiveness', 'forgiven', 'pardon', 'cleanse', 'wash', 'purify'],
  obedience: ['obey', 'obedience', 'obedient', 'commandment', 'commandments', 'law', 'decree', 'statute'],
  victory: ['victory', 'victorious', 'overcome', 'conquer', 'triumph', 'prevail'],
  protection: ['protect', 'protection', 'shield', 'guard', 'defend', 'defender', 'watchman'],
  provision: ['provide', 'provision', 'supply', 'sustain', 'nourish', 'feed', 'care'],
  healing: ['heal', 'healing', 'health', 'restore', 'recover', 'cure'],
  justice: ['justice', 'just', 'righteous', 'righteousness', 'equity', 'fair', 'judgment'],
  humility: ['humble', 'humility', 'meek', 'meekness', 'lowly', 'servant'],
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
function processBibleCSV(csvFilePath, translation = 'NIV') {
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

  // Skip header line
  const headerLine = lines[0];
  console.log(`Header: ${headerLine}`);

  // Output SQL file
  const outputFile = path.join(__dirname, '../supabase', `bible_verses_${translation.toLowerCase()}.sql`);
  const sqlHeader = `-- Bible Verses - ${translation} Translation
-- Auto-generated from Kaggle Bible dataset
-- Total verses: ${lines.length - 1}

-- Insert verses into public.verses table
INSERT INTO public.verses (book, chapter, verse_number, text, translation, category, difficulty)
VALUES\n`;

  fs.writeFileSync(outputFile, sqlHeader);

  let processedCount = 0;
  let skippedCount = 0;
  const batchSize = 500;
  let valueLines = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const fields = parseCSVLine(line);

      if (fields.length < 4) {
        console.log(`⚠️  Skipping line ${i}: Invalid format`);
        skippedCount++;
        continue;
      }

      const [book, chapter, verseNum, text] = fields;

      if (!book || !chapter || !verseNum || !text) {
        skippedCount++;
        continue;
      }

      const category = categorizeVerse(text);
      const difficulty = calculateDifficulty(text);

      const valueLine = `  ('${escapeSQLString(book)}', ${chapter}, ${verseNum}, '${escapeSQLString(text)}', '${translation}', ${category ? `'${category}'` : 'NULL'}, ${difficulty})`;

      valueLines.push(valueLine);
      processedCount++;

      // Write in batches
      if (valueLines.length >= batchSize) {
        fs.appendFileSync(outputFile, valueLines.join(',\n') + '\n');
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

  // Write remaining verses
  if (valueLines.length > 0) {
    fs.appendFileSync(outputFile, valueLines.join(',\n'));
  }

  // Add conflict handling and semicolon
  fs.appendFileSync(outputFile, '\nON CONFLICT (book, chapter, verse_number, translation) DO NOTHING;\n');

  console.log(`\n\n✅ Successfully processed ${processedCount} verses`);
  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} invalid lines`);
  }
  console.log(`\n📄 SQL file generated: ${outputFile}`);
  console.log('');
  console.log('To import into Supabase:');
  console.log('1. Open Supabase SQL Editor');
  console.log(`2. Paste contents of ${path.basename(outputFile)}`);
  console.log('3. Run the query');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/process-bible-dataset.js <csv-file-path> [translation]');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/process-bible-dataset.js bible_kjv.csv KJV');
  console.log('  node scripts/process-bible-dataset.js bible_niv.csv NIV');
  console.log('');
  console.log('Download the dataset from:');
  console.log('https://www.kaggle.com/datasets/oswinrh/bible/data');
  process.exit(1);
}

const csvFile = args[0];
const translation = args[1] || 'NIV';

processBibleCSV(csvFile, translation);
