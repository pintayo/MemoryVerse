# Database Backup & Restore Scripts

Quick scripts to backup and restore your Supabase database.

## 📦 Backup Your Database

```bash
./scripts/backup-database.sh
```

**What it does:**
- Creates a full backup of your Supabase database (schema + all data)
- Saves to `./backups/supabase_backup_TIMESTAMP.sql`
- Also creates a compressed `.gz` version to save space
- Timestamped so you can keep multiple backups

**You'll need:**
- Your Supabase database password (from Supabase Dashboard > Project Settings > Database)
- PostgreSQL client tools installed (see below if not installed)

## 📥 Restore from Backup

```bash
./scripts/restore-database.sh ./backups/supabase_backup_YYYYMMDD_HHMMSS.sql
```

**Warning:** This will **replace** your current database with the backup!

## 🛠️ Installing PostgreSQL Client Tools

If you get an error that `pg_dump` or `psql` is not installed:

**macOS:**
```bash
brew install postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Install the "Command Line Tools" option

## 📋 Getting Your Database Password

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click **Database**
5. Scroll to **Connection string**
6. Click **Show** next to the password field
7. Copy the password (starts with `postgres://postgres:[password]...`)

## 💡 Tips

- **Before production setup:** Always backup first!
- **Before schema changes:** Create a backup
- **Regular backups:** Run weekly backups to be safe
- **Compressed files:** The `.gz` files are much smaller and can be restored directly

## 🗂️ Backup Files

Backups are saved to `./backups/` with this structure:
```
backups/
├── supabase_backup_20250110_143022.sql      (Full SQL backup)
└── supabase_backup_20250110_143022.sql.gz   (Compressed version)
```

The `backups/` folder is automatically ignored by git, so your database data stays private.

## ❓ Troubleshooting

**"Connection refused"**
- Check your Supabase project is running
- Verify your database password is correct

**"pg_dump: command not found"**
- Install PostgreSQL client tools (see above)

**"Authentication failed"**
- Double-check your database password
- Make sure you copied the password from the connection string, not the API keys
