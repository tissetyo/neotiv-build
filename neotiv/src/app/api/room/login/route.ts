import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { hotelSlug, roomCode, pin } = await request.json();

    if (!hotelSlug || !roomCode || !pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role key for PIN verification (server-side only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find hotel by slug
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('*')
      .eq('slug', hotelSlug)
      .eq('is_active', true)
      .single();

    if (hotelError || !hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Find room by code and verify PIN
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', hotel.id)
      .eq('room_code', roomCode)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.pin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Return session data
    return NextResponse.json({
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
      clockTimezones: [hotel.clock_timezone_1, hotel.clock_timezone_2, hotel.clock_timezone_3],
      clockLabels: [hotel.clock_label_1, hotel.clock_label_2, hotel.clock_label_3],
      airportCode: hotel.airport_iata_code,
      welcomeMessage: room.custom_welcome_message,
      tvLayoutConfig: hotel.tv_layout_config,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
