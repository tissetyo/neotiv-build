import { createServerClient } from '@/lib/supabase/server';
import { Building2, MessageSquare, Bell, Clock, ConciergeBell } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function FrontOfficeHome({ params }: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = await params;
  const supabase = await createServerClient();

  // Get hotel ID
  const { data: hotel } = await supabase.from('hotels').select('id').eq('slug', hotelSlug).single();
  if (!hotel) redirect('/');

  // Aggregate Data
  const [roomsRes, chatRes, alarmsRes, requestsRes] = await Promise.all([
    supabase.from('rooms').select('id, is_occupied').eq('hotel_id', hotel.id),
    supabase.from('chat_messages').select('id').eq('hotel_id', hotel.id).eq('sender_role', 'guest').eq('is_read', false),
    supabase.from('alarms').select('id').eq('hotel_id', hotel.id).eq('is_acknowledged', false).gte('scheduled_time', new Date().toISOString()),
    supabase.from('service_requests').select('id').eq('hotel_id', hotel.id).eq('status', 'pending')
  ]);

  const totalRooms = roomsRes.data?.length || 0;
  const occupiedRooms = roomsRes.data?.filter(r => r.is_occupied).length || 0;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  
  const unreadChats = chatRes.data?.length || 0;
  const activeAlarms = alarmsRes.data?.length || 0;
  const pendingRequests = requestsRes.data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Front Desk Overview</h1>
           <p className="text-slate-500 text-sm mt-1">Here is what is happening right now.</p>
        </div>
        <div className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="text-right">
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Occupancy</p>
             <p className="text-lg font-bold text-slate-800">{occupancyRate}%</p>
           </div>
           <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="20" cy="20" r="18" fill="none" className="stroke-teal-500" strokeWidth="4" strokeDasharray={`${occupancyRate * 1.13} 113`} />
              </svg>
              <Building2 className="w-4 h-4 text-slate-600 z-10" />
           </div>
        </div>
      </div>

      {/* Action Items Grid */}
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-8 mb-4">Requires Attention</h2>
      <div className="grid grid-cols-3 gap-6">
        
        {/* Chat Card */}
        <Link href={`/${hotelSlug}/frontoffice/chat`} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all group relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-[40px] group-hover:bg-teal-100 transition-colors"></div>
           <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-4 border border-teal-100 relative z-10">
              <MessageSquare className="w-6 h-6" />
           </div>
           <div className="relative z-10">
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{unreadChats}</h3>
              <p className="text-slate-500 font-medium">Unread Guest Messages</p>
           </div>
           {unreadChats > 0 && <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>}
        </Link>
        
        {/* Service Requests */}
        <Link href={`/${hotelSlug}/frontoffice/service-requests`} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-md transition-all group relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-[40px] group-hover:bg-violet-100 transition-colors"></div>
           <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-4 border border-violet-100 relative z-10">
              <ConciergeBell className="w-6 h-6" />
           </div>
           <div className="relative z-10">
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{pendingRequests}</h3>
              <p className="text-slate-500 font-medium">Pending Service Requests</p>
           </div>
        </Link>
        
        {/* Alarms */}
        <Link href={`/${hotelSlug}/frontoffice/alarms`} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all group relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-[40px] group-hover:bg-rose-100 transition-colors"></div>
           <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-4 border border-rose-100 relative z-10">
              <Clock className="w-6 h-6" />
           </div>
           <div className="relative z-10">
              <h3 className="text-3xl font-bold text-slate-800 mb-1">{activeAlarms}</h3>
              <p className="text-slate-500 font-medium">Upcoming Wake-up Alarms</p>
           </div>
        </Link>

      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-2 gap-6 mt-8">
         <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Quick Shortcuts</h3>
            <div className="space-y-3">
               <Link href={`/${hotelSlug}/frontoffice/notifications`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="font-semibold text-slate-700">Broadcast Notification</p>
                     <p className="text-xs text-slate-500">Send an alert to TVs in the rooms</p>
                  </div>
               </Link>
            </div>
         </div>
         <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-[100px] opacity-20"></div>
            <h3 className="font-bold text-xl mb-2">Welcome to Neotiv Front Desk</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
               This dashboard gives you a bird's eye view of all active requests, messages, and alerts across the property. Stay on top of guest needs seamlessly.
            </p>
            <div className="flex gap-4">
               <div className="bg-white/10 border border-white/20 rounded-lg py-2 px-4 backdrop-blur-md">
                 <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Total Rooms</p>
                 <p className="text-xl font-bold">{totalRooms}</p>
               </div>
               <div className="bg-white/10 border border-white/20 rounded-lg py-2 px-4 backdrop-blur-md">
                 <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Occupied</p>
                 <p className="text-xl font-bold">{occupiedRooms}</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
