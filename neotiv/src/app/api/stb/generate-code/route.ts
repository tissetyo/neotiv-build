import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function generateCode(): string {
  // 6-char uppercase alphanumeric, avoiding confusing chars (0/O, 1/I/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(): Promise<NextResponse> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error (missing Service Role Key)' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Expire any old pending codes
    const { error: cleanupError } = await supabase
      .from('stb_pairing_codes')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    if (cleanupError && cleanupError.code === 'PGRST116') {
      // Table might not exist or be empty, handled later
    }

    // Generate unique code with retry
    let code = '';
    let attempts = 0;
    while (attempts < 5) {
      code = generateCode();
      const { data: existing, error: checkError } = await supabase
        .from('stb_pairing_codes')
        .select('id')
        .eq('code', code)
        .eq('status', 'pending')
        .maybeSingle(); // Better than single() which errors if 0 found
      
      if (checkError) throw checkError;
      if (!existing) break;
      attempts++;
    }

    if (!code) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('stb_pairing_codes')
      .insert({
        code,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select('code, expires_at')
      .single();

    if (error || !data) {
      console.error('Generate code error:', error);
      const msg = error?.message?.includes('relation "stb_pairing_codes" does not exist')
        ? 'Database table "stb_pairing_codes" missing. Please run the migration.'
        : 'Failed to create pairing code in database.';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({
      code: data.code,
      expiresAt: data.expires_at,
    });
  } catch (err: any) {
    console.error('Generate code server error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
