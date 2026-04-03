import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { BellRing, ConciergeBell, Ticket, MapPin } from 'lucide-react';

export default async function MobileHomePage({
  params,
}: {
  params: Promise<{ hotelSlug: string; sessionId: string }>;
}) {
  const { hotelSlug, sessionId } = await params;
  const supabase = await createServerClient();

  const { data: session } = await supabase
    .from('mobile_sessions')
    .select('*, hotels(name, location, wifi_ssid, wifi_password, featured_image_url)')
    .eq('id', sessionId)
    .single();

  if (!session) return null;

  const hotel = session.hotels;

  return (
    <div className="p-5 space-y-6">
      {/* Welcome Hero */}
      <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden h-48 flex flex-col justify-end">
        {hotel?.featured_image_url && (
          <img src={hotel.featured_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        )}
        {!hotel?.featured_image_url && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 rounded-full blur-[80px] opacity-30"></div>
        )}
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Welcome back!</h2>
          <p className="text-slate-300 text-sm mb-4">Your room is connected to the mobile portal.</p>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-300 font-semibold mb-1 uppercase tracking-wider">Hotel Wi-Fi</p>
              <div className="flex gap-4">
                <p className="font-semibold text-sm">{hotel?.wifi_ssid || 'No WiFi'}</p>
                <p className="text-teal-400 font-mono text-sm">{hotel?.wifi_password || 'Ask Front Desk'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <h3 className="font-bold text-slate-800 text-lg px-2">Quick Access</h3>
      <div className="grid grid-cols-2 gap-4">
        <Link href={`/${hotelSlug}/mobile/${sessionId}/services`} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors active:scale-95">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-3">
            <ConciergeBell className="w-7 h-7" />
          </div>
          <span className="font-semibold text-slate-700">Order Service</span>
        </Link>
        <Link href={`/${hotelSlug}/mobile/${sessionId}/chat`} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors active:scale-95">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
            <BellRing className="w-7 h-7" />
          </div>
          <span className="font-semibold text-slate-700">Front Desk</span>
        </Link>
      </div>
      
      {/* Location */}
      {hotel?.location && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shrink-0">
             <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Location</h4>
            <p className="text-sm text-slate-500 leading-relaxed mt-1">{hotel.location}</p>
          </div>
        </div>
      )}
    </div>
  );
}
