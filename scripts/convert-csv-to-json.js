#!/usr/bin/env node

/**
 * Convert Bible CSV files to JSON format
 *
 * Converts Kaggle Bible CSV files (t_*.csv) to the same JSON format
 * used by bible_kjv.json and bible_web.json
 *
 * Expected CSV format: id,b,c,v,t
 * - id: verse ID (BBCCCVVV format)
 * - b: book number (1-66)
 * - c: chapter number
 * - v: verse number
 * - t: verse text
 *
 * Output JSON format: [{"book":"Genesis","chapter":1,"verse":1,"text":"..."}]
 *
 * Usage:
 *   node scripts/convert-csv-to-json.js
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

/**
 * Parse CSV line (handles quoted fields with commas and escaped quotes)
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && nextChar === '"' && inQuotes) {
      // Escaped quote inside quoted field
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      // Toggle quote mode
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Field separator (only outside quotes)
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  fields.push(current);

  return fields;
}

/**
 * Convert CSV file to JSON
 */
function convertCSVToJSON(csvFilePath, translationCode) {
  console.log(`\n📖 Converting ${path.basename(csvFilePath)}...`);
  console.log(`   Translation: ${translationCode}`);

  if (!fs.existsSync(csvFilePath)) {
    console.error(`   ❌ Error: File not found: ${csvFilePath}`);
    return { success: false, error: 'File not found' };
  }

  try {
    // Read CSV file
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = fileContent.split('\n');

    // Skip header line (id,b,c,v,t)
    const headerLine = lines[0].trim();
    console.log(`   Header: ${headerLine}`);

    if (!headerLine.includes('id,b,c,v,t')) {
      console.log('   ⚠️  Warning: Expected header format "id,b,c,v,t"');
    }

    const verses = [];
    let processedCount = 0;
    let skippedCount = 0;

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const fields = parseCSVLine(line);

        // Expected format: id,b,c,v,t
        if (fields.length < 5) {
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
          console.log(`   ⚠️  Skipping line ${i}: Unknown book number ${bookNumber}`);
          skippedCount++;
          continue;
        }

        verses.push({
          book: bookName,
          chapter: parseInt(chapter),
          verse: parseInt(verseNum),
          text: text.trim()
        });

        processedCount++;

        if (processedCount % 5000 === 0) {
          process.stdout.write(`\r   Progress: ${processedCount} verses...`);
        }

      } catch (error) {
        console.log(`\n   ⚠️  Error processing line ${i}: ${error.message}`);
        skippedCount++;
      }
    }

    console.log(`\n   ✅ Processed ${processedCount} verses`);
    if (skippedCount > 0) {
      console.log(`   ⚠️  Skipped ${skippedCount} invalid lines`);
    }

    // Save JSON file
    const outputDir = path.join(__dirname, '..', 'assets', 'translations');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `bible_${translationCode.toLowerCase()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(verses, null, 0));

    const fileSizeMB = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
    console.log(`   📄 Saved to: ${path.basename(outputFile)}`);
    console.log(`   💾 File size: ${fileSizeMB} MB`);

    return { success: true, verses: processedCount };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 CSV to JSON Converter for Bible Translations\n');

  const translationsDir = path.join(__dirname, '..', 'assets', 'translations');

  if (!fs.existsSync(translationsDir)) {
    console.error(`❌ Error: Translations directory not found: ${translationsDir}`);
    console.log('');
    console.log('Please create the directory and add your CSV files:');
    console.log('  mkdir -p assets/translations');
    process.exit(1);
  }

  // Find all CSV files starting with 't_'
  const csvFiles = fs.readdirSync(translationsDir)
    .filter(f => f.startsWith('t_') && f.endsWith('.csv'));

  if (csvFiles.length === 0) {
    console.error(`❌ Error: No t_*.csv files found in ${translationsDir}`);
    console.log('');
    console.log('Please download Bible CSV files from:');
    console.log('https://www.kaggle.com/datasets/oswinrh/bible/data');
    console.log('');
    console.log('Expected files: t_asv.csv, t_bbe.csv, t_dby.csv, t_kjv.csv, t_wbt.csv, t_web.csv, t_ylt.csv');
    process.exit(1);
  }

  console.log(`Found ${csvFiles.length} CSV file(s):\n`);
  csvFiles.forEach(f => console.log(`  📄 ${f}`));
  console.log('');

  // Process each CSV file
  const results = [];
  for (const csvFile of csvFiles) {
    const filePath = path.join(translationsDir, csvFile);

    // Extract translation code from filename (e.g., t_asv.csv -> ASV)
    const translationCode = csvFile
      .replace('t_', '')
      .replace('.csv', '')
      .toUpperCase();

    const result = convertCSVToJSON(filePath, translationCode);
    results.push({
      file: csvFile,
      translation: translationCode,
      ...result
    });

    console.log('─'.repeat(60));
  }

  // Print summary
  console.log('\n🎉 Conversion Complete!\n');
  console.log('Summary:');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  successful.forEach(r => {
    console.log(`  ✅ ${r.translation}: ${r.verses.toLocaleString()} verses`);
  });

  if (failed.length > 0) {
    console.log('\nFailed:');
    failed.forEach(r => {
      console.log(`  ❌ ${r.translation}: ${r.error}`);
    });
  }

  console.log('\n📝 Next steps:');
  console.log('1. Run: node scripts/process-bible-dataset.js');
  console.log('   This will generate SQL files for all translations');
  console.log('');
  console.log('2. Import the generated SQL files into Supabase');
  console.log('');
}

// Run the script
main();
