import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 1 * 1024 * 1024; // 1MB

// POST /api/upload/tv-app-icon — Upload custom TV App icon
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const hotelId = formData.get('hotel_id') as string | null;
    const appId = formData.get('app_id') as string | null;

    if (!file || !hotelId || !appId) {
      return NextResponse.json({ error: 'File, hotel_id, and app_id are required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WebP, and SVG files are allowed' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be under 1MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${hotelId}/tv-apps/${appId}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('promos')
      .upload(`tv-apps/${fileName}`, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('promos')
      .getPublicUrl(`tv-apps/${fileName}`);

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
