import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Environment Credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'Server configuration error: Missing Supabase environment keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const body = await req.json().catch(() => ({}));

    // 2. Admin Authorization Check
    const authHeader = req.headers.get('Authorization') || '';
    let isAuthorizedAdmin = false;

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();

      // Only attempt getUser if token is a user JWT (not project anon key)
      if (token && token !== supabaseAnonKey) {
        try {
          const { data: { user: callerUser }, error: authError } = await adminClient.auth.getUser(token);
          if (!authError && callerUser?.email) {
            const { data: dbUser } = await adminClient
              .from('users')
              .select('role, is_active')
              .eq('email', callerUser.email)
              .maybeSingle();

            if (dbUser && dbUser.role === 'ADMIN' && dbUser.is_active === true) {
              isAuthorizedAdmin = true;
            }
          }
        } catch {
          // Token verification failed or not a user JWT
        }
      }
    }

    // Fallback: Verify adminEmail sent by application against public.users table
    if (!isAuthorizedAdmin && body.adminEmail) {
      const cleanAdminEmail = String(body.adminEmail).trim().toLowerCase();
      const { data: dbUser } = await adminClient
        .from('users')
        .select('role, is_active')
        .eq('email', cleanAdminEmail)
        .maybeSingle();

      if (dbUser && dbUser.role === 'ADMIN' && dbUser.is_active === true) {
        isAuthorizedAdmin = true;
      }
    }

    if (!isAuthorizedAdmin) {
      return new Response(
        JSON.stringify({ success: false, message: 'Forbidden: Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse & Validate Employee Fields
    const { name, email, phone, department, position, joiningDate } = body;

    if (!name || !email || !department || !position || !joiningDate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Validation Error: Missing required fields (name, email, department, position, joiningDate)'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return new Response(
        JSON.stringify({ success: false, message: 'Validation Error: Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 4. Duplicate Employee Check
    const { data: existingEmp } = await adminClient
      .from('employees')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingEmp) {
      return new Response(
        JSON.stringify({ success: false, message: 'Conflict: An employee with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Generate Sequential Employee ID (EMP-001, EMP-002...)
    const { data: allEmps } = await adminClient
      .from('employees')
      .select('employee_id');

    const empCount = allEmps ? allEmps.length : 0;
    const generatedEmployeeId = `EMP-${String(empCount + 1).padStart(3, '0')}`;

    // 6. Supabase Auth Invitation via Supabase SMTP ONLY (no third party)
    const siteUrl = req.headers.get('origin') || 'http://localhost:5173';
    const redirectTo = `${siteUrl}/set-password`;

    let authUser: any = null;
    let emailSent = false;
    let emailStatusMessage = '';

    // Check if user already exists in auth.users
    const { data: { users: existingAuthUsers } } = await adminClient.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.find(u => u.email?.toLowerCase() === cleanEmail);

    if (existingAuthUser) {
      authUser = existingAuthUser;
      // Send password setup / invite email via Supabase SMTP
      const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo
      });

      if (resetErr) {
        console.warn('Supabase SMTP recovery email warning:', resetErr.message);
        emailStatusMessage = resetErr.message;
        emailSent = false;
      } else {
        emailSent = true;
        emailStatusMessage = 'Sent via Supabase Auth SMTP';
      }
    } else {
      // Invite new user via Supabase Auth SMTP
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        cleanEmail,
        {
          redirectTo,
          data: {
            name: String(name).trim(),
            department: String(department).trim(),
            position: String(position).trim()
          }
        }
      );

      if (inviteError || !inviteData?.user) {
        console.warn('inviteUserByEmail failed:', inviteError?.message);
        emailStatusMessage = inviteError?.message || 'Supabase SMTP error';

        // Fallback: Create user in Supabase Auth and send recovery email via Supabase SMTP
        const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: false,
          user_metadata: {
            name: String(name).trim(),
            department: String(department).trim(),
            position: String(position).trim()
          }
        });

        if (createError || !createData?.user) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Auth Invitation Error: ${inviteError?.message || createError?.message || 'Failed to create user in Supabase Auth'}`
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        authUser = createData.user;
        const { error: recoveryErr } = await adminClient.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
        if (!recoveryErr) {
          emailSent = true;
          emailStatusMessage = 'Sent via Supabase Auth SMTP';
        } else {
          emailSent = false;
        }
      } else {
        authUser = inviteData.user;
        emailSent = true;
        emailStatusMessage = 'Sent via Supabase Auth SMTP';
      }
    }

    // 7. Insert or Upsert into `public.users` Table FIRST (Satisfies foreign key constraint!)
    const { error: userUpsertError } = await adminClient
      .from('users')
      .upsert([{
        id: authUser.id,
        email: cleanEmail,
        password_hash: '',
        role: 'EMPLOYEE',
        is_active: true
      }], { onConflict: 'email' });

    if (userUpsertError) {
      console.error('Users table upsert error:', userUpsertError);
    }

    // 8. Insert Record into `public.employees` Table
    const { data: insertedEmp, error: empInsertError } = await adminClient
      .from('employees')
      .insert([{
        user_id: authUser.id,
        employee_id: generatedEmployeeId,
        name: String(name).trim(),
        email: cleanEmail,
        phone: phone ? String(phone).trim() : '',
        department: String(department).trim(),
        position: String(position).trim(),
        joining_date: joiningDate,
        status: 'INVITED'
      }])
      .select()
      .single();

    if (empInsertError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Database Insert Error: ${empInsertError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Return Success Response
    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        emailStatusMessage,
        message: emailSent
          ? 'Employee invitation email sent successfully via Supabase SMTP'
          : `Employee account created successfully (${emailStatusMessage})`,
        employee: {
          id: insertedEmp.id,
          user_id: insertedEmp.user_id,
          employee_id: insertedEmp.employee_id,
          email: insertedEmp.email,
          name: insertedEmp.name,
          department: insertedEmp.department,
          position: insertedEmp.position,
          joining_date: insertedEmp.joining_date,
          status: insertedEmp.status
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: `Server Error: ${err.message || 'Unknown internal error'}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
