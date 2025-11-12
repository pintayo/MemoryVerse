#!/usr/bin/env node

/**
 * Apply Verse Quality Filtering
 *
 * This script applies comprehensive verse quality filtering to mark verses as
 * memorable or not memorable for daily devotionals and memorization.
 *
 * It filters out:
 * - Genealogies and census data
 * - Lists of names and places
 * - Transition/connector verses
 * - Obscure prophetic imagery
 * - Boundary descriptions
 *
 * It marks as memorable:
 * - Psalms and Proverbs
 * - Major teaching sections (Sermon on the Mount, Romans, etc.)
 * - Famous verses
 * - Gospel narratives
 * - Promises, commands, and comfort verses
 *
 * Usage:
 *   1. Set DATABASE_URL in .env file
 *   2. Run: node scripts/applyVerseQualityFiltering.js [translation]
 *
 *   Examples:
 *     node scripts/applyVerseQualityFiltering.js           # Apply to all translations
 *     node scripts/applyVerseQualityFiltering.js KJV       # Apply to KJV only
 *     node scripts/applyVerseQualityFiltering.js ASV,WEB   # Apply to ASV and WEB
 *
 * Requirements:
 *   npm install postgres dotenv
 */

require('dotenv').config();

// Dynamic import for postgres (ESM module)
let postgres;

const ALL_TRANSLATIONS = ['KJV', 'ASV', 'BBE', 'DBY', 'WBT', 'WEB', 'YLT'];

async function loadPostgres() {
  try {
    const postgresModule = await import('postgres');
    postgres = postgresModule.default;
  } catch (error) {
    console.error('\n❌ Error: postgres package not found');
    console.log('\n📦 Please install required dependencies:');
    console.log('   npm install postgres dotenv\n');
    process.exit(1);
  }
}

/**
 * Apply quality filtering for a specific set of translations
 */
async function applyQualityFiltering(sql, translations) {
  console.log('\n📖 Applying verse quality filtering...');
  console.log(`   Translations: ${translations.join(', ')}`);

  const translationList = translations.map(t => `'${t}'`).join(', ');
  const whereClause = `translation IN (${translationList})`;

  try {
    // ==========================================================================
    // PART 1: Filter Out Low-Quality Verses
    // ==========================================================================

    console.log('\n🔧 Part 1: Filtering out low-quality verses...');

    // Step 1: Reset all verses to not memorable first
    console.log('   → Resetting all verses to not memorable...');
    await sql`
      UPDATE verses
      SET is_memorable = false,
          verse_category = 'general'
      WHERE ${sql.unsafe(whereClause)}
    `;

    // Step 2: Mark entire books/sections with mostly genealogies/lists
    console.log('   → Filtering genealogy chapters...');
    await sql`
      UPDATE verses
      SET is_memorable = false,
          verse_category = 'genealogy'
      WHERE
        ${sql.unsafe(whereClause)} AND
        (
          (book = '1 Chronicles' AND chapter BETWEEN 1 AND 9) OR
          (book = 'Genesis' AND chapter IN (5, 10, 11, 36, 46)) OR
          (book = 'Numbers' AND chapter IN (1, 2, 3, 4, 7, 26)) OR
          (book = 'Ezra' AND chapter IN (2, 8, 10)) OR
          (book = 'Nehemiah' AND chapter IN (7, 11, 12))
        )
    `;

    // Step 3: Mark census and counting verses
    console.log('   → Filtering census data...');
    await sql`
      UPDATE verses
      SET is_memorable = false,
          verse_category = 'census'
      WHERE
        ${sql.unsafe(whereClause)} AND
        is_memorable = true AND
        (
          text ~ '\\d{3,}' OR
          text ~ '\\d+,\\d+' OR
          text ILIKE '%thousand%' AND text ILIKE '%hundred%' OR
          text ILIKE 'The children of%' AND text ~ '\\d+' OR
          text ILIKE 'The men of%' AND text ~ '\\d+'
        )
    `;

    // Step 4: Mark lists of places/names
    console.log('   → Filtering lists of names/places...');
    await sql`
      UPDATE verses
      SET is_memorable = false,
          verse_category = 'lists'
      WHERE
        ${sql.unsafe(whereClause)} AND
        is_memorable = true AND
        (
          text ~ '(,\\s+and\\s+[A-Z][a-z]+){2,}' OR
          text ~ '([A-Z][a-z]+,\\s+){3,}' OR
          text ILIKE '%Hittites%' OR
          text ILIKE '%Canaanites%' OR
          (LENGTH(text) < 150 AND text ~ '(and\\s+the\\s+[a-z]+,?\\s+){3,}')
        )
    `;

    // Step 5: Mark transition/connector verses (KJV-specific patterns)
    if (translations.includes('KJV')) {
      console.log('   → Filtering transition verses (KJV)...');
      await sql`
        UPDATE verses
        SET is_memorable = false,
            verse_category = 'transition'
        WHERE
          translation = 'KJV' AND
          is_memorable = true AND
          (
            text = 'And the LORD spake unto Moses, saying,' OR
            text ILIKE 'And the word of the LORD came%saying,' OR
            (LENGTH(text) < 60 AND text ILIKE 'And the LORD said%')
          )
      `;
    }

    // Step 6: Mark very short verses (fragments)
    console.log('   → Filtering very short verses...');
    await sql`
      UPDATE verses
      SET is_memorable = false,
          verse_category = 'fragment'
      WHERE
        ${sql.unsafe(whereClause)} AND
        is_memorable = true AND
        LENGTH(text) < 25
    `;

    // Step 7: Mark obscure prophetic imagery
    console.log('   → Filtering obscure prophecy...');
    await sql`
      UPDATE verses
      SET is_memorable = false,
          verse_category = 'prophecy_obscure'
      WHERE
        ${sql.unsafe(whereClause)} AND
        is_memorable = true AND
        (
          (book = 'Ezekiel' AND chapter BETWEEN 40 AND 48) OR
          (book = 'Revelation' AND
           (text ILIKE '%sardine%' OR
            text ILIKE '%sardius%' OR
            text ILIKE '%chrysolite%' OR
            text ILIKE '%beryl%' OR
            text ILIKE '%topaz%' OR
            text ~ '(and\\s+[a-z]+\\s+){5,}'))
        )
    `;

    // Step 8: Mark territorial boundary descriptions
    console.log('   → Filtering boundary descriptions...');
    await sql`
      UPDATE verses
      SET is_memorable = false,
          verse_category = 'boundaries'
      WHERE
        ${sql.unsafe(whereClause)} AND
        is_memorable = true AND
        (
          (book IN ('Joshua', 'Numbers') AND
           (text ILIKE '%border%' OR
            text ILIKE '%coast%' OR
            text ILIKE '%goeth out%' AND text ILIKE '%goeth%' OR
            text ILIKE '%unto%' AND text ILIKE '%from%' AND LENGTH(text) < 120))
        )
    `;

    // ==========================================================================
    // PART 2: Mark High-Quality Verses as Memorable
    // ==========================================================================

    console.log('\n✨ Part 2: Marking high-quality verses as memorable...');

    // Step 1: Mark entire Psalms (except very long ones)
    console.log('   → Marking Psalms...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'praise',
          memorization_difficulty = CASE
            WHEN LENGTH(text) <= 150 THEN 'easy'
            WHEN LENGTH(text) <= 250 THEN 'medium'
            ELSE 'hard'
          END
      WHERE
        ${sql.unsafe(whereClause)} AND
        book = 'Psalms' AND
        LENGTH(text) >= 20 AND
        LENGTH(text) <= 400
    `;

    // Step 2: Mark entire Proverbs (wisdom)
    console.log('   → Marking Proverbs...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'wisdom',
          memorization_difficulty = CASE
            WHEN LENGTH(text) <= 150 THEN 'easy'
            ELSE 'medium'
          END
      WHERE
        ${sql.unsafe(whereClause)} AND
        book = 'Proverbs' AND
        LENGTH(text) >= 25 AND
        LENGTH(text) <= 300
    `;

    // Step 3: Mark other wisdom literature
    console.log('   → Marking wisdom literature...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'wisdom',
          memorization_difficulty = 'medium'
      WHERE
        ${sql.unsafe(whereClause)} AND
        book IN ('Ecclesiastes', 'Job', 'Song of Solomon') AND
        LENGTH(text) >= 30 AND
        LENGTH(text) <= 300 AND
        NOT (text ~ '([A-Z][a-z]+,?\\s+){3,}')
    `;

    // Step 4: Mark major teaching sections
    console.log('   → Marking major teaching sections...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'teaching',
          memorization_difficulty = CASE
            WHEN LENGTH(text) <= 150 THEN 'easy'
            WHEN LENGTH(text) <= 250 THEN 'medium'
            ELSE 'hard'
          END
      WHERE
        ${sql.unsafe(whereClause)} AND
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
        )
    `;

    // Step 5: Mark famous verses (work across all translations)
    console.log('   → Marking famous verses...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'famous',
          memorization_difficulty = 'easy'
      WHERE
        ${sql.unsafe(whereClause)} AND
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
        )
    `;

    // Step 6: Mark Gospel teachings
    console.log('   → Marking Gospel narratives...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'gospel',
          memorization_difficulty = 'medium'
      WHERE
        ${sql.unsafe(whereClause)} AND
        book IN ('Matthew', 'Mark', 'Luke', 'John') AND
        LENGTH(text) >= 30 AND
        LENGTH(text) <= 300
    `;

    // Step 7: Mark promises (structure-based, works across translations)
    console.log('   → Marking promises...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'promise',
          memorization_difficulty = 'easy'
      WHERE
        ${sql.unsafe(whereClause)} AND
        LENGTH(text) >= 30 AND
        LENGTH(text) <= 250 AND
        (
          (book = 'Jeremiah' AND chapter = 29) OR
          (book = 'Isaiah' AND chapter IN (40, 41, 43)) OR
          (book = 'Psalms' AND chapter IN (23, 91, 121)) OR
          (book = 'Romans' AND chapter = 8) OR
          (book = 'Philippians' AND chapter = 4)
        )
    `;

    // Step 8: Mark commands (structure-based)
    console.log('   → Marking commands...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'command',
          memorization_difficulty = 'easy'
      WHERE
        ${sql.unsafe(whereClause)} AND
        LENGTH(text) >= 25 AND
        LENGTH(text) <= 200 AND
        (
          (book = 'Proverbs' AND chapter = 3) OR
          (book = 'Matthew' AND chapter BETWEEN 5 AND 7) OR
          (book = 'John' AND chapter BETWEEN 13 AND 17) OR
          (book = 'Ephesians' AND chapter BETWEEN 4 AND 6)
        )
    `;

    // Step 9: Mark comfort verses (structure-based)
    console.log('   → Marking comfort verses...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'comfort',
          memorization_difficulty = 'easy'
      WHERE
        ${sql.unsafe(whereClause)} AND
        LENGTH(text) >= 30 AND
        LENGTH(text) <= 250 AND
        (
          (book = 'Psalms' AND chapter IN (23, 27, 46, 91)) OR
          (book = 'Isaiah' AND chapter = 40) OR
          (book = '2 Corinthians' AND chapter = 1) OR
          (book = 'Matthew' AND chapter = 11 AND verse_number BETWEEN 28 AND 30)
        )
    `;

    // Step 10: Mark love verses (structure-based)
    console.log('   → Marking love verses...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'love',
          memorization_difficulty = 'easy'
      WHERE
        ${sql.unsafe(whereClause)} AND
        LENGTH(text) >= 25 AND
        LENGTH(text) <= 250 AND
        (
          (book = '1 Corinthians' AND chapter = 13) OR
          (book = '1 John' AND chapter = 4) OR
          (book = 'John' AND chapter = 3 AND verse_number = 16)
        )
    `;

    // Step 11: Mark creation account
    console.log('   → Marking creation account...');
    await sql`
      UPDATE verses
      SET is_memorable = true,
          verse_category = 'narrative',
          memorization_difficulty = 'medium'
      WHERE
        ${sql.unsafe(whereClause)} AND
        book = 'Genesis' AND
        chapter IN (1, 2) AND
        LENGTH(text) >= 20 AND
        LENGTH(text) <= 300
    `;

    console.log('\n✅ Filtering complete!');

    // Get statistics
    console.log('\n📊 Results:');
    for (const translation of translations) {
      const stats = await sql`
        SELECT
          is_memorable,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM verses WHERE translation = ${translation}), 2) as percentage
        FROM verses
        WHERE translation = ${translation}
        GROUP BY is_memorable
        ORDER BY is_memorable DESC
      `;

      console.log(`\n   ${translation}:`);
      for (const row of stats) {
        const status = row.is_memorable ? 'Memorable' : 'Filtered out';
        console.log(`      ${status}: ${row.count} verses (${row.percentage}%)`);
      }
    }

    return { success: true };

  } catch (error) {
    console.error('\n❌ Error applying quality filtering:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🎯 Verse Quality Filtering Script');
  console.log('=====================================\n');

  // Load postgres module
  await loadPostgres();

  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL not found in .env file\n');
    console.log('Please add your Supabase database URL to .env:');
    console.log('DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres\n');
    process.exit(1);
  }

  // Parse command line arguments for translations
  const args = process.argv.slice(2);
  let translations = ALL_TRANSLATIONS;

  if (args.length > 0) {
    translations = args[0].split(',').map(t => t.trim().toUpperCase());

    // Validate translations
    const invalid = translations.filter(t => !ALL_TRANSLATIONS.includes(t));
    if (invalid.length > 0) {
      console.error(`❌ Error: Invalid translation(s): ${invalid.join(', ')}`);
      console.log(`\nValid translations: ${ALL_TRANSLATIONS.join(', ')}`);
      process.exit(1);
    }
  }

  // Create postgres connection
  const sql = postgres(databaseUrl, {
    max: 1, // Single connection for sequential operations
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Test connection
    await sql`SELECT 1`;
    console.log('✅ Database connection established\n');

    // Apply filtering
    const result = await applyQualityFiltering(sql, translations);

    if (result.success) {
      console.log('\n✅ All done! Verse quality filtering has been applied.');
      console.log('\n💡 Tip: You can re-run this script anytime to update the filtering logic.\n');
    } else {
      console.error('\n❌ Filtering failed:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Database connection error:', error.message);
    console.log('\nPlease check your DATABASE_URL in .env file.\n');
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the script
main().catch(console.error);
