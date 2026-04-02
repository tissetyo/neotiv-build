import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> } // Fix: wait for params in NextJS 15+
) {
  try {
    const { roomId } = await params;
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');
    if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });

    const supabase = await createServerClient();

    // 1. Get Unread Chat Count
    const { count: unreadChats } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact' })
      .eq('room_id', roomId)
      .eq('sender_role', 'frontoffice')
      .eq('is_read', false);

    // 2. Get latest active Notification (Broadcast or Room-specific)
    let notificationQuery = supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (hotelId) {
      notificationQuery = notificationQuery.eq('hotel_id', hotelId).or(`room_id.eq.${roomId},room_id.is.null`);
    } else {
      notificationQuery = notificationQuery.eq('room_id', roomId);
    }

    const { data: notifications } = await notificationQuery;

    return NextResponse.json({
      unreadChatCount: unreadChats || 0,
      latestNotification: notifications?.[0] || null
    });
  } catch (error: any) {
    console.error('Room Status API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
