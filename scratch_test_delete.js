import { createClient } from '@supabase/supabase-js';

const url = 'https://rbxwvitoylrwznydlwcn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJieHd2aXRveWxyd3pueWRsd2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjE1MjMsImV4cCI6MjEwNDQzNzUyM30.xUohVMVp0OkZy226rIfwuZ_0W9SBFAjEljswTr8dG58';

const supabase = createClient(url, key);

async function test() {
  console.log('Fetching employees...');
  const { data: emps, error: fetchErr } = await supabase.from('employees').select('*');
  console.log('Employees count:', emps?.length, 'Fetch Error:', fetchErr);

  if (emps && emps.length > 0) {
    const target = emps[emps.length - 1];
    console.log('Attempting delete for employee ID:', target.id, 'Name:', target.name);

    const { error: delErr } = await supabase.from('employees').delete().eq('id', target.id);
    console.log('Employee Delete Error:', delErr);

    if (target.user_id) {
      const { error: userErr } = await supabase.from('users').delete().eq('id', target.user_id);
      console.log('User Delete Error:', userErr);
    }
  }
}

test();
