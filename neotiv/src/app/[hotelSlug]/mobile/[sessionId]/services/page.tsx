import { createServerClient } from '@/lib/supabase/server';
import ServiceCatalogClient from './ServiceCatalogClient';

export default async function MobileServicesPage({
  params,
}: {
  params: Promise<{ hotelSlug: string; sessionId: string }>;
}) {
  const { hotelSlug, sessionId } = await params;
  const supabase = await createServerClient();

  // Validate session to get room and hotel context
  const { data: session } = await supabase
    .from('mobile_sessions')
    .select('*, rooms(room_code)')
    .eq('id', sessionId)
    .single();

  if (!session) return null;

  // Fetch all active services for this hotel
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('hotel_id', session.hotel_id)
    .order('sort_order', { ascending: true });

  // Fetch all active options
  const { data: options } = await supabase
    .from('service_options')
    .select('*')
    .in('service_id', (services || []).map(s => s.id));

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
