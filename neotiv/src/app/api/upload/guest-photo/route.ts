import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB for photos

// POST /api/upload/guest-photo — Upload guest photo and update room record
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const hotelId = formData.get('hotel_id') as string | null;
    const roomId = formData.get('room_id') as string | null;

    if (!file || !hotelId || !roomId) {
      return NextResponse.json({ error: 'File, hotel_id, and room_id are required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WebP files are allowed' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be under 2MB' }, { status: 400 });
    }

    const fileName = `${hotelId}/${roomId}/guest-photo.webp`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('room-assets')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Create signed URL (90-day expiry)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('room-assets')
      .createSignedUrl(fileName, 60 * 60 * 24 * 90); // 90 days

    if (signError || !signedData) {
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }

    // Update room record
    await supabaseAdmin.from('rooms').update({
      guest_photo_url: signedData.signedUrl,
    }).eq('id', roomId);

    return NextResponse.json({ success: true, url: signedData.signedUrl });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
