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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Expire any old pending codes
    await supabase
      .from('stb_pairing_codes')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    // Generate unique code with retry
    let code = '';
    let attempts = 0;
    while (attempts < 5) {
      code = generateCode();
      const { data: existing } = await supabase
        .from('stb_pairing_codes')
        .select('id')
        .eq('code', code)
        .eq('status', 'pending')
        .single();
      
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
      .select()
      .single();

    if (error) {
      console.error('Generate code error:', error);
      return NextResponse.json({ error: 'Failed to create pairing code' }, { status: 500 });
    }

    return NextResponse.json({
      code: data.code,
      expiresAt: data.expires_at,
    });
  } catch (err) {
    console.error('Generate code error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
