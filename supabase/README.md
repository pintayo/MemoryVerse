# MemoryVerse Supabase Setup

This directory contains the database schema and setup instructions for MemoryVerse.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Note your project URL and API keys

## Database Setup

### Step 1: Run the Schema SQL

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `schema.sql` and paste it into the editor
5. Click **Run** to execute the SQL

This will create:
- All database tables (profiles, verses, user_verse_progress, practice_sessions, achievements, daily_streaks)
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for auto-updating timestamps
- A trigger to automatically create profiles when users sign up
- Sample Bible verses for testing
- A leaderboard view

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env` in the project root
2. Fill in your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

### Step 3: Enable Email Auth (Optional)

If you want email/password authentication:

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates if desired

### Step 4: Add More Bible Verses (Optional)

The schema includes 8 sample verses. To add more:

1. Use the SQL Editor to insert verses:

```sql
INSERT INTO public.verses (book, chapter, verse_number, text, translation, category, difficulty)
VALUES ('Book', 1, 1, 'Verse text here', 'NIV', 'category', 1);
```

2. Or use a CSV import (see Supabase documentation)

## Database Schema Overview

### Tables

**profiles**
- Extends auth.users with app-specific user data
- Stores XP, level, streaks, preferences, and premium status
- Automatically created when a user signs up

**verses**
- Stores Bible verses with book, chapter, verse number
- Supports multiple translations (NIV, ESV, KJV, etc.)
- Includes categories (comfort, wisdom, promise) and difficulty ratings

**user_verse_progress**
- Tracks each user's progress on each verse
- Stores status (learning/reviewing/mastered), accuracy, attempts
- Used for spaced repetition scheduling

**practice_sessions**
- Records every practice attempt
- Stores user answers, accuracy, time spent, hints used, XP earned
- Used for analytics and mistake tracking

**achievements**
- Stores earned badges/achievements
- Badge types: first-verse, week-streak, perfect-recital, etc.

**daily_streaks**
- One record per user per day they practice
- Used to calculate and maintain streak counts

### Views

**leaderboard**
- Pre-computed view for leaderboard display
- Shows users ranked by XP with their stats

## Security

Row Level Security (RLS) is enabled on all tables:
- Users can only access their own data
- Verses are publicly readable to authenticated users
- All policies are defined in `schema.sql`

## Testing

After setup, you can test the database:

1. Sign up a test user in your app
2. Check that a profile was auto-created in the `profiles` table
3. Query the sample verses:

```sql
SELECT * FROM verses WHERE translation = 'NIV';
```

## Backup

Supabase automatically backs up your database. You can also:
1. Go to **Database** > **Backups** to manage backups
2. Export data via SQL Editor or API

## Troubleshooting

**Error: relation "public.profiles" does not exist**
- Make sure you ran the entire `schema.sql` script

**Error: permission denied for table**
- Check that RLS policies are set up correctly
- Verify you're using the authenticated user's ID

**No profile created after signup**
- Check the `on_auth_user_created` trigger is active
- Look at Supabase logs for any errors

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- MemoryVerse Issues: [GitHub repo link]
