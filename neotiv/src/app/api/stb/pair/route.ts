import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { code, hotelSlug, roomCode } = await request.json();

    if (!code || !hotelSlug || !roomCode) {
      return NextResponse.json({ error: 'Missing required fields: code, hotelSlug, roomCode' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify pairing code exists and is pending
    const { data: pairing, error: pairingError } = await supabase
      .from('stb_pairing_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (pairingError || !pairing) {
      return NextResponse.json({ error: 'Invalid or expired pairing code' }, { status: 404 });
    }

    // 2. Find hotel by slug
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('*')
      .eq('slug', hotelSlug)
      .eq('is_active', true)
      .single();

    if (hotelError || !hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // 3. Find room by code
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', hotel.id)
      .eq('room_code', roomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // 4. Build full session data (same shape as room/login API)
    const sessionData = {
      roomId: room.id,
      hotelId: hotel.id,
      roomCode: room.room_code,
      guestName: room.guest_name,
      guestPhotoUrl: room.guest_photo_url,
      backgroundUrl: room.background_url || hotel.default_background_url,
      hotelName: hotel.name,
      hotelTimezone: hotel.timezone,
      hotelLocation: hotel.location,
      wifiSsid: hotel.wifi_ssid,
      wifiPassword: hotel.wifi_password,
      wifiUsername: hotel.wifi_username,
      checkoutDate: room.checkout_date,
      clockTimezones: [hotel.clock_timezone_1, hotel.clock_timezone_2, hotel.clock_timezone_3],
      clockLabels: [hotel.clock_label_1, hotel.clock_label_2, hotel.clock_label_3],
      airportCode: hotel.airport_iata_code,
      hotelFeaturedImageUrl: hotel.featured_image_url || null,
      welcomeMessage: room.custom_welcome_message,
      tvLayoutConfig: hotel.tv_layout_config,
    };

    // 5. Update pairing code with room data
    const { error: updateError } = await supabase
      .from('stb_pairing_codes')
      .update({
        hotel_id: hotel.id,
        room_id: room.id,
        room_code: room.room_code,
        hotel_slug: hotelSlug,
        status: 'paired',
        session_data: sessionData,
        paired_at: new Date().toISOString(),
      })
      .eq('id', pairing.id);

    if (updateError) {
      console.error('Pair update error:', updateError);
      return NextResponse.json({ error: 'Failed to pair device' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      roomCode: room.room_code,
      hotelName: hotel.name,
    });
  } catch (err) {
    console.error('Pair error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
