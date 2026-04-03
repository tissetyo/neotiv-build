import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import ServiceCatalogClient from './ServiceCatalogClient';

// Admin client for reading public catalog data (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function MobileServicesPage({
  params,
}: {
  params: Promise<{ hotelSlug: string; sessionId: string }>;
}) {
  const { hotelSlug, sessionId } = await params;

  // Validate session exists (using server client for cookie-based auth)
  const supabase = await createServerClient();
  const { data: session } = await supabase
    .from('mobile_sessions')
    .select('*, rooms(room_code)')
    .eq('id', sessionId)
    .single();

  if (!session) return null;

  // Use service role client to bypass RLS for reading catalog data
  const adminClient = getServiceClient();

  // Fetch all active services for this hotel
  const { data: services } = await adminClient
    .from('services')
    .select('*')
    .eq('hotel_id', session.hotel_id)
    .order('sort_order', { ascending: true });

  // Fetch all active options for those services
  const serviceIds = (services || []).map(s => s.id);
  const { data: options } = serviceIds.length > 0
    ? await adminClient
        .from('service_options')
        .select('*')
        .in('service_id', serviceIds)
    : { data: [] };

  return (
    <ServiceCatalogClient 
      services={services || []} 
      options={options || []} 
      sessionId={sessionId}
      roomCode={session.rooms?.room_code || ''}
      roomId={session.room_id}
      hotelId={session.hotel_id}
      hotelSlug={hotelSlug}
    />
  );
}
