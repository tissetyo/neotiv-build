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

    const { data: hotel, error } = await supabase
      .from('hotels')
      .select('tv_layout_config')
      .eq('slug', hotelSlug)
      .single();

    if (error || !hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    return NextResponse.json({ tvLayoutConfig: hotel.tv_layout_config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
