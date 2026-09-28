import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rbxwvitoylrwznydlwcn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieHd2aXRveWxyd3pueWRsd2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjE1MjMsImV4cCI6MjEwNDQzNzUyM30.xUohVMVp0OkZy226rIfwuZ_0W9SBFAjEljswTr8dG58';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordChange() {
  console.log('Testing password change in Supabase...');

  const { data: before, error: err1 } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@example.com');

  console.log('User before update:', before, err1);

  const { data: updated, error: err2 } = await supabase
    .from('users')
    .update({ password_hash: 'admin123' })
    .eq('email', 'admin@example.com')
    .select();

  console.log('Updated result:', updated, err2);
}

testPasswordChange();


