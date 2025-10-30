/**
 * Create Test Users Script
 *
 * This script creates test users in Supabase Auth and their corresponding profiles.
 * Run with: npx ts-node scripts/create-test-users.ts
 *
 * Make sure you have the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars set.
 * The SERVICE_ROLE_KEY is needed to create users programmatically.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  avatar: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  verses_memorized: number;
}

const testUsers: TestUser[] = [
  {
    email: 'pintayo@memoryverse.app',
    password: 'Tijdelijk123',
    full_name: 'Pintayo',
    avatar: '🎯',
    total_xp: 450,
    current_streak: 3,
    longest_streak: 5,
    verses_memorized: 12,
  },
  {
    email: 'sarah.johnson@test.com',
    password: 'TestPass123',
    full_name: 'Sarah Johnson',
    avatar: '👩',
    total_xp: 2450,
    current_streak: 28,
    longest_streak: 35,
    verses_memorized: 78,
  },
  {
    email: 'david.chen@test.com',
    password: 'TestPass123',
    full_name: 'David Chen',
    avatar: '👨',
    total_xp: 2100,
    current_streak: 21,
    longest_streak: 28,
    verses_memorized: 65,
  },
  {
    email: 'maria.garcia@test.com',
    password: 'TestPass123',
    full_name: 'Maria Garcia',
    avatar: '👩‍🦱',
    total_xp: 1820,
    current_streak: 14,
    longest_streak: 21,
    verses_memorized: 52,
  },
  {
    email: 'james.wilson@test.com',
    password: 'TestPass123',
    full_name: 'James Wilson',
    avatar: '🧔',
    total_xp: 1650,
    current_streak: 12,
    longest_streak: 18,
    verses_memorized: 48,
  },
  {
    email: 'emma.brown@test.com',
    password: 'TestPass123',
    full_name: 'Emma Brown',
    avatar: '👱‍♀️',
    total_xp: 1200,
    current_streak: 8,
    longest_streak: 15,
    verses_memorized: 38,
  },
  {
    email: 'michael.davis@test.com',
    password: 'TestPass123',
    full_name: 'Michael Davis',
    avatar: '👨‍💼',
    total_xp: 980,
    current_streak: 7,
    longest_streak: 12,
    verses_memorized: 32,
  },
  {
    email: 'olivia.miller@test.com',
    password: 'TestPass123',
    full_name: 'Olivia Miller',
    avatar: '👩‍🎓',
    total_xp: 720,
    current_streak: 5,
    longest_streak: 9,
    verses_memorized: 24,
  },
  {
    email: 'william.moore@test.com',
    password: 'TestPass123',
    full_name: 'William Moore',
    avatar: '👨‍🔬',
    total_xp: 350,
    current_streak: 3,
    longest_streak: 6,
    verses_memorized: 15,
  },
  {
    email: 'sophia.taylor@test.com',
    password: 'TestPass123',
    full_name: 'Sophia Taylor',
    avatar: '👩‍🏫',
    total_xp: 180,
    current_streak: 2,
    longest_streak: 4,
    verses_memorized: 8,
  },
];

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  for (const user of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  User ${user.email} already exists, skipping...`);
          continue;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user returned from auth.admin.createUser');
      }

      console.log(`✅ Created auth user: ${user.email} (${authData.user.id})`);

      // Create profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: user.email,
        full_name: user.full_name,
        avatar: user.avatar,
        total_xp: user.total_xp,
        current_streak: user.current_streak,
        longest_streak: user.longest_streak,
        verses_memorized: user.verses_memorized,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error(`❌ Failed to create profile for ${user.email}:`, profileError);
        continue;
      }

      console.log(`✅ Created profile: ${user.full_name}\n`);

      // Add daily streaks for pintayo
      if (user.email === 'pintayo@memoryverse.app') {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        await supabase.from('daily_streaks').upsert([
          {
            user_id: authData.user.id,
            practice_date: today.toISOString().split('T')[0],
            verses_practiced: 4,
            xp_earned: 150,
          },
          {
            user_id: authData.user.id,
            practice_date: yesterday.toISOString().split('T')[0],
            verses_practiced: 3,
            xp_earned: 120,
          },
          {
            user_id: authData.user.id,
            practice_date: twoDaysAgo.toISOString().split('T')[0],
            verses_practiced: 5,
            xp_earned: 180,
          },
        ]);

        // Add achievements
        await supabase.from('achievements').upsert([
          {
            user_id: authData.user.id,
            badge_type: 'streak',
            name: 'First Steps',
            description: 'Complete your first day',
            earned_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            user_id: authData.user.id,
            badge_type: 'verses',
            name: 'Memory Builder',
            description: 'Memorize 10 verses',
            earned_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            user_id: authData.user.id,
            badge_type: 'practice',
            name: 'Consistent Learner',
            description: 'Practice 3 days in a row',
            earned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);

        console.log(`✅ Added daily streaks and achievements for pintayo\n`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error);
    }
  }

  // Verify leaderboard
  console.log('\n📊 Verifying leaderboard...\n');
  const { data: leaderboard, error: leaderboardError } = await supabase
    .from('profiles')
    .select('full_name, total_xp, current_streak, verses_memorized')
    .order('total_xp', { ascending: false });

  if (leaderboardError) {
    console.error('❌ Error fetching leaderboard:', leaderboardError);
  } else {
    console.log('Top Users:');
    leaderboard?.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.full_name.padEnd(20)} ${user.total_xp} XP (${user.current_streak} day streak, ${user.verses_memorized} verses)`
      );
    });
  }

  console.log('\n✅ All test users created successfully!');
  console.log('\n📝 Test Account Credentials:');
  console.log('Email: pintayo@memoryverse.app');
  console.log('Password: Tijdelijk123');
}

createTestUsers().catch(console.error);
