#!/usr/bin/env node

/**
 * Supabase Database Restore Script (Cross-Platform)
 * Works on macOS, Windows, and Linux
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createGunzip } = require('zlib');
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

async function promptConfirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function decompressFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const source = fs.createReadStream(inputPath);
    const destination = fs.createWriteStream(outputPath);
    const gunzip = createGunzip();

    pipeline(source, gunzip, destination, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function runRestore() {
  log('\n🔄 Starting Supabase Database Restore...', colors.cyan);
  log('');

  // Check if backup file is provided
  const backupFile = process.argv[2];

  if (!backupFile) {
    log('❌ Error: No backup file specified', colors.red);
    log('');
    log('Usage: node scripts/restore-database.js <backup-file>', colors.yellow);
    log('');

    // List available backups
    const backupDir = path.join(__dirname, '..', 'backups');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'))
        .sort()
        .reverse();

      if (files.length > 0) {
        log('Available backups:', colors.blue);
        files.forEach(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          const size = formatBytes(stats.size);
          log(`  ${file} (${size})`);
        });
      } else {
        log('  (no backups found)', colors.yellow);
      }
    }

    process.exit(1);
  }

  // Resolve backup file path
  let resolvedBackupFile = backupFile;
  if (!path.isAbsolute(backupFile)) {
    resolvedBackupFile = path.resolve(process.cwd(), backupFile);
  }

  // Check if backup file exists
  if (!fs.existsSync(resolvedBackupFile)) {
    log(`❌ Error: Backup file not found: ${resolvedBackupFile}`, colors.red);
    process.exit(1);
  }

  log(`📋 Backup file: ${resolvedBackupFile}`, colors.blue);

  // If file is compressed, decompress it first
  let workingFile = resolvedBackupFile;
  if (resolvedBackupFile.endsWith('.gz')) {
    log('');
    log('📦 Decompressing backup...', colors.cyan);
    workingFile = resolvedBackupFile.replace(/\.gz$/, '');

    try {
      await decompressFile(resolvedBackupFile, workingFile);
      log('   Decompressed successfully', colors.green);
    } catch (err) {
      log(`❌ Error decompressing file: ${err.message}`, colors.red);
      process.exit(1);
    }
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

  // Warning
  log('');
  log('⚠️  WARNING: This will REPLACE your current database with the backup!', colors.yellow);
  log('');

  const confirmed = await promptConfirm('Are you sure you want to continue? (yes/no): ');

  if (!confirmed) {
    log('❌ Restore cancelled', colors.red);

    // Clean up decompressed file if we created it
    if (workingFile !== resolvedBackupFile && fs.existsSync(workingFile)) {
      fs.unlinkSync(workingFile);
    }

    process.exit(0);
  }

  // Prompt for password
  log('');
  log('🔑 Please enter your Supabase database password:');
  const dbPassword = await promptPassword('Password: ');

  if (!dbPassword) {
    log('❌ Error: Password is required', colors.red);
    process.exit(1);
  }

  // Check if psql is installed
  const psqlCmd = process.platform === 'win32' ? 'psql.exe' : 'psql';

  log('');
  log(`📥 Restoring database from: ${workingFile}`, colors.cyan);
  log('');

  // Run psql
  const args = [
    `--host=${dbHost}`,
    `--port=${dbPort}`,
    `--username=${dbUser}`,
    `--dbname=${dbName}`,
    `--file=${workingFile}`,
  ];

  const psql = spawn(psqlCmd, args, {
    env: {
      ...process.env,
      PGPASSWORD: dbPassword,
    },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  let output = '';
  let errorOutput = '';

  psql.stdout.on('data', (data) => {
    output += data.toString();
    process.stdout.write(data);
  });

  psql.stderr.on('data', (data) => {
    errorOutput += data.toString();
    process.stderr.write(data);
  });

  psql.on('error', (err) => {
    if (err.code === 'ENOENT') {
      log('', colors.reset);
      log('❌ Error: psql is not installed', colors.red);
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

  psql.on('close', (code) => {
    // Clean up decompressed file if we created it
    if (workingFile !== resolvedBackupFile && fs.existsSync(workingFile)) {
      fs.unlinkSync(workingFile);
    }

    if (code !== 0) {
      log('', colors.reset);
      log('❌ Restore failed!', colors.red);
      if (errorOutput.includes('password authentication failed')) {
        log('   Check your database password is correct', colors.yellow);
      }
      process.exit(1);
    }

    log('');
    log('✅ Database restored successfully!', colors.green);
    log('');
    log('🎉 All done!', colors.green);
  });
}

// Run restore
runRestore().catch(err => {
  log(`❌ Error: ${err.message}`, colors.red);
  process.exit(1);
});
