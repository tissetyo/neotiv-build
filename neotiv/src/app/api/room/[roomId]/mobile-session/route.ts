import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const hotelId = body.hotelId;

    if (!roomId || !hotelId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // 1-hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { data, error } = await supabase
      .from('mobile_sessions')
      .insert({
        hotel_id: hotelId,
        room_id: roomId,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error generating mobile session:', error);
      return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
