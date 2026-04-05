import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: pairing, error } = await supabase
      .from('stb_pairing_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !pairing) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 });
    }

    // Check if expired
    if (new Date(pairing.expires_at) < new Date()) {
      return NextResponse.json({ status: 'expired' });
    }

    // Still pending
    if (pairing.status === 'pending') {
      return NextResponse.json({ status: 'pending' });
    }

    // Paired! Return session data
    if (pairing.status === 'paired') {
      const redirectUrl = `/${pairing.hotel_slug}/dashboard/${pairing.room_code}/main`;
      return NextResponse.json({
        status: 'paired',
        sessionData: pairing.session_data,
        hotelSlug: pairing.hotel_slug,
        roomCode: pairing.room_code,
        redirectUrl,
      });
    }

    return NextResponse.json({ status: pairing.status });
  } catch (err) {
    console.error('Poll error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
