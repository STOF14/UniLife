import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv'; // <--- 1. Import dotenv

// 2. Load the environment variables explicitly
// Try loading .env.local first, or fallback to .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Debugging: Print to console if it's still missing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is missing from process.env');
  console.error('   Make sure .env.local exists in the root folder!');
}

// Use Service Role Key for Admin access (bypasses Row Level Security)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_USER_EMAIL = 'test@unilife.com';
const TEST_USER_PASSWORD = 'password123';

setup('clean and seed database', async () => {
  console.log('🧹 Cleaning Database...');
  
  // 1. Clean public tables (Order matters due to Foreign Keys)
  // Deleting modules cascades to tasks/transactions if your DB is set up that way.
  // If not, delete child tables first.
  await supabase.from('transactions').delete().neq('id', 0);
  await supabase.from('tasks').delete().neq('id', 0);
  await supabase.from('modules').delete().neq('id', 0);

  console.log('🌱 Seeding User...');
  
  // 2. Ensure Test User Exists in Auth System
  // We try to sign up; if they exist, we just ignore the error.
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true, // Auto-confirm email
  });

  if (error && !error.message.includes('already registered')) {
    throw error;
  }

  console.log('✅ Database Ready & User Seeded');
});