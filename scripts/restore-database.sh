#!/bin/bash

# Supabase Database Restore Script
# Restores a database backup to your Supabase database

set -e  # Exit on error

echo "🔄 Starting Supabase Database Restore..."

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified"
    echo ""
    echo "Usage: ./scripts/restore-database.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/*.sql 2>/dev/null || echo "  (no backups found)"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# If file is compressed, decompress it first
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Decompressing backup..."
    DECOMPRESSED_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$DECOMPRESSED_FILE"
    BACKUP_FILE="$DECOMPRESSED_FILE"
fi

echo "📋 Backup file: $BACKUP_FILE"

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

# Extract database connection details
PROJECT_REF=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')

echo "📋 Project Reference: $PROJECT_REF"

# Supabase database connection details
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Warning
echo ""
echo "⚠️  WARNING: This will REPLACE your current database with the backup!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Prompt for database password
echo ""
echo "🔑 Please enter your Supabase database password:"
read -s DB_PASSWORD
echo ""

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo ""
    echo "Install PostgreSQL client tools:"
    echo "  macOS:   brew install postgresql"
    echo "  Ubuntu:  sudo apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "📥 Restoring database from: $BACKUP_FILE"
echo ""

# Perform restore with psql
psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --file="$BACKUP_FILE"

# Unset password
unset PGPASSWORD

echo ""
echo "✅ Database restored successfully!"
echo ""
echo "🎉 All done!"
