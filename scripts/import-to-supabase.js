#!/usr/bin/env node

/**
 * Import Bible SQL files directly to Supabase
 *
 * This script imports generated Bible verse SQL files directly to your
 * Supabase PostgreSQL database, bypassing the dashboard's API limits.
 *
 * Usage:
 *   1. Set DATABASE_URL in .env file
 *   2. Run: node scripts/import-to-supabase.js
 *
 * Requirements:
 *   npm install postgres dotenv
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Dynamic import for postgres (ESM module)
let postgres;

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
 * Import a single SQL file to the database
 */
async function importSQLFile(sql, filePath, translationCode) {
  console.log(`\n📖 Importing ${translationCode}...`);
  console.log(`   File: ${path.basename(filePath)}`);

  if (!fs.existsSync(filePath)) {
    console.error(`   ❌ Error: File not found: ${filePath}`);
    return { success: false, error: 'File not found' };
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileSizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
    console.log(`   📄 File size: ${fileSizeMB} MB`);

    // Parse SQL file to count verses (rough estimate)
    const insertMatches = fileContent.match(/INSERT INTO/gi);
    const verseCount = insertMatches ? insertMatches.length * 500 : 0; // ~500 verses per batch
    console.log(`   📊 Estimated verses: ~${verseCount.toLocaleString()}`);

    console.log(`   ⏳ Executing SQL...`);
    const startTime = Date.now();

    // Execute the SQL file
    await sql.unsafe(fileContent);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Import completed in ${duration}s`);

    return { success: true, duration };

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Supabase Bible Importer\n');

  // Load postgres module
  await loadPostgres();

  // Check for DATABASE_URL
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not found in environment variables\n');
    console.log('Please create a .env file with your Supabase connection string:');
    console.log('');
    console.log('DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres');
    console.log('');
    console.log('You can find this in your Supabase dashboard:');
    console.log('Project Settings → Database → Connection String → Direct connection');
    console.log('');
    process.exit(1);
  }

  // Mask password in connection string for display
  const maskedConnection = connectionString.replace(/:([^@]+)@/, ':****@');
  console.log(`🔌 Connecting to: ${maskedConnection}\n`);

  let sql;
  try {
    // Create database connection
    sql = postgres(connectionString, {
      max: 1, // Use single connection for sequential imports
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Test connection
    console.log('🔍 Testing connection...');
    await sql`SELECT version()`;
    console.log('✅ Connection successful!\n');

  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}\n`);
    console.log('Please check:');
    console.log('1. Your DATABASE_URL is correct');
    console.log('2. Your database password is correct');
    console.log('3. You can connect to Supabase (not behind IPv4-only network)');
    console.log('');
    process.exit(1);
  }

  const supabaseDir = path.join(__dirname, '..', 'supabase');

  if (!fs.existsSync(supabaseDir)) {
    console.error(`❌ Error: Supabase directory not found: ${supabaseDir}\n`);
    console.log('Please run the processing script first:');
    console.log('  node scripts/process-bible-dataset.js');
    console.log('');
    await sql.end();
    process.exit(1);
  }

  // Find all SQL files
  const sqlFiles = fs.readdirSync(supabaseDir)
    .filter(f => f.startsWith('bible_verses_') && f.endsWith('.sql'))
    .sort();

  if (sqlFiles.length === 0) {
    console.error(`❌ Error: No SQL files found in ${supabaseDir}\n`);
    console.log('Please run the processing script first:');
    console.log('  node scripts/process-bible-dataset.js');
    console.log('');
    await sql.end();
    process.exit(1);
  }

  console.log(`Found ${sqlFiles.length} SQL file(s) to import:\n`);
  sqlFiles.forEach(f => {
    const code = f.replace('bible_verses_', '').replace('.sql', '').toUpperCase();
    console.log(`  📄 ${code}: ${f}`);
  });

  console.log('\n' + '─'.repeat(60));

  // Import each SQL file
  const results = [];
  for (const sqlFile of sqlFiles) {
    const filePath = path.join(supabaseDir, sqlFile);
    const translationCode = sqlFile
      .replace('bible_verses_', '')
      .replace('.sql', '')
      .toUpperCase();

    const result = await importSQLFile(sql, filePath, translationCode);
    results.push({
      file: sqlFile,
      translation: translationCode,
      ...result
    });

    console.log('─'.repeat(60));
  }

  // Print summary
  console.log('\n🎉 Import Complete!\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    console.log('✅ Successfully imported:');
    successful.forEach(r => {
      console.log(`   ${r.translation}: ${r.duration}s`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed imports:');
    failed.forEach(r => {
      console.log(`   ${r.translation}: ${r.error}`);
    });
  }

  // Verify import
  console.log('\n📊 Verifying database...');
  try {
    const result = await sql`
      SELECT translation, COUNT(*) as verse_count
      FROM public.verses
      GROUP BY translation
      ORDER BY translation
    `;

    console.log('\nVerse counts by translation:');
    result.forEach(row => {
      console.log(`   ${row.translation}: ${parseInt(row.verse_count).toLocaleString()} verses`);
    });

    const totalVerses = result.reduce((sum, row) => sum + parseInt(row.verse_count), 0);
    console.log(`\n📖 Total verses in database: ${totalVerses.toLocaleString()}`);

  } catch (error) {
    console.log(`\n⚠️  Could not verify: ${error.message}`);
  }

  // Close connection
  await sql.end();
  console.log('\n✅ All done!\n');
}

// Run the script
main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
