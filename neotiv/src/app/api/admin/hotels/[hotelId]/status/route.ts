import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// PATCH /api/admin/hotels/[hotelId]/status — Activate/deactivate hotel
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const supabaseAdmin = getAdminClient();
    const { hotelId } = await params;
    const { is_active } = await request.json();

    // Update hotel status
    const { error: updateError } = await supabaseAdmin
      .from('hotels')
      .update({ is_active })
      .eq('id', hotelId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If deactivating, ban all staff for this hotel
    if (!is_active) {
      const { data: staffList } = await supabaseAdmin
        .from('staff')
        .select('user_id')
        .eq('hotel_id', hotelId);

      if (staffList) {
        for (const s of staffList) {
          if (s.user_id) {
            await supabaseAdmin.auth.admin.updateUserById(s.user_id, {
              ban_duration: '876600h', // ~100 years
            });
          }
        }
      }
    } else {
      // If reactivating, unban active staff
      const { data: staffList } = await supabaseAdmin
        .from('staff')
        .select('user_id')
        .eq('hotel_id', hotelId)
        .eq('is_active', true);

      if (staffList) {
        for (const s of staffList) {
          if (s.user_id) {
            await supabaseAdmin.auth.admin.updateUserById(s.user_id, {
              ban_duration: 'none',
            });
          }
        }
      }
    }

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      action: is_active ? 'hotel.reactivated' : 'hotel.deactivated',
      target_type: 'hotel',
      target_id: hotelId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
