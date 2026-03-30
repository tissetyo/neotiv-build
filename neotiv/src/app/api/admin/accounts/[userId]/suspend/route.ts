import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// PATCH /api/admin/accounts/[userId]/suspend — Suspend/reactivate account
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabaseAdmin = getAdminClient();
    const { userId } = await params;
    const { suspended } = await request.json();

    if (suspended) {
      // Ban user (~100 years)
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '876600h',
      });
      // Mark staff as inactive
      await supabaseAdmin.from('staff').update({ is_active: false }).eq('user_id', userId);
    } else {
      // Unban user
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });
      // Mark staff as active
      await supabaseAdmin.from('staff').update({ is_active: true }).eq('user_id', userId);
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      action: suspended ? 'staff.suspended' : 'staff.reactivated',
      target_type: 'staff',
      target_id: userId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
