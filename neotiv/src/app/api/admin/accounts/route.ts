import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// POST /api/admin/accounts — Create a new staff account with password
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { email, password, name, role, hotel_id } = await request.json();

    if (!email || !password || !name || !role || !hotel_id) {
      return NextResponse.json({ error: 'All fields are required (email, password, name, role, hotel_id)' }, { status: 400 });
    }

    if (!['frontoffice', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be "frontoffice" or "manager".' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check hotel exists
    const { data: hotel } = await supabaseAdmin.from('hotels').select('id, name').eq('id', hotel_id).single();
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Create user with password directly (no email confirmation needed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so they can login immediately
      user_metadata: { role, hotel_id, name },
    });

    if (authError) {
      // Handle duplicate email
      if (authError.message.includes('already been registered') || authError.message.includes('unique')) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Insert into staff table
    if (authData.user) {
      const { error: staffError } = await supabaseAdmin.from('staff').insert({
        hotel_id,
        user_id: authData.user.id,
        role,
        name,
        email,
      });

      if (staffError) {
        console.error('Staff insert error:', staffError);
        // Don't fail the request — user is created, staff record is secondary
      }
    }

    try {
      await supabaseAdmin.from('activity_log').insert({
        action: 'staff.created',
        target_type: 'staff',
        target_id: authData.user?.id,
        meta: { email, name, role, hotel_id, hotel_name: hotel.name },
      });
    } catch { /* Non-critical */ }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
      },
      message: `Account created. ${name} can now login at /${hotel.name}/login with email: ${email}`,
    });
  } catch (err) {
    console.error('Account creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
