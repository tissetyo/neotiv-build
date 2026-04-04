import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { pin } = body;

    if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    if (!pin) return NextResponse.json({ error: 'Missing PIN' }, { status: 400 });

    const supabase = await createServerClient();

    // Verify PIN first
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('pin')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.pin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Process Checkout: Clear guest details from room
    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        guest_name: null,
        guest_photo_url: null,
        custom_welcome_message: null,
        checkout_date: null,
      })
      .eq('id', roomId);

    if (updateError) {
      console.error('Checkout error:', updateError);
      return NextResponse.json({ error: 'Failed to update checkout status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Guest Checkout API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
