import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rbxwvitoylrwznydlwcn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieHd2aXRveWxyd3pueWRsd2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjE1MjMsImV4cCI6MjEwNDQzNzUyM30.xUohVMVp0OkZy226rIfwuZ_0W9SBFAjEljswTr8dG58';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAdmin() {
  console.log('Seeding Admin details in Supabase...');
  const adminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const adminEmail = 'admin@example.com';

  // 1. Upsert User
  const { data: user, error: userErr } = await supabase
    .from('users')
    .upsert([
      {
        id: adminId,
        email: adminEmail,
        password_hash: 'admin123',
        role: 'ADMIN',
        is_active: true
      }
    ], { onConflict: 'email' })
    .select();

  if (userErr) {
    console.error('User seed error:', userErr.message);
  } else {
    console.log('Admin user record created in Supabase:', user);
  }

  // 2. Upsert Employee
  const { data: emp, error: empErr } = await supabase
    .from('employees')
    .upsert([
      {
        id: 'e1111111-1111-1111-1111-111111111111',
        user_id: adminId,
        employee_id: 'EMP-001',
        name: 'Sarah Jenkins (Admin)',
        email: adminEmail,
        phone: '+1 (555) 019-2834',
        department: 'Management',
        position: 'HR Director',
        joining_date: '2023-01-15',
        status: 'ACTIVE'
      }
    ], { onConflict: 'email' })
    .select();

  if (empErr) {
    console.error('Employee seed error:', empErr.message);
  } else {
    console.log('Admin employee record created in Supabase:', emp);
  }
}

seedAdmin();
