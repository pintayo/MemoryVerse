#!/usr/bin/env node

/**
 * Supabase Database Backup Script (Cross-Platform)
 * Works on macOS, Windows, and Linux
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createGzip } = require('zlib');
const { pipeline } = require('stream');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ Error: .env file not found', colors.red);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });

  return env;
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/[:-]/g, '')
    .replace(/\..+/, '')
    .replace('T', '_');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function promptPassword(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    // Hide input for password
    const stdin = process.stdin;
    const originalWrite = stdin._write;

    if (process.platform !== 'win32') {
      stdin._write = function(chunk, encoding, callback) {
        // Don't echo password
        if (callback) callback();
      };
    }

    rl.question(question, (answer) => {
      rl.close();
      stdin._write = originalWrite;
      console.log(''); // New line after password
      resolve(answer);
    });
  });
}

async function compressFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const source = fs.createReadStream(inputPath);
    const destination = fs.createWriteStream(outputPath);
    const gzip = createGzip();

    pipeline(source, gzip, destination, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function runBackup() {
  log('\n🔄 Starting Supabase Database Backup...', colors.cyan);
  log('');

  // Create backups directory
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Load environment
  const env = loadEnv();
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    log('❌ Error: EXPO_PUBLIC_SUPABASE_URL not found in .env', colors.red);
    process.exit(1);
  }

  // Extract project reference
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  log(`📋 Project Reference: ${projectRef}`, colors.blue);

  // Database connection details
  const dbHost = `db.${projectRef}.supabase.co`;
  const dbPort = '5432';
  const dbName = 'postgres';
  const dbUser = 'postgres';

  // Generate backup filename
  const timestamp = getTimestamp();
  const backupFile = path.join(backupDir, `supabase_backup_${timestamp}.sql`);

  // Prompt for password
  log('');
  log('🔑 Please enter your Supabase database password:');
  log('   (Find it in: Supabase Dashboard > Project Settings > Database > Connection string)', colors.yellow);
  const dbPassword = await promptPassword('Password: ');

  if (!dbPassword) {
    log('❌ Error: Password is required', colors.red);
    process.exit(1);
  }

  // Check if pg_dump is installed
  const pgDumpCmd = process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump';

  log('');
  log(`📦 Backing up database to: ${backupFile}`, colors.cyan);
  log('');

  // Run pg_dump
  const args = [
    `--host=${dbHost}`,
    `--port=${dbPort}`,
    `--username=${dbUser}`,
    `--dbname=${dbName}`,
    '--no-password',
    '--format=plain',
    `--file=${backupFile}`,
    '--verbose',
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-privileges',
  ];

  const pgDump = spawn(pgDumpCmd, args, {
    env: {
      ...process.env,
      PGPASSWORD: dbPassword,
    },
    stdio: ['inherit', 'inherit', 'pipe'],
  });

  let errorOutput = '';
  pgDump.stderr.on('data', (data) => {
    errorOutput += data.toString();
    // pg_dump writes progress to stderr, so show it
    process.stderr.write(data);
  });

  pgDump.on('error', (err) => {
    if (err.code === 'ENOENT') {
      log('', colors.reset);
      log('❌ Error: pg_dump is not installed', colors.red);
      log('');
      log('Install PostgreSQL client tools:', colors.yellow);
      log('  macOS:   brew install postgresql');
      log('  Ubuntu:  sudo apt-get install postgresql-client');
      log('  Windows: Download from https://www.postgresql.org/download/windows/');
      process.exit(1);
    } else {
      log(`❌ Error: ${err.message}`, colors.red);
      process.exit(1);
    }
  });

  pgDump.on('close', async (code) => {
    if (code !== 0) {
      log('', colors.reset);
      log('❌ Backup failed!', colors.red);
      if (errorOutput.includes('password authentication failed')) {
        log('   Check your database password is correct', colors.yellow);
      }
      process.exit(1);
    }

    // Check if backup file exists
    if (!fs.existsSync(backupFile)) {
      log('❌ Backup failed! File was not created.', colors.red);
      process.exit(1);
    }

    const stats = fs.statSync(backupFile);
    const backupSize = formatBytes(stats.size);

    log('');
    log('✅ Backup completed successfully!', colors.green);
    log(`   File: ${backupFile}`, colors.green);
    log(`   Size: ${backupSize}`, colors.green);
    log('');

    // Compress backup
    log('🗜️  Compressing backup...', colors.cyan);
    const compressedFile = `${backupFile}.gz`;

    try {
      await compressFile(backupFile, compressedFile);
      const compressedStats = fs.statSync(compressedFile);
      const compressedSize = formatBytes(compressedStats.size);

      log(`   Compressed: ${compressedFile}`, colors.green);
      log(`   Size: ${compressedSize}`, colors.green);
    } catch (err) {
      log(`⚠️  Warning: Could not compress backup: ${err.message}`, colors.yellow);
    }

    log('');
    log('📁 Backup files:', colors.blue);
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('supabase_backup_'))
      .sort()
      .reverse();

    files.slice(0, 5).forEach(file => {
      const filePath = path.join(backupDir, file);
      const fileStats = fs.statSync(filePath);
      const fileSize = formatBytes(fileStats.size);
      log(`   ${file} (${fileSize})`);
    });

    log('');
    log('💡 To restore this backup later, run:', colors.yellow);
    log(`   node scripts/restore-database.js ${backupFile}`);
    log('');
    log('🎉 All done!', colors.green);
  });
}

// Run backup
runBackup().catch(err => {
  log(`❌ Error: ${err.message}`, colors.red);
  process.exit(1);
});
