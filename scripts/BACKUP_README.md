# Database Backup & Restore Scripts

Quick scripts to backup and restore your Supabase database. **Works on macOS, Windows, and Linux!**

## 🚀 Quick Start

### Option 1: Node.js Scripts (Recommended - Works Everywhere!)

**Backup:**
```bash
node scripts/backup-database.js
```

**Restore:**
```bash
node scripts/restore-database.js ./backups/supabase_backup_YYYYMMDD_HHMMSS.sql
```

✅ **Advantages:**
- Works on macOS, Windows, and Linux
- No need to install bash on Windows
- Better error messages and colored output
- Automatic compression

### Option 2: Bash Scripts (macOS/Linux only)

**Backup:**
```bash
./scripts/backup-database.sh
```

**Restore:**
```bash
./scripts/restore-database.sh ./backups/supabase_backup_YYYYMMDD_HHMMSS.sql
```

✅ **Use this if:**
- You prefer bash scripts
- You're on macOS/Linux only

---

## 📦 What Does Backup Do?

- Creates a full backup of your Supabase database (schema + all data)
- Saves to `./backups/supabase_backup_TIMESTAMP.sql`
- Also creates a compressed `.gz` version to save space
- Timestamped so you can keep multiple backups

**You'll need:**
- Your Supabase database password (see below)
- PostgreSQL client tools installed (see below if not installed)

## 📥 What Does Restore Do?

- Restores your database from a previous backup
- **Warning:** This will **replace** your current database!

---

## 🛠️ Installing PostgreSQL Client Tools

If you get an error that `pg_dump` or `psql` is not installed:

### macOS:
```bash
brew install postgresql
```

### Windows:
1. Download the PostgreSQL installer from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Select **"Command Line Tools"** during installation
4. Add PostgreSQL to your PATH (installer does this automatically)
5. Restart your terminal/command prompt

### Ubuntu/Debian:
```bash
sudo apt-get install postgresql-client
```

### Verify Installation:
```bash
pg_dump --version
psql --version
```

---

## 🔑 Getting Your Database Password

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **MemoryVerse** project
3. Click **Project Settings** (gear icon in bottom left)
4. Click **Database** tab
5. Scroll to **Connection string**
6. Click the **URI** tab
7. Copy the password from the connection string:
   ```
   postgresql://postgres:[THIS_IS_YOUR_PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

**Note:** This is your **database password**, not your Supabase dashboard password or API keys!

---

## 💡 When to Backup

✅ **Right now** - Before running production setup queries
✅ **Before schema changes** - Before adding/modifying tables
✅ **Weekly backups** - Set a reminder for regular backups
✅ **Before major updates** - Before deploying big features

---

## 🗂️ Backup Files Location

Backups are saved to `./backups/` with this structure:
```
backups/
├── supabase_backup_20250110_143022.sql      (Full SQL - 2.4 MB)
└── supabase_backup_20250110_143022.sql.gz   (Compressed - 480 KB)
```

The `backups/` folder is automatically ignored by git, so your database data stays private.

---

## 📋 Example Workflow

### 1. Backup Before Production Setup
```bash
# Backup your database
node scripts/backup-database.js

# You'll see:
# 🔄 Starting Supabase Database Backup...
# 📋 Project Reference: xxxxx
# 🔑 Please enter your Supabase database password:
# [enter your password]
# ✅ Backup completed successfully!
#    File: ./backups/supabase_backup_20250110_143022.sql
#    Size: 2.4 MB
```

### 2. Run Production Setup
```bash
# Now safe to run production queries
# Follow PRODUCTION_SETUP.md
```

### 3. If Something Goes Wrong - Restore
```bash
# Restore from your backup
node scripts/restore-database.js ./backups/supabase_backup_20250110_143022.sql

# You'll see:
# 🔄 Starting Supabase Database Restore...
# ⚠️  WARNING: This will REPLACE your current database!
# Are you sure you want to continue? (yes/no): yes
# ✅ Database restored successfully!
```

---

## ❓ Troubleshooting

### "Connection refused" or "could not connect to server"
- Check your Supabase project is running
- Verify your database password is correct
- Check your internet connection

### "pg_dump: command not found" or "psql: command not found"
- Install PostgreSQL client tools (see above)
- On Windows: Make sure PostgreSQL is in your PATH
- Restart your terminal after installation

### "password authentication failed"
- Double-check your database password
- Make sure you copied the password from the **connection string**, not the API keys
- The password is in this format: `postgresql://postgres:[PASSWORD]@...`

### On Windows: "Access is denied"
- Run Command Prompt or PowerShell as Administrator
- Or check PostgreSQL is in your PATH: `where pg_dump`

### Backup/Restore is very slow
- Normal for large databases (500+ MB)
- Compressed `.gz` files are smaller and faster to transfer
- Can restore directly from `.gz` files

---

## 🎯 Pro Tips

1. **Keep Multiple Backups**: The scripts create timestamped files, so you can keep several backups
2. **Use Compressed Files**: The `.gz` files are much smaller (often 5-10x smaller)
3. **Test Your Backups**: Occasionally test restoring to a test database
4. **Backup Before Updates**: Always backup before schema changes or major updates
5. **Store Offsite**: Copy important backups to cloud storage (Google Drive, Dropbox, etc.)

---

## 🔐 Security Notes

- **Never commit backups to git** (already in `.gitignore`)
- **Never share your database password**
- **Backups contain all your data** - keep them secure
- **Use environment variables** - password is never stored in scripts

---

## 📞 Need Help?

If you run into issues:
1. Check the error message carefully
2. Verify PostgreSQL is installed: `pg_dump --version`
3. Verify your database password is correct
4. Check the Supabase dashboard to ensure your project is running

Still stuck? The error messages should guide you to the solution!
