import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;
    const tv_layout_config = await request.json();

    const supabase = await createServerClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate permission
    const { data: access } = await supabase
      .from('staff')
      .select('role')
      .eq('user_id', user.id)
      .eq('hotel_id', hotelId)
      .eq('is_active', true)
      .single();

    if (!access || access.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can update TV settings' }, { status: 403 });
    }

    // Update config
    const { error } = await supabase
      .from('hotels')
      .update({ tv_layout_config })
      .eq('id', hotelId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
