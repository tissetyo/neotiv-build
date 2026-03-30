import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// POST /api/admin/hotels — Create a new hotel + seed default services
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { name, slug, location, timezone } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from('hotels')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    // Create hotel
    const { data: hotel, error: hotelError } = await supabaseAdmin
      .from('hotels')
      .insert({
        name,
        slug,
        location: location || null,
        timezone: timezone || 'Asia/Jakarta',
      })
      .select()
      .single();

    if (hotelError || !hotel) {
      return NextResponse.json({ error: hotelError?.message || 'Failed to create hotel' }, { status: 500 });
    }

    // Seed default services
    const defaultServices = [
      { name: 'Room Service', icon: '🍽️', sort_order: 0 },
      { name: 'Laundry', icon: '👕', sort_order: 1 },
      { name: 'Spa', icon: '💆', sort_order: 2 },
      { name: 'Car Rental', icon: '🚗', sort_order: 3 },
      { name: 'Scooter', icon: '🛵', sort_order: 4 },
      { name: 'Restaurant', icon: '🍴', sort_order: 5 },
    ];

    await supabaseAdmin.from('services').insert(
      defaultServices.map((s) => ({ ...s, hotel_id: hotel.id }))
    );

    // Log activity
    await supabaseAdmin.from('activity_log').insert({
      action: 'hotel.created',
      target_type: 'hotel',
      target_id: hotel.id,
      meta: { hotel_name: name, slug },
    });

    return NextResponse.json({ success: true, hotel });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
