import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// POST /api/admin/accounts — Create/invite a new staff account
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { email, name, role, hotel_id } = await request.json();

    if (!email || !name || !role || !hotel_id) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['frontoffice', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Invite user via Supabase Auth Admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { role, hotel_id, name },
      }
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Insert into staff table
    if (authData.user) {
      await supabaseAdmin.from('staff').insert({
        hotel_id,
        user_id: authData.user.id,
        role,
        name,
        email,
      });
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      action: 'staff.invited',
      target_type: 'staff',
      target_id: authData.user?.id,
      meta: { email, name, role, hotel_id },
    });

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
