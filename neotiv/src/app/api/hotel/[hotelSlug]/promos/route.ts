import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelSlug: string }> }
) {
  try {
    const { hotelSlug } = await params;
    if (!hotelSlug) {
      return NextResponse.json({ error: 'Missing hotelSlug' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Get hotel ID from slug
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('id')
      .eq('slug', hotelSlug)
      .single();

    if (hotelError || !hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Fetch active promos with poster
    const { data: promos, error } = await supabase
      .from('promos')
      .select('id, title, description, poster_url, valid_from, valid_until')
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)
      .not('poster_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch promos' }, { status: 500 });
    }

    return NextResponse.json({ promos: promos || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
