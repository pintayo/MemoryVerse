#!/bin/bash

# Supabase Database Backup Script
# Creates a full backup of your Supabase database (schema + data)

set -e  # Exit on error

echo "🔄 Starting Supabase Database Backup..."

# Create backups directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/supabase_backup_$TIMESTAMP.sql"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check if Supabase URL is set
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: EXPO_PUBLIC_SUPABASE_URL not found in .env"
    exit 1
fi

# Extract database connection details from Supabase URL
# Format: https://xxxxx.supabase.co
PROJECT_REF=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')

echo "📋 Project Reference: $PROJECT_REF"

# Supabase database connection details
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Prompt for database password
echo ""
echo "🔑 Please enter your Supabase database password:"
echo "   (You can find this in Supabase Dashboard > Project Settings > Database > Connection string)"
read -s DB_PASSWORD
echo ""

# Export password for pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump is not installed"
    echo ""
    echo "Install PostgreSQL client tools:"
    echo "  macOS:   brew install postgresql"
    echo "  Ubuntu:  sudo apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "📦 Backing up database to: $BACKUP_FILE"
echo ""

# Perform backup with pg_dump
# Options:
#   --host: Database host
#   --port: Database port
#   --username: Database user
#   --dbname: Database name
#   --no-password: Don't prompt for password (we set PGPASSWORD)
#   --format=plain: Plain SQL format (easy to read and edit)
#   --file: Output file
#   --verbose: Show progress
#   --clean: Add DROP statements
#   --if-exists: Use IF EXISTS for DROP statements
#   --no-owner: Don't set ownership
#   --no-privileges: Don't dump privileges

pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --no-password \
    --format=plain \
    --file="$BACKUP_FILE" \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges

# Unset password
unset PGPASSWORD

# Check if backup was successful
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo ""
    echo "✅ Backup completed successfully!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $BACKUP_SIZE"
    echo ""

    # Also create a compressed version
    echo "🗜️  Compressing backup..."
    gzip -c "$BACKUP_FILE" > "${BACKUP_FILE}.gz"
    COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "   Compressed: ${BACKUP_FILE}.gz"
    echo "   Size: $COMPRESSED_SIZE"
    echo ""

    echo "📁 Backup files:"
    ls -lh "$BACKUP_DIR" | tail -n +2
    echo ""

    echo "💡 To restore this backup later, run:"
    echo "   ./scripts/restore-database.sh $BACKUP_FILE"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo ""
echo "🎉 All done!"
