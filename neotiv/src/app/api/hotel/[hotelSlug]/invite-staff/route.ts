import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ hotelSlug: string }> }): Promise<NextResponse> {
  try {
    const { hotelSlug } = await params;
    const { email, name, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find hotel
    const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Invite user via Supabase Auth Admin
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { role, hotel_id: hotel.id, name },
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    // Insert to staff table
    await supabase.from('staff').insert({
      hotel_id: hotel.id,
      user_id: inviteData.user.id,
      role,
      name,
      email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
